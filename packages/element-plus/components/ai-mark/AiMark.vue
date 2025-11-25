<template>
  <div v-if="enable || $slots.extra || extra" :class="['operate', headClass]">
    <div v-if="enable" class="flex items-center btns">
      <span
        v-for="item in drawOptions"
        :key="item.value"
        :class="item.value === drawMode ? 'active' : ''"
        @click="handleDrawModel(item.value)"
      >
        <el-tooltip :content="item.label" placement="top">
          <i :class="['iconfont', drawModeIconMap?.[item.value]]" />
        </el-tooltip>
      </span>
      <span @click="reset">
        <el-tooltip content="重置" placement="top">
          <i class="iconfont icon-zhongzhi" />
        </el-tooltip>
      </span>
      <span v-if="drawMode && isDrawing" @click="cancel">
        <el-tooltip content="取消绘制" placement="top">
          <i class="iconfont icon-guanbi" />
        </el-tooltip>
      </span>
    </div>

    <template v-if="$slots.extra || extra">
      <slot name="extra">{{ extra }}</slot>
    </template>
  </div>
  <div ref="mapEl" class="map">
    <div
      :id="stageID"
      :class="['stage', { 'is-drawing': isDrawing }, { 'is-image': !!props.imageSrc }]"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { ref, onMounted, reactive, computed } from 'vue'
import { watchDebounced,useElementSize } from '@vueuse/core'
import { ElMessage } from 'element-plus'
const props = defineProps({
  data: Object,
  enable: Boolean, // 图片地址
  imageSrc: String,
  extra: { type: String, default: '' }, // 是否绘制多个
  multiple: { type: Boolean, default: true }, // 绘制类型
  calculate: { type: Boolean, default: false }, // 是否需要计算比例，4宫格切换scale需要重新计算
  modes: { type: Array, default: () => [] },
  rw: { type: Number, default: 0 }, // 需要换算的width
  rh: { type: Number, default: 0 }, // 需要换算的height
  // 头部自定类名
  headClass: { type: String, default: '' },
  style: Object, // 绘制通用的样式
  pointStyle: Object, // 绘制点的样式
  textStyle: Object, // 绘制点的样式
  manualReset: { type: Function, default: undefined }
})

const emit = defineEmits(['change', 'reset'])

type IPoint = {
  x: number
  y: number
}

enum drawModeKey {
  平移 = 'PAN',
  禁用平移 = 'BAN',
  矩形 = 'RECT',
  多边形 = 'POLYGON',
  线 = 'LINE',
  多段线 = 'POLYLINE',
  点 = 'POINT'
}

const drawStyle = reactive({
  lineWidth: 2,
  strokeStyle: 'red',
  fillStyle: 'rgba(255, 255, 255, .2)',
  fill: true,
  zIndex: 10,
  ...props.style
})
watchDebounced(
  () => props.style,
  () => {
    drawStyle.strokeStyle = props.style?.strokeStyle || 'red'
  },
  { immediate: true, debounce: 100 }
)
const shapeUtils: { [key: string]: any } = {
  [drawModeKey.矩形]: {
    getPoints: (shape: { x: number; y: number; width: number; height: number }) => {
      try {
        const { x, y, width, height } = shape
        return [x, y, x + width, y, x + width, y + height, x, y + height]
      } catch (err) {
        return []
      }
    },
    getShape: (data: number[]) => {
      const x0 = data?.[0] || 0
      const y0 = data?.[1] || 0
      const x1 = data?.[2] || 0
      const y1 = data?.[5] || 0
      return {
        x: x0,
        y: y0,
        width: x1 - x0,
        height: y1 - y0
      }
    }
  },
  [drawModeKey.多边形]: {
    getPoints: (shape: IPoint[]) => {
      return _.reduce(
        shape,
        (pre: any[], cur: IPoint) => {

          return _.concat(pre, _.values(cur))
        },
        []
      )
    },
    getShape: (data: number[]) => {
      return _.reduce(
        _.chunk(data, 2),
        (pre:any[], cur: number[]) => {
          return _.concat(pre, { x: _.first(cur), y: _.last(cur) })
        },
        {}
      )
    }
  },
  [drawModeKey.线]: {
    getPoints: (shape: { start: IPoint; end: IPoint }) => {
      return _.concat(_.values(shape.start), _.values(shape.end))
    },
    getShape: (data: number[]) => {
      const x0 = data?.[0] || 0
      const y0 = data?.[1] || 0
      const x1 = data?.[2] || 0
      const y1 = data?.[3] || 0
      return {
        start: { x: x0, y: y0 },
        end: { x: x1, y: y1 }
      }
    }
  },
  [drawModeKey.多段线]: {
    getPoints: (shape: { points: IPoint[] }) => {
      return _.reduce(
        shape,
        (pre: any[], cur: IPoint) => {
          return _.concat(pre, _.values(cur))
        },
        []
      )
    },
    getShape: (data: number[]) => {
      return _.reduce(
        _.chunk(data, 2),
        (pre: any[], cur: number[]) => {
          return _.concat(pre, { x: _.first(cur), y: _.last(cur) })
        },
        {}
      )
    }
  },
  [drawModeKey.点]: {
    getPoints: (shape: IPoint) => {
      return _.values(shape)
    },
    getShape: (data: number[]) => {
      return { x: data?.[0] || 0, y: data?.[1] || 0 }
    }
  }
}

// 默认需要转换的比例大小
// const nw = 1920
// const nh = 1080

const stageID = ref(_.uniqueId('stage'))
const mapEl = ref(null)
// 不在图片图层绘制时绘制区域的大小
const { width = 1920, height = 1080 }: any = useElementSize(mapEl)
const drawMode = ref('')
const stage = ref()
const featureLayer = ref()
const imageLayer = ref()
const textLayer = ref()
const shapes = ref()
const drawDoneData = ref()
// 图片的大小
const imageSize = reactive({ width: 1920, height: 1080 })

const drawModes = [
  { label: '绘制点', value: drawModeKey.点 },
  { label: '绘制矩形', value: drawModeKey.矩形 },
  { label: '多边形', value: drawModeKey.多边形 }
  // { label: '多线段', value: drawModeKey.多段线 }
]

const drawModeIconMap: { [k: string]: any } = {
  [drawModeKey.点]: 'icon-circle',
  [drawModeKey.线]: 'icon-jianqu2x',
  [drawModeKey.矩形]: 'icon-rectangle',
  [drawModeKey.多边形]: 'icon-duobianxing'
}

// 自定义绘制类型
const drawOptions: any = computed(() => {
  if (_.isEmpty(props.modes)) return drawModes
  return props.modes
})

// 是否绘制中
const isDrawing = computed(
  () => !_.includes([drawModeKey.平移, drawModeKey.禁用平移], drawMode.value)
)

// 真实的需要转换的比例大小
const targetWidth = computed(() => (props.imageSrc ? imageSize.width : width.value))
const targetHeight = computed(() => (props.imageSrc ? imageSize.height : height.value))

// 数据回显
function formartData() {
  empty()
  shapes.value = _.map(props?.data, (d) => {
    const points = _.map(d?.points, (p, index: number) =>
      toRealSize(targetWidth.value, targetHeight.value, p, index % 2 === 0)
    )
    const shape = {
      ...d,
      points: shapeUtils?.[d?.type]?.getShape?.(points)
    }
    if (d?.style) {
      drawStyle.strokeStyle = d?.style?.strokeStyle || 'red'
    }
    //  demo缩放，重新初始化
    sizeFlagFun()
    drawShape(shape)
    // 文本标注
    let gText
    if (d?.value) {
      gText = addText(points?.[0], points?.[1], d?.value, undefined, `text-${d?.uuid}`)
    }
    if (d?.del && points?.[2] && points?.[1]) {
      addDel(
        points?.[2],
        points?.[1],
        {
          x: 0,
          y: 15
        },
        '',
        d?.uuid,
        gText?.id
      )
    }

    const _points = shapeUtils?.[d?.type]?.getPoints?.(shape.points)
    return { ...shape, points: _points }
  })
}

let AiLabel: any // 用于后续赋值使用

