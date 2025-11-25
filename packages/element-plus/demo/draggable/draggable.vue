<template>
  <div class="box">
    <VcResizeDraggable>
      <div class="box1"></div>
    </VcResizeDraggable>
    <div class="box2"></div>
  </div>
</template>

<script setup lang="ts">
import { VcResizeDraggable } from "@much-more/vc-element-plus";
</script>
<style scoped>
.box {
  width: 100%;
  height: 100%;
  display: flex;
}
.box1 {
  height: 400px;
  background-color: red;
}
.box2 {
  width: 100px;
  height: 400px;
  background-color: blue;
}
</style>
