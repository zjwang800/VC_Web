<template>
  <div class="typing-effect-demo">
    <div class="buttons">
      <el-button type="primary" @click="addContent">添加内容</el-button>
      <el-button type="primary" @click="addImage">添加图片</el-button>
    </div>

    <VcTypingEffect :content="content"></VcTypingEffect>
  </div>
</template>

<script setup lang="ts">
import { VcTypingEffect } from "@much-more/vc-element-plus";
import login from "./bg-login.jpg";
import { ref } from "vue";
// 类型定义
interface ImagePart {
  type: "image";
  src: string;
}
type ContentPart = string | ImagePart;
const content = ref<ContentPart>("");
// 添加内容函数
const addContent = () => {
  content.value = "这是一个模拟打字机效果的示例。";
};
// 添加图片函数
const addImage = () => {
  content.value = { 
    type: "image",
    src: login,
  };
};
</script>
<style scoped>
.typing-effect-demo {
  width: 400px;
  height: 400px;
}
.buttons {
  margin-bottom: 10px;
}
</style>