onMounted(async () => {
  if (typeof window !== 'undefined') {
    const mod = await import('ailabel')
    AiLabel = mod.default || mod

    if (!props.imageSrc) {
      init(width.value, height.value)
    } else {
      setImageLayer()
    }
  }
})

watchDebounced(
  () => [props.imageSrc],
  () => {
    // 添加图片图层
    if (props.imageSrc) setImageLayer()
  },
  { debounce: 100, immediate: true }
)

watchDebounced(
  () => [props?.data],
  () => {
    formartData()
  },
  { debounce: 100, immediate: true }
)

// 监听绘制区域大小的变化
const sizeFlag = ref(false)
watchDebounced(
  () => [width, height],
  () => {
    stage.value?.resize()
    sizeFlag.value = true
  },
  { deep: true, immediate: true, debounce: 100 }
)
function sizeFlagFun() {
  if (sizeFlag.value) {
    if (!props.imageSrc) init(width.value, height.value)
    if (props.imageSrc) setImageLayer()
    sizeFlag.value = false
  }
}
// 图片大小 / div大小
function init(width: number, height: number) {
  if (!AiLabel) return
  stage.value = new AiLabel.Map(stageID.value, {
    zoom: width,
    center: {
      x: width / 2,
      y: height / 2
    },
    zoomWhenDrawing: true,
    panWhenDrawing: true
  })
  featureLayer.value = new AiLabel.Layer.Feature('feature', { name: '_feature' }, { zIndex: 10 })
  // 文本图层
  textLayer.value = new AiLabel.Layer.Text('text', { name: '_text' }, { zIndex: 10, opacity: 1 })
  stage.value?.setDrawingStyle(drawStyle)
  stage.value?.addLayer(featureLayer.value)
  stage.value?.addLayer(textLayer.value)
  // 监听绘制完成事件
  stage.value.events.on('drawDone', drawDone)
  stage.value.events.on('featureSelected', (feature: any) => {
    stage.value.setActiveFeature(feature)
  })
  stage.value.events.on('featureUnselected', () => {
    stage.value.setActiveFeature(null)
  })
  stage.value.events.on('featureUpdated', (feature: any, shape: any) => {
    feature.updateShape(shape)
  })
}

function drawShape(shape: { type: drawModeKey; uuid: string; points: any }) {
  const scale = stage.value?.getScale?.()
  switch (shape?.type) {
    case drawModeKey.矩形:
      featureLayer.value?.addFeature?.(
        new AiLabel.Feature.Rect(shape?.uuid, shape?.points || [], { name: shape?.uuid }, drawStyle)
      )
      break
    case drawModeKey.多边形:
      featureLayer.value?.addFeature?.(
        new AiLabel.Feature.Polygon(
          shape?.uuid,
          { points: shape?.points || [] },
          { name: shape?.uuid },
          drawStyle
        )
      )
      break
    case drawModeKey.线:
      featureLayer.value?.addFeature?.(
        new AiLabel.Feature.Line(
          shape?.uuid,
          {
            ...shape?.points,
            width: drawStyle.lineWidth / scale
          },
          { name: shape?.uuid },
          {
            ...drawStyle,
            lineWidth: drawStyle.lineWidth / scale
          }
        )
      )
      break
    case drawModeKey.多段线:
      featureLayer.value?.addFeature?.(
        new AiLabel.Feature.Polyline(
          shape?.uuid,
          { points: shape?.points || [] },
          { name: shape?.uuid },
          drawStyle
        )
      )
      break
    case drawModeKey.点:
      featureLayer.value?.addFeature?.(
        new AiLabel.Feature.Point(
          shape?.uuid,
          { ...shape?.points, sr: 4 },
          { name: shape?.uuid },
          { ...drawStyle, fillStyle: 'red', ...props?.pointStyle }
        )
      )
      break
    default:
      break
  }
}

// 文本展示
function addText(x = 0, y = 0, text = '', offset = { x: 2, y: 2 }, id = '') {
  const uuid = id || _.uniqueId('text')
  const gText = new AiLabel.Text(
    uuid,
    { text, position: { x: x, y }, offset },
    { name: `${uuid}_text` },
    {
      background: false,
      fontColor: 'red',
      fontSize: 9,
      ...props.textStyle
    }
  )
  textLayer.value?.addText(gText)
  return gText
}
// 添加删除
function addDel(x = 0, y = 0, offset = { x: 2, y: 2 }, id = '', featureId = '', textId = '') {
  const uuid = id || _.uniqueId('del')
  const deleteMarker = new AiLabel.Marker(uuid, {
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAUhJREFUOE+lkztLA0EUhc8N7IhgYyEI6iwIeayW/gJLf4Bv8FHYWNhZJ7a2Ymstiq1gJ2KpCDaZEFB2VzEgKNpIdpNcWdks+7bIdDOc+3HuPXcIAx4asB4BoKEPLTDzSMVyzvOgShfrBPosm+1LTxcAlBTsPTBwYFhOLQ1Sl6JGQBXM1xXbnY8DFgGcZUGCYsAtEFZLpnMRAXgXJUUqpF9MwFeXaG3Gt58ApEF8URXAW4F7KyW7cxNuLzWFsBNf/MTgJcNy7+OzyYxRSXEKYPm/waY70MUJGNsAXABaHiQBUFPaMYh2AXwTY5PpD5CZTgSgpDgEsA+gxUxbht2+yksnkkIo52dCb6NsdW7DA6tLbY5Ad/F2wpvo2ZzuEu/Mmu5D2iY+SowKiA8GHxmWu5fYg+Y4xootvOf9hebE8GTx9eelrxn4N/4CP3eMEeUbfKwAAAAASUVORK5CYII=',
    position: { x, y },
    offset,
    featureId
  })
  stage.value?.markerLayer?.addMarker(deleteMarker)
  deleteMarker.events.on('click', () => {
    removeFeatureById(deleteMarker.markerInfo.featureId)
    removeTextById(textId)
    stage.value?.markerLayer?.removeMarkerById(deleteMarker.id)
    emit('change', getRealShapes())
  })
}

// 删除指定图层
function removeFeatureById(id: string) {
  featureLayer.value?.removeFeatureById(id)
  shapes.value = _.filter(shapes.value, (item:any) => item?.uuid !== id)
}

// 删除指定文本图层
function removeTextById(id: string) {
  textLayer.value?.removeTextById(id)
}
function removeAllTexts() {
  textLayer.value?.removeAllTexts()
}
function removeAllMarkers() {
  stage.value?.markerLayer?.removeAllMarkers()
}
// 绘制完成
function setDrawDoneData(data: null | { [key: string]: any }) {
  drawDoneData.value = data
  const points = shapeUtils?.[data?.type]?.getPoints?.(data?.points)
  shapes.value = [
    ...shapes.value,
    {
      ...data,
      points
    }
  ]
  // data: 单个绘制层
  emit('change', getRealShapes(), data)
}

// 绘制完成的监听事件
function drawDone(type: drawModeKey, data: any) {
  // 单个绘制时清空前端绘制的
  if (!props.multiple) {
    featureLayer.value?.removeAllFeatures()
    shapes.value = ''
  }
  const uuid = _.uniqueId('mark')
  const shape = {
    uuid,
    type,
    points: data,
    desc: description.value
  }
  // 是否超出绘制区域
  if (isOverDiv(data)) return
  drawShape(shape)
  setDrawDoneData(shape)
}

function getRealSize(p: number, isx: boolean) {
  const scale = stage.value?.getScale?.()
  const w = props.rw || imageSize.width
  const h = props.rh || imageSize.height
  const bw = targetWidth.value
  const bh = targetHeight.value
  const x = _.isNumber(p) ? p / (bw / w) : 0
  const y = _.isNumber(p) ? p / (bh / h) : 0
  if (props.calculate) return isx ? x * scale : y * scale
  return isx ? x : y
}

function toRealSize(bw: number, bh: number, p: number, isx: boolean) {
  const w = props.rw || imageSize.width
  const h = props.rh || imageSize.height
  const x = _.isNumber(p) ? p * (bw / w) : 0
  const y = _.isNumber(p) ? p * (bh / h) : 0
  return isx ? x : y
}

