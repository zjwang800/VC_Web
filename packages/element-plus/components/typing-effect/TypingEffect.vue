<template>
    <div class="printer-container">
      <div class="output" ref="outputRef">
        <span
          v-for="(part, index) in contentParts"
          :key="index"
          class="content-part"
          :class="{
            'typing-cursor': index === currentPartIndex && typeof part === 'string' && isTyping
          }"
        >
          <!-- 文字部分 -->
          <span v-if="typeof part === 'string'">{{ displayedTextParts[index] }}</span>
  
          <!-- 图片部分 -->
          <img
            v-else-if="(part as ImagePart).type === 'image'"
            :src="(part as ImagePart).src"
            alt="图片"
            class="printer-image"
            loading="lazy"
          />
        </span>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { watchDebounced } from '@vueuse/core';
import { ref, onMounted, nextTick } from 'vue'

  // 类型定义
  interface ImagePart {
    type: 'image'
    src: string
  }
  type ContentPart = string | ImagePart
  const props = defineProps<{
    content?: ContentPart
  }>()
  // 初始内容
  const contentParts = ref<ContentPart[]>(['这是一个模拟打字机效果的示例。'])
  const displayedTextParts = ref<(string | ImagePart | null)[]>(
    contentParts.value.map((part) => (typeof part === 'string' ? '' : null))
  )
  
  const outputRef = ref<HTMLElement | null>(null)
  const typingSpeed = 80 // 打字速度（毫秒）
  let currentPartIndex = 0
  let isTyping = false
  
  // 滚动到底部
  const scrollToBottom = () => {
    nextTick(() => {
      if (outputRef.value) {
        outputRef.value.scrollTop = outputRef.value.scrollHeight
      }
    })
  }
  
  // 打字功能
  const typePart = async (text: string, index: number): Promise<void> => {
    isTyping = true
    for (let i = 0; i < text.length; i++) {
      displayedTextParts.value[index] = (displayedTextParts.value[index] as string) + text[i]
      scrollToBottom()
      await new Promise((resolve) => setTimeout(resolve, typingSpeed))
    }
    isTyping = false
    currentPartIndex++
    processNextPart()
  }
  
  // 打印下一个内容块
  const processNextPart = async (): Promise<void> => {
    if (currentPartIndex >= contentParts.value.length) return
  
    const part = contentParts.value[currentPartIndex]
  
    if (typeof part === 'string') {
      await typePart(part, currentPartIndex)
    } else if (part.type === 'image') {
      displayedTextParts.value[currentPartIndex] = part
      scrollToBottom()
      currentPartIndex++
      await nextTick()
      processNextPart()
    } else {
      currentPartIndex++
      processNextPart()
    }
  }
  
  // 等待当前打字完成
  const waitForTypingToFinish = (): Promise<void> =>
    new Promise((resolve) => {
      const check = () => {
        if (!isTyping) {
          resolve()
        } else {
          setTimeout(check, 100)
        }
      }
      check()
    })
  
  // 添加新内容
  const addContent = async (newContent?: ContentPart): Promise<void> => {
    if (!newContent) return
    await waitForTypingToFinish()
  
    contentParts.value.push(newContent)
    displayedTextParts.value.push(typeof newContent === 'string' ? '' : null)
  
    if (!isTyping && currentPartIndex === displayedTextParts.value.length - 1) {
      processNextPart()
    }
  }
  watchDebounced(
    () => props.content,
    async () => {
        await addContent(props.content)
    },
    { immediate: true, debounce: 300 }
  )
  onMounted(() => {
    processNextPart()
  })
  </script>
  
  <style scoped>
  .printer-container {
    width: 100%;
    height: 100%;
    background-color: #0a1625; /* 深色背景 */
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #e0e0e0; /* 浅色文字 */
  }
  
  .title-box {
    font-size: 18px;
    font-weight: bold;
    color: #4fc3f7; /* 蓝色标题 */
    padding: 12px 0;
  }
  
  .flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid rgba(76, 175, 239, 0.2); /* 蓝色分隔线 */
    background-color: rgba(16, 42, 67, 0.7); /* 标题栏背景 */
  }
  
  .output {
    flex: 1;
    height: calc(100% - 120px);
    overflow-y: auto;
    font-size: 15px;
    line-height: 1.6;
    padding: 15px 20px;
    background-color: rgba(10, 22, 37, 0.8);
  }
  
  .content-part {
    display: block;
    padding: 8px 0;
    margin: 5px 0;
    border-left: 2px solid transparent;
    padding-left: 10px;
    transition: all 0.3s ease;
  }
  
  .content-part:hover {
    border-left-color: #4fc3f7;
    background-color: rgba(79, 195, 247, 0.05);
  }
  
  /* 光标动画 */
  .typing-cursor::after {
    content: '|';
    animation: blink 1s infinite;
    color: #4fc3f7;
    font-weight: bold;
  }
  
  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
  
  /* 图片样式 */
  .printer-image {
    max-width: 90%;
    height: auto;
    border: 1px solid rgba(79, 195, 247, 0.5);
    border-radius: 4px;
    margin: 12px 0;
    box-shadow: 0 0 10px rgba(79, 195, 247, 0.2);
    opacity: 0;
    animation: fadeIn 0.8s forwards;
  }
  
  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
  
  /* 按钮样式 */
  button {
    background-color: #1976d2;
    color: white;
    border: none;
    padding: 10px 20px;
    margin: 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    align-self: flex-end;
  }
  
  button:hover {
    background-color: #1565c0;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.4);
  }
  
  .el-button {
    background-color: transparent;
    color: #e0e0e0;
    border: 1px solid rgba(79, 195, 247, 0.3);
  }
  
  .el-button:hover {
    background-color: rgba(79, 195, 247, 0.1);
    color: #4fc3f7;
  }
  
  /* 滚动条样式 */
  .output::-webkit-scrollbar {
    width: 6px;
  }
  
  .output::-webkit-scrollbar-track {
    background: rgba(16, 42, 67, 0.3);
  }
  
  .output::-webkit-scrollbar-thumb {
    background-color: rgba(79, 195, 247, 0.5);
    border-radius: 3px;
  }
  </style>
  