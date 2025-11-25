<template>
  <el-button type="primary" @click="draw">画框</el-button>
  <el-button type="primary" @click="reset">重置</el-button>
  <div class="box">
    <vc-ai-mark ref="markRef" :image-src="login"></vc-ai-mark>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import login from "./bg-login.jpg";
import { VcAiMark } from "@much-more/vc-element-plus";
const markRef = ref()
const draw = () => {
  markRef.value?.draw("RECT");
};
const reset = () => {
  markRef.value?.reset();
};
</script>
<style scoped>
.box {
  margin-top: 6px;
  width: 600px;
  height: 400px;
  background-color: black;
}
</style>