// 判断画线是否超出图片/div
function isOverDiv(p: { x: number; y: number; width?: number; height?: number }) {
  const scale = stage.value?.getScale?.()
  const w = p?.width || 0
  const h = p?.height || 0
  const divW = props.imageSrc ? imageSize.width : width.value
  const divH = props.imageSrc ? imageSize.height : height.value
  let isOver = false
  // 修复多个视频播放绘制时，第一个框比例没有对应调整（小于1），需要手动换算下（divW / scale）
  if (props.calculate)
    isOver = p.x < 0 || p.y < 0 || p.x + w > divW / scale || p.y + h > divH / scale
  else isOver = p.x < 0 || p.y < 0 || p.x + w > divW || p.y + h > divH
  if (isOver) ElMessage.warning('标注不允许超出图片外')
  return isOver
}
const description = ref('')
// 开始绘制
function handleDrawModel(mode: string, desc?: string) {
  console.log(mode, desc)
  //  demo缩放，重新初始化
  sizeFlagFun()
  description.value = desc ? desc : ''
  drawMode.value = mode
  stage.value?.setMode?.(mode)
}
// 取消绘制
function cancel() {
  // 没有图片图层不给缩放
  stage.value?.setMode?.(props.imageSrc ? drawModeKey.平移 : drawModeKey.禁用平移)
  drawMode.value = drawModeKey.平移
}

// 清空
function empty() {
  featureLayer.value?.removeAllFeatures()
  textLayer.value?.removeAllTexts()
  shapes.value = ''
  cancel()
}

// 重置
function reset() {
  // 自定义重置function
  if (props.manualReset) return props.manualReset(empty)
  empty()
  // 重置时外部需要清空数据，需要回调一下
  emit('reset')
}

// 转换成需要比例的, 默认是1920 * 1080
function getRealShapes() {
  return _.map(shapes.value, (item:any) => {
    return {
      ...item,
      points: _.map(item?.points, (point:any, index: number) => {
        const _point = getRealSize(point, index % 2 === 0)
        return _.floor(_point)
      })
    }
  })
}
// 加载图片
function loadImage(imageSrc: string) {
  return new Promise<{
    width: number
    height: number
  }>((resolve, reject) => {
    const img: null | HTMLImageElement = new Image()
    img.src = imageSrc
    img.onload = (e: any) => {
      const target = e.target
      resolve({ width: target?.naturalWidth, height: target?.naturalHeight })
    }
    img.onerror = () => {
      reject()
    }
  })
}

// 更新图片图层
function updateImageLayer(src: string) {
  imageLayer.value?.updateImageInfo({ src })
}

// 图片图层
function setImageLayer() {
  if (!props.imageSrc) return
  if (imageLayer.value) return updateImageLayer(props.imageSrc)
  stage.value?.removeLayerById('_image')
  empty()
  loadImage(props.imageSrc).then(({ width, height }) => {
    init(width, height)
    imageSize.width = width
    imageSize.height = height
    imageLayer.value = new AiLabel.Layer.Image('_image', {
      src: props.imageSrc,
      crossOrigin: false,
      width,
      height
    })
    stage.value.addLayer(imageLayer.value)
    formartData()
  })
}

defineExpose({
  width: width,
  height: height,
  shapes: shapes,
  removeFeatureById,
  removeTextById,
  draw: handleDrawModel,
  empty,
  cancel,
  reset,
  addText,
  getRealSize,
  removeAllTexts,
  addDel,
  removeAllMarkers
})
</script>

<style scoped>
.active {
  color: #2316d6;
}
.operate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  cursor: pointer;

  .el-space {
    flex-shrink: 0;
  }
  .btns {
    padding: 4px 8px;
    border: 1px solid #2316d6;
    border-radius: 4px;
    .iconfont {
      font-size: 14px;
    }
    span + span {
      margin-left: 8px;
    }
  }
}
.map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.stage {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  right: 0;
}
:deep(.stage:not(.is-drawing):not(.is-image) > div:last-child) {
  z-index: 6;
  pointer-events: none;
}
:deep(.is-drawing > div:last-child) {
  z-index: 9;
}
</style>
