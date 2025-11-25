<template>
  <div
    class="timeLineContainer"
    ref="timeLineContainer"
    :style="{
      backgroundColor: backgroundColor
    }"
    @mousedown="onMousedown"
    @mouseout="onMouseout"
    @mousemove="onMousemove"
    @mouseleave="onMouseleave"
  >
    <canvas class="canvas" ref="canvas" @mousewheel.stop.prevent="onMouseweel"></canvas>
    <div
      class="windowList"
      ref="windowList"
      v-if="showWindowList && windowList && windowList.length > 0"
      @scroll="onWindowListScroll"
    >
      <WindowItemList
        v-for="item in windowListInner"
        ref="WindowListItem"
        :name="item.name"
        :key="item.index"
        :index="item.index"
        :data="item"
        :totalMS="totalMS"
        :startTimestamp="startTimestamp"
        :width="divWidth"
        :active="item.active"
        @click_window_timeSegments="triggerClickWindowTimeSegments"
        @click="toggleActive(item.index)"
      ></WindowItemList>
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import {
  ONE_HOUR_STAMP,
  ZOOM,
  ZOOM_HOUR_GRID,
  ZOOM_DATE_SHOW_RULE,
  type TimeRange,
  type CenterLineStyle,
  type TimeSegment,
  type WindowList,
  type LineHeightRatio,
  type ExtendZOOM,
  type WindowListInner,
  type WatchTime
} from './constant'
import WindowItemList from './WindowItemList.vue'
import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    initTime?: number | string // 初始时间，中点所在的时间，默认为当天0点
    timeRange?: TimeRange // 显示预览的时间范围，即中间刻度所允许的时间范围
    initZoomIndex?: number // 初始的时间分辨率
    showCenterLine?: boolean //是否显示中间的竖线
    centerLineStyle?: CenterLineStyle // 中线样式
    textColor?: string // 日期时间文字颜色
    hoverTextColor?: string // 鼠标滑过显示的时间文字颜色
    lineColor?: string //时间线段颜色
    lineHeightRatio?: LineHeightRatio //时间线段高度占时间轴高度的比例
    showHoverTime?: boolean // 鼠标滑过时是否显示实时所在的时间
    hoverTimeFormat?: Function // 格式化鼠标滑过时间
    timeSegments?: TimeSegment[] // 要显示的时间颜色段
    backgroundColor?: string // 时间轴背景颜色
    enableZoom?: boolean // 是否允许缩放
    enableDrag?: boolean //是否允许拖动
    windowList?: WindowList[] //窗口列表，如果窗口数量大于0的话可以配置此项，会显示和窗口对应数量的时间轴，只有一个窗口的话可以直接使用基本时间轴,
    baseTimeLineHeight?: number //当显示windowList时的基础时间轴高度
    initSelectWindowTimeLineIndex?: number //初始化选中的窗口时间轴索引
    maxClickDistance?: number // 鼠标按下和松开的距离小于该值认为是点击事件
    roundWidthTimeSegments?: boolean //绘制时间段时对计算出来的坐标进行四舍五入，可以防止相连的时间段绘制出来有间隔的问题
    customShowTime?: Function //自定义显示时间
    showDateAtZero?: boolean // 0点处是否显示日期
    extendZOOM?: ExtendZOOM[] // 扩展ZOOM列表，这个数组的数据会追加到内部的ZOOM数组，对应的zoomIndex往后累加即可，内部一共有11个zoom，那么你追加了一项，对应的zoomIndex为11，因为是从零开始计数
    formatTime?: Function // 格式化时间
  }>(),
  {
    initZoomIndex: 5,
    showCenterLine: false,
    centerLineStyle: () => {
      return {
        width: 2,
        color: '#fff'
      }
    },
    textColor: 'rgba(151,158,167,1)',
    hoverTextColor: 'rgb(194, 202, 215)',
    lineColor: 'rgba(151,158,167,1)',
    lineHeightRatio: () => {
      return {
        date: 0.3, // 0点时的日期线段高度
        time: 0.2, // 显示时间的线段高度
        none: 0.1, // 不显示时间的线段高度
        hover: 0.3 // 鼠标滑过时显示的时间段高度
      }
    },
    showHoverTime: true,
    backgroundColor: '#022a77',
    enableZoom: true,
    enableDrag: true,
    baseTimeLineHeight: 35,
    initSelectWindowTimeLineIndex: -1,
    maxClickDistance: 3,
    roundWidthTimeSegments: true,
    showDateAtZero: true
  }
)

watch(
  () => props.timeSegments,
  () => {
    reRender()
  }
)

const windowListInner = ref<WindowListInner[]>()
const currentZoomIndex = ref(0)
const startTimestamp = ref(0)
//设置初始数据
function setInitData() {
  // 内部窗口列表数据
  windowListInner.value =
    props.windowList &&
    props.windowList
      .map((item, index) => {
        return {
          ...item,
          active: props.initSelectWindowTimeLineIndex === index
        }
      })
      ?.filter((item) => item.name)
  // 必须先设置currentZoomIndex
  // 初始时间分辨率
  currentZoomIndex.value =
    props.initZoomIndex >= 0 && props.initZoomIndex < ZOOM.length ? props.initZoomIndex : 5
  // 初始当前时间
  // 设置距离左侧的差值
  const dValue = 1000 * 3600 * 1.2
  if (props.initTime) {
    const times =
      typeof props.initTime === 'number' ? props.initTime : new Date(props.initTime).getTime()
    startTimestamp.value = times - dValue
  } else {
    startTimestamp.value = new Date(dayjs().format('YYYY-MM-DD 00:00:00')).getTime() - dValue
  }
  // startTimestamp.value =
  //   (props.initTime
  //     ? typeof props.initTime === 'number'
  //       ? props.initTime
  //       : new Date(props.initTime).getTime()
  //     : new Date(dayjs().format('YYYY-MM-DD 00:00:00')).getTime()) -
  //   totalMS.value / 2
  // 根据时间范围检查并修正起始时间
  fixStartTimestamp()
}
// 整个时间轴所代表的毫秒数
const totalMS = computed(() => ZOOM[currentZoomIndex.value] * ONE_HOUR_STAMP)
//根据时间范围检查并修正起始时间
function fixStartTimestamp() {
  let hfms = totalMS.value / 2
  let ct = startTimestamp.value + hfms
  if (timeRangeTimestamp.value?.start && ct < timeRangeTimestamp.value.start) {
    startTimestamp.value = timeRangeTimestamp.value.start - hfms
  }
  if (timeRangeTimestamp.value?.end && ct > timeRangeTimestamp.value.end) {
    startTimestamp.value = timeRangeTimestamp.value.end - hfms
  }
}
const timeRangeTimestamp = computed(() => {
  let t = { start: NaN, end: NaN }
  if (props.timeRange?.start) {
    t.start =
      typeof props.timeRange.start === 'number'
        ? props.timeRange.start
        : new Date(props.timeRange.start).getTime()
  }
  if (props.timeRange?.end) {
    t.end =
      typeof props.timeRange.end === 'number'
        ? props.timeRange.end
        : new Date(props.timeRange.end).getTime()
    return t
  }
})
//初始化
const timeLineContainer = ref()
const canvas = ref()
const divWidth = ref(0)
const divHeight = ref(0)
const ctx = ref()
const showWindowList = ref(false)
function init() {
  let { width, height } = timeLineContainer.value.getBoundingClientRect()
  divWidth.value = width
  divHeight.value =
    props?.windowList && props.windowList.length > 0 ? props.baseTimeLineHeight : height
  canvas.value.width = divWidth.value
  canvas.value.height = divHeight.value
  ctx.value = canvas.value.getContext('2d')
  showWindowList.value = true
}
//绘制方法
const currentTime = ref(0)
const emit = defineEmits([
  'timeChange',
  'mousedown',
  'click_window_timeSegments',
  'change_window_time_line',
  'click_timeSegments',
  'click_timeline',
  'mouseup',
  'dragTimeChange'
])
const WindowListItem = ref()
function draw() {
  // 顺序很重要，不然层级不对
  drawTimeSegments()
  addGraduations()
  drawMiddleLine()

  currentTime.value = startTimestamp.value + totalMS.value / 2
  emit('timeChange', currentTime.value)

  // 通知窗口时间轴渲染

  WindowListItem.value &&
    WindowListItem.value.forEach((item: { draw: () => void }) => {
      item.draw()
    })

  // 更新观察的时间位置
  updateWatchTime()
}
// 更新观察的时间位置

const watchTimeList = ref<WatchTime[]>([])
function updateWatchTime() {
  watchTimeList.value.forEach((item) => {
    // 当前不在显示范围内
    if (item.time < startTimestamp.value || item.time > startTimestamp.value + totalMS.value) {
      item.callback(-1, -1)
    } else {
      // 在范围内
      let x = (item.time - startTimestamp.value) * (divWidth.value / totalMS.value)
      let y = 0
      let { left, top } = canvas.value.getBoundingClientRect()
      if (
        item.windowTimeLineIndex !== -1 &&
        props.windowList &&
        props.windowList.length > 0 &&
        item.windowTimeLineIndex >= 0 &&
        item.windowTimeLineIndex < props.windowList.length
      ) {
        let rect = WindowListItem.value[item.windowTimeLineIndex].getRect()
        y = rect ? rect.top : top
      } else {
        y = top
      }
      item.callback(x + left, y)
    }
  })
}
// 绘制时间段
function drawTimeSegments(callback?: (arg: TimeSegment) => any, path?: any) {
  const PX_PER_MS = divWidth.value / totalMS.value // px/ms，每毫秒占的像素
  props.timeSegments &&
    props.timeSegments.forEach((item) => {
      if (item.beginTime <= startTimestamp.value + totalMS.value) {
        let hasEndTime = item.endTime >= startTimestamp.value
        ctx.value.beginPath()
        let x = (item.beginTime - startTimestamp.value) * PX_PER_MS
        let w
        if (x < 0) {
          x = 0
          w = hasEndTime ? (item.endTime - startTimestamp.value) * PX_PER_MS : 1
        } else {
          w = hasEndTime ? (item.endTime - item.beginTime) * PX_PER_MS : 1
        }
        let heightStartRatio = item.startRatio === undefined ? 0.6 : item.startRatio
        let heightEndRatio = item.endRatio === undefined ? 0.9 : item.endRatio
        if (props.roundWidthTimeSegments) {
          x = Math.round(x)
          w = Math.round(w)
        }
        // 避免时间段小于1px绘制不出来
        w = Math.max(1, w)
        if (path) {
          ctx.value.rect(
            x,
            divHeight.value * heightStartRatio,
            w,
            divHeight.value * (heightEndRatio - heightStartRatio)
          )
        } else {
          ctx.value.fillStyle = item.color
          ctx.value.fillRect(
            x,
            divHeight.value * heightStartRatio,
            w,
            divHeight.value * (heightEndRatio - heightStartRatio)
          )
        }
        callback && callback(item)
      }
    })
}
//绘制时间刻度
function addGraduations() {
  ctx.value.beginPath()
  // 一共可以绘制的格数
  let gridNum = ZOOM[currentZoomIndex.value] / ZOOM_HOUR_GRID[currentZoomIndex.value]
  // 一格多少毫秒
  let msPerGrid = ZOOM_HOUR_GRID[currentZoomIndex.value] * ONE_HOUR_STAMP
  // 每格间距，一格多少像素宽
  let pxPerGrid = divWidth.value / gridNum
  // 起始偏移距离
  let msOffset = msPerGrid - (startTimestamp.value % msPerGrid)
  let pxOffset = (msOffset / msPerGrid) * pxPerGrid
  for (let i = 0; i < gridNum; i++) {
    let currentStartTimestamp = startTimestamp.value + msOffset + i * msPerGrid
    let adjustMsOffset = 0
    // 分辨率以年为单位
    if (yearMode.value) {
      adjustMsOffset =
        currentStartTimestamp -
        new Date(`${dayjs(currentStartTimestamp).format('YYYY')}-01-01 00:00:00`).getTime()
    } else if (yearMonthMode.value) {
      // 分辨率以月为单位
      adjustMsOffset =
        currentStartTimestamp -
        new Date(
          `${dayjs(currentStartTimestamp).format('YYYY')}-${dayjs(currentStartTimestamp).format(
            'MM'
          )}-01 00:00:00`
        ).getTime()
    }
    let x = pxOffset + i * pxPerGrid - (adjustMsOffset / msPerGrid) * pxPerGrid
    let graduationTime = currentStartTimestamp - adjustMsOffset
    let h = 0
    let date = new Date(graduationTime)
    // 0点显示日期
    if (props.showDateAtZero && date.getHours() === 0 && date.getMinutes() === 0) {
      h =
        divHeight.value *
        (props.lineHeightRatio.date === undefined ? 0.3 : props.lineHeightRatio.date)
      ctx.value.fillStyle = props.textColor
      ctx.value.fillText(graduationTitle(graduationTime), x - 13, h + 15)
    } else if (checkShowTime(date)) {
      // 其余时间根据各自规则显示
      h =
        divHeight.value *
        (props.lineHeightRatio.time === undefined ? 0.2 : props.lineHeightRatio.time)
      ctx.value.fillStyle = props.textColor
      ctx.value.fillText(graduationTitle(graduationTime), x - 13, h + 15)
    } else {
      // 不显示时间的线段
      h =
        divHeight.value *
        (props.lineHeightRatio.none === undefined ? 0.1 : props.lineHeightRatio.none)
    }
    drawLine(x, 0, x, h, 1, props.lineColor)
  }
}
// 绘制线段
function drawLine(x1: number, y1: number, x2: number, y2: number, lineWidth = 1, color = '#fff') {
  ctx.value.beginPath()
  ctx.value.strokeStyle = color
  ctx.value.lineWidth = lineWidth
  ctx.value.moveTo(x1, y1)
  ctx.value.lineTo(x2, y2)
  ctx.value.stroke()
}
function graduationTitle(datetime: string | number | Date | dayjs.Dayjs | null | undefined) {
  let time = dayjs(datetime)
  let res = ''
  if (props.formatTime) {
    res = props.formatTime(time)
  }
  if (res) {
    return res
  }
  if (yearMode.value) {
    return time.format('YYYY')
  } else if (yearMonthMode.value) {
    return time.format('YYYY-MM')
  } else if (time.hour() === 0 && time.minute() === 0 && time.millisecond() === 0) {
    return time.format('MM-DD')
  } else {
    return time.format('HH:mm')
  }
}
// 判断是否需要显示该时间
function checkShowTime(date: Date) {
  if (props.customShowTime) {
    let res = props.customShowTime(date, currentZoomIndex.value)
    if (res === true) {
      return true
    } else if (res === false) {
      return false
    }
  }
  return ZOOM_DATE_SHOW_RULE[currentZoomIndex.value](date)
}
// 年模式
const yearMode = computed(() => currentZoomIndex.value === 10)
// 年月模式
const yearMonthMode = computed(() => currentZoomIndex.value === 9)
//绘制中间的竖线
function drawMiddleLine() {
  if (!props.showCenterLine) {
    return
  }
  ctx.value.beginPath()
  let { width, color } = props.centerLineStyle
  let x = divWidth.value / 2
  drawLine(x, 0, x, divHeight.value, width, color)
}
const mousedownX = ref(0)
const mousedownY = ref(0)
const mousedown = ref(false)
const mousedownCacheStartTimestamp = ref(0)
//鼠标按下事件
function onMousedown(e: any) {
  onPointerdown(e)
}
// 按下事件
function onPointerdown(e: any) {
  let pos = getClientOffset(e)
  mousedownX.value = pos[0]
  mousedownY.value = pos[1]
  mousedown.value = true
  mousedownCacheStartTimestamp.value = startTimestamp.value
  emit('mousedown', e)
}
function getClientOffset(e: { clientX: number; clientY: number }) {
  if (!timeLineContainer.value || !e) {
    return [0, 0]
  }
  let { left, top } = timeLineContainer.value.getBoundingClientRect()
  return [e.clientX - left, e.clientY - top]
}
//鼠标移出事件
function onMouseout() {
  clearCanvas(divWidth.value, divHeight.value)
  draw()
}
// 鼠标移动事件
function onMousemove(e: any) {
  onPointermove(e)
}
const mousemoveX = ref(-1)
// 移动事件
function onPointermove(e: { clientX: number; clientY: number }) {
  let x = getClientOffset(e)[0]
  mousemoveX.value = x
  // 按下拖动
  if (mousedown.value && props.enableDrag) {
    drag(x)
  } else if (props.showHoverTime) {
    // 未按下显示鼠标所在时间
    hoverShow(x, false)
  }
}
function drag(x: number) {
  if (!props.enableDrag) {
    return
  }
  const PX_PER_MS = divWidth.value / totalMS.value // px/ms
  let diffX = x - mousedownX.value
  // 判断是否超出限制范围
  let hfms = totalMS.value / 2
  let _newStartTimestamp = mousedownCacheStartTimestamp.value - Math.round(diffX / PX_PER_MS)
  let ct = _newStartTimestamp + hfms
  if (timeRangeTimestamp.value?.start && ct < timeRangeTimestamp.value.start) {
    _newStartTimestamp = timeRangeTimestamp.value.start - hfms
  }
  if (timeRangeTimestamp.value?.end && ct > timeRangeTimestamp.value.end) {
    _newStartTimestamp = timeRangeTimestamp.value.end - hfms
  }
  startTimestamp.value = _newStartTimestamp
  clearCanvas(divWidth.value, divHeight.value)
  draw()
}
//未按下显示鼠标所在时间
function hoverShow(x: number, noDraw?: boolean) {
  const PX_PER_MS = divWidth.value / totalMS.value // px/ms
  let time = startTimestamp.value + x / PX_PER_MS
  if (!noDraw) {
    clearCanvas(divWidth.value, divHeight.value)
    draw()
  }
  let h =
    divHeight.value *
    (props.lineHeightRatio.hover === undefined ? 0.3 : props.lineHeightRatio.hover)
  drawLine(x, 0, x, h, 1, props.lineColor)
  ctx.value.fillStyle = props.hoverTextColor
  let t = props.hoverTimeFormat
    ? props.hoverTimeFormat(time)
    : dayjs(time).format('YYYY-MM-DD HH:mm:ss')
  let w = ctx.value.measureText(t).width
  ctx.value.fillText(t, x - w / 2, h + 20)
}
//鼠标移出事件
function onMouseleave() {
  mousemoveX.value = -1
}
//鼠标滚动
function onMouseweel(event: any) {
  if (!props.enableZoom) {
    return
  }
  let e = window.event || event
  let delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail))
  if (delta < 0) {
    if (currentZoomIndex.value + 1 >= ZOOM.length - 1) {
      currentZoomIndex.value = ZOOM.length - 1
    } else {
      currentZoomIndex.value++
    }
  } else if (delta > 0) {
    // 放大
    if (currentZoomIndex.value - 1 <= 0) {
      currentZoomIndex.value = 0
    } else {
      currentZoomIndex.value--
    }
  }
  clearCanvas(divWidth.value, divHeight.value)
  startTimestamp.value = currentTime.value - totalMS.value / 2 // 当前时间-新的时间范围的一半
  draw()
}
//窗口时间轴滚动
function onWindowListScroll() {
  updateWatchTime()
}
function reRender() {
  nextTick(() => {
    clearCanvas(divWidth.value, divHeight.value)
    reset()
    setInitData()
    init()
    draw()
  })
}
//复位
function reset() {
  divWidth.value = 0
  divHeight.value = 0
  ctx.value = null
  currentZoomIndex.value = 0
  currentTime.value = 0
  startTimestamp.value = 0
  mousedown.value = false
  mousedownX.value = 0
  mousedownCacheStartTimestamp.value = 0
}
const setTime = (t: string | number | Date) => {
  if (mousedown.value) {
    return
  }
  let ts = typeof t === 'number' ? t : new Date(t).getTime()
  startTimestamp.value = ts - totalMS.value / 2
  fixStartTimestamp()
  clearCanvas(divWidth.value, divHeight.value)
  draw()
  if (mousemoveX.value !== -1) {
    hoverShow(mousemoveX.value, true)
  }
}
defineExpose({ setTime, reRender })
//清除画布
function clearCanvas(w: number, h: number) {
  ctx.value.clearRect(0, 0, w, h)
}
//转发窗口时间轴的事件
function triggerClickWindowTimeSegments(data: any, time: any, index: any, item: any) {
  emit('click_window_timeSegments', data, time, index, item)
}
//切换窗口时间轴的选中
function toggleActive(index: number) {
  if (windowListInner.value) {
    windowListInner.value.forEach((item) => {
      item.active = false
    })
    let activeWindow = windowListInner.value.filter((item) => {
      return item.index === index
    })[0]
    activeWindow.active = true
    emit('change_window_time_line', index, activeWindow)
  }
}
//鼠标松开
const onMouseup = (e: { clientX: number; clientY: number }) => {
  onPointerup(e)
}
// 松开事件
function onPointerup(e: { clientX: number; clientY: number }) {
  // 触发click事件
  let pos: number[] = getClientOffset(e)
  const reset = () => {
    mousedown.value = false
    mousedownX.value = 0
    mousedownY.value = 0
    mousedownCacheStartTimestamp.value = 0
  }
  if (
    Math.abs(pos[0] - mousedownX.value) <= props.maxClickDistance &&
    Math.abs(pos[1] - mousedownY.value) <= props.maxClickDistance
  ) {
    reset()
    onClick(pos[0], pos[1])
    return
  }
  if (mousedown.value && props.enableDrag) {
    reset()
    emit('dragTimeChange', currentTime.value)
  } else {
    reset()
  }
  emit('mouseup', e)
}
function onClick(x: number, y: number) {
  const PX_PER_MS = divWidth.value / totalMS.value // px/ms
  let time = startTimestamp.value + x / PX_PER_MS
  let date = dayjs(time).format('YYYY-MM-DD HH:mm:ss')
  let timeSegments = getClickTimeSegments(x, y)
  if (timeSegments && timeSegments.length > 0) {
    emit('click_timeSegments', timeSegments, time, date, x)
  } else {
    onCanvasClick(time, date, x)
  }
}
//检测当前是否点击了某个时间段
function getClickTimeSegments(x: any, y: any) {
  let inItems: TimeSegment[] = []
  drawTimeSegments((item) => {
    if (ctx.value.isPointInPath(x, y)) {
      inItems.push(item)
    }
  }, true)
  return inItems
}
// 时间轴点击事件
function onCanvasClick(...args: (string | number)[]) {
  emit('click_timeline', ...args)
}
// 设置分辨率
function setZoom(index: number) {
  currentZoomIndex.value = index >= 0 && index < ZOOM.length ? index : 5
  clearCanvas(divWidth.value, divHeight.value)
  startTimestamp.value = currentTime.value - totalMS.value / 2 // 当前时间-新的时间范围的一半
  draw()
}
// 要观察的时间点，会返回该时间点的实时位置，你可以根据该位置来设置一些你的自定义元素，位置为相对于浏览器可视窗口的位置
function watchTime(time: string | number | Date, callback: any, windowTimeLineIndex: number) {
  if (!time || !callback) {
    return
  }
  watchTimeList.value.push({
    time: typeof time === 'number' ? time : new Date(time).getTime(),
    callback,
    windowTimeLineIndex: typeof windowTimeLineIndex === 'number' ? windowTimeLineIndex - 1 : -1
  })
}
//尺寸重适应
const onResize = () => {
  init()
  draw()

  WindowListItem.value &&
    WindowListItem.value.forEach((item: { init: () => void }) => {
      item.init()
    })
}

onBeforeMount(() => {
  props.extendZOOM &&
    props.extendZOOM.forEach((item) => {
      ZOOM.push(item.zoom)
      ZOOM_HOUR_GRID.push(item.zoomHourGrid)
    })
})
onMounted(() => {
  setInitData()
  init()
  draw()

  window.addEventListener('mouseup', onMouseup)

  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('mouseup', onMouseup)

  window.removeEventListener('resize', onResize)
})
</script>
<style  scoped>
.timeLineContainer {
  width: 100%;
  height: 100%;
  cursor: pointer;
  display: flex;
  flex-direction: column;

  .canvas {
    flex-grow: 0;
    flex-shrink: 0;
  }

  .windowList {
    width: 100%;
    height: 100%;
    overflow: auto;
    overflow-x: hidden;
    border-top: 1px solid rgba(153, 153, 153, 1);
    display: flex;
    flex-direction: column;

    &::-webkit-scrollbar {
      display: none;
    }
  }
}
</style>
