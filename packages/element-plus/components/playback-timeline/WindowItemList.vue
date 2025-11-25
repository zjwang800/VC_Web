<template>
  <div class="windowListItem" :class="{ active: active }" ref="windowListItem" @click="onClick">
    <span class="order">{{ name }}</span>
    <canvas class="windowListItemCanvas" ref="canvas"></canvas>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { type TimeSegment, type WindowListInner } from './constant'
import { nextTick, onMounted, ref } from 'vue';
const props = withDefaults(
  defineProps<{
    index: number
    data: WindowListInner
    totalMS: number
    startTimestamp: number
    width: number
    active: boolean
    name: string
  }>(),
  {
    active: false
  }
)
const divHeight = ref(0)
const ctx = ref()
const windowListItem = ref()
const canvas = ref()
//初始化
function init() {
  let { height } = windowListItem.value.getBoundingClientRect()
  divHeight.value = height - 1
  canvas.value.width = props.width
  canvas.value.height = divHeight.value
  ctx.value = canvas.value.getContext('2d')
}
//绘制时间段
function drawTimeSegments(callback?: (arg: TimeSegment) => any, path?: any) {
  if (!props.data.timeSegments || props.data.timeSegments.length <= 0) {
    return
  }
  const PX_PER_MS = props.width / props.totalMS // px/ms，每毫秒占的像素
  props.data.timeSegments.forEach((item) => {
    if (
      item.beginTime <= props.startTimestamp + props.totalMS &&
      item.endTime >= props.startTimestamp
    ) {
      ctx.value.beginPath()
      let x = (item.beginTime - props.startTimestamp) * PX_PER_MS
      let w
      if (x < 0) {
        x = 0
        w = (item.endTime - props.startTimestamp) * PX_PER_MS
      } else {
        w = (item.endTime - item.beginTime) * PX_PER_MS
      }
      let heightStartRatio = item.startRatio === undefined ? 0.6 : item.startRatio
      let heightEndRatio = item.endRatio === undefined ? 0.9 : item.endRatio
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
//清除画布
function clearCanvas() {
  ctx.value.clearRect(0, 0, props.width, divHeight.value)
}
//绘制
function draw() {
  nextTick(() => {
    clearCanvas()
    drawTimeSegments()
  })
}
defineExpose({ draw, init })
const emit = defineEmits(['click', 'click_window_timeSegments'])
//点击事件
function onClick(e: { clientX: number; clientY: number }) {
  emit('click', e)
  let { left, top } = windowListItem.value.getBoundingClientRect()
  let x = e.clientX - left
  let y = e.clientY - top
  const PX_PER_MS = props.width / props.totalMS // px/ms
  let time = props.startTimestamp + x / PX_PER_MS
  let date = dayjs(time).format('YYYY-MM-DD HH:mm:ss')
  let timeSegments = getClickTimeSegments(x, y)
  if (timeSegments.length > 0) {
    emit('click_window_timeSegments', timeSegments, date, props.index, props.data)
  }
}
function getClickTimeSegments(x: number, y: number) {
  if (!props.data.timeSegments || props.data.timeSegments.length <= 0) {
    return []
  }
  let inItems: TimeSegment[] = []
  drawTimeSegments((item) => {
    if (ctx.value.isPointInPath(x, y)) {
      inItems.push(item)
    }
  }, true)
  return inItems
}
//获取位置信息
function getRect() {
  return windowListItem.value ? windowListItem.value.getBoundingClientRect() : null
}
onMounted(() => {
  init()
  drawTimeSegments()
})
</script>
<style  scoped>
.windowListItem {
  width: 100%;
  height: 30px;
  position: relative;
  border-bottom: 1px solid rgba(153, 153, 153, 1);
  user-select: none;

  &.active {
    background-color: #2c2e34;
  }

  .order {
    position: absolute;
    width: 50px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    border-right: 1px solid rgba(153, 153, 153, 1);
  }
}
</style>
