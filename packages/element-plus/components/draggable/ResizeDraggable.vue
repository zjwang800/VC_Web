<template>
  <div
    ref="resizeRef"
    class="resizable"
    :style="{ minWidth: minWidth }"
    v-bind="$attrs"
  >
    <div
      class="handler"
      @mousedown.prevent.stop="onStartResize"
      @mouseup.prevent.stop="onStopResize"
      title="拖动可调整大小"
    >
      <i class="">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 100">
          <!-- 竖等号由两条垂直线段组成 -->
          <line
            x1="15"
            y1="10"
            x2="15"
            y2="40"
            stroke="black"
            stroke-width="3"
          />
          <line
            x1="25"
            y1="10"
            x2="25"
            y2="40"
            stroke="black"
            stroke-width="3"
          />
        </svg>
      </i>
    </div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
defineProps<{
  width?: string;
  minWidth?: string;
}>();
const resizeRef = ref<any>(null);

let resizing = false;
let startX = 0;
let startWidth = 0;

// 开始拖动
function onStartResize(event: any) {
  resizing = true;
  startX = event.clientX;
  startWidth = resizeRef.value.clientWidth;
  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", onStopResize);
}

// 停止拖动
function onStopResize() {
  resizing = false;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", onStopResize);
}

// 设置容器大小
function onResize(event: any) {
  if (!resizing) return;
  const newWidth = startWidth + (event.clientX - startX);
  resizeRef.value.style.width = `${newWidth}px`;
}

onMounted(() => {
  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", onStopResize);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", onStopResize);
});
</script>

<style scoped>
.resizable {
  position: relative;
  flex-shrink: 0;
  min-width: 150px;
  max-width: 100%;
  width: 380px;
  height: 100%;
  margin-right: 12px;
  border: 1px solid #111fdf;
  user-select: none;
  box-sizing: border-box;
  &:hover {
    .handler {
      display: block;
    }
  }
  .handler {
    position: absolute;
    width: 12px;
    height: 12px;
    top: 50%;
    right: -12px;
    margin-top: -6px;
    padding: 4px 0;
    cursor: e-resize;
    z-index: 99;
    > i {
      color: #cfd9d9;
      font-size: 14px;
    }
  }
}
</style>
