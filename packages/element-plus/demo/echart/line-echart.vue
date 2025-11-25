<template>
  <div class="chart-wrapper">
    <VcEChart :options="chartOptions" theme="dark" :auto-resize="true" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { VcEChart } from "@much-more/vc-element-plus";

const chartOptions = ref({
  title: {
    text: "销售趋势",
    left: "center",
  },
  tooltip: {
    trigger: "axis",
  },
  xAxis: {
    type: "category",
    data: ["一月", "二月", "三月", "四月", "五月", "六月"],
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "销售额",
      type: "line",
      smooth: true,
      data: [120, 200, 150, 80, 70, 110],
      areaStyle: {},
    },
  ],
});
</script>
<script>
export default {
  name: 'LineEchart'
}
</script>
<style>
.chart-wrapper {
  width: 100%;

  margin: 0 auto;
}
</style>
