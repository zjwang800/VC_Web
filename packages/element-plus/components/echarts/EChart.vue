<template>
  <div ref="chartRef" class="echarts-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  options: {
    type: Object,
    required: true
  },
  theme: {
    type: [String, Object],
    default: null
  },
  initOptions: {
    type: Object,
    default: () => ({})
  },
  autoResize: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['init', 'error']);

const chartRef = ref(null);
let chartInstance = null;

// 初始化图表
const initChart = () => {
  try {
    if (!chartRef.value) return;

    chartInstance = echarts.init(
      chartRef.value,
      props.theme,
      props.initOptions
    );
    chartInstance.setOption(props.options);
    emit('init', chartInstance);
  } catch (err) {
    console.error('ECharts initialization error:', err);
    emit('error', err);
  }
};

// 调整图表尺寸
const resizeHandler = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

// 销毁图表
const disposeChart = () => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
};

// 生命周期
onMounted(() => {
  initChart();
  if (props.autoResize) {
    window.addEventListener('resize', resizeHandler);
  }
});

onUnmounted(() => {
  if (props.autoResize) {
    window.removeEventListener('resize', resizeHandler);
  }
  disposeChart();
});

// 监听选项变化
watch(
  () => props.options,
  (newOptions) => {
    if (chartInstance) {
      chartInstance.setOption(newOptions);
    }
  },
  { deep: true }
);

// 暴露实例方法
defineExpose({
  getInstance: () => chartInstance,
  resize: resizeHandler,
  dispose: disposeChart
});
</script>

<style scoped>
.echarts-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>