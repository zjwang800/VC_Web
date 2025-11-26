<template>
  <vc-import-file
    name="导入装置"
    accept=".cid,.scd"
    title="导入装置"
    @import="importItem"
    ref="importFile"
  ></vc-import-file>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { ref, reactive } from "vue";
import { VcImportFile } from "@much-more/vc-element-plus";
const importItem = (file: File) => {
  ElMessage.success(`文件名=${file.name},文件大小${file.size}`);
};
</script>
<style scoped lang="scss"></style>
