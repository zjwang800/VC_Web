<template>
  <div style="height: 500px">
    <vc-edit-table :tableData="data"></vc-edit-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { VcEditTable } from "@much-more/vc-element-plus";
const data = ref<any>([
  {
    id: 1,
    name: "名称111111111",
    editItem1: "可编辑名称1111111",
    editItem2: 1,
  },
  {
    id: 2,
    name: "名称22222",
    editItem1: "可编辑名称222222",
    editItem2: 2,
  },
  {
    id: 3,
    name: "名称333333",
    editItem1: "可编辑名称333333",
    editItem2: 2,
  },
  {
    id: 4,
    name: "名称4444444",
    editItem1: "可编辑名称4444444",
    editItem2: 1,
  },
]);
</script>
<style scoped lang="scss"></style>
