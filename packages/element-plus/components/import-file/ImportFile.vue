<template>
  <el-button type="primary" @click="openDialog">{{ name }}</el-button>
  <el-dialog v-model="state.open" :title="title" width="60%" destroy-on-close>
    <div>请选择本地的{{ suffix }}文件</div>
    <div class="flex items-center mt-4 mb-4">
      <el-input
        :value="file?.name"
        disabled
        :placeholder="`请选择上传的${suffix}文件`"
      />
      <el-upload
        ref="uploadRef"
        action="/"
        :accept="suffix"
        :show-file-list="false"
        :auto-upload="false"
        :on-change="handleChange"
        :disabled="state.loading"
        class="upload-demo"
      >
        <template #trigger>
          <el-button type="primary" class="ml-4">选择文件</el-button>
        </template>
      </el-upload>
    </div>
    <div class="flex items-center mb-6">
      <i class="iconfont icon-warning-filled text-white size-3" />
      <span class="ml-2">请选择文档，并以{{ suffix }}格式命名</span>
    </div>
    <div class="flex justify-end">
      <el-button @click="state.open = false">取消</el-button>
      <el-button type="primary" :loading="state.loading" @click="handleImport"
        >导入</el-button
      >
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from "vue";

import type { UploadFile } from "element-plus";
import { ElMessage } from "element-plus";

const props = defineProps<{
  name: string;
  title: string;
  accept?: string;
}>();

const emit = defineEmits(["import"]);

const state = reactive({ open: false, loading: false });
const file = ref<UploadFile>();

const suffix = computed(() => props.accept);

function handleChange(uploadFile: UploadFile) {
  file.value = uploadFile;
}

function handleImport() {
  if (!/^[^!@$%^&"?/;'`]*$/.test(file.value?.name || ""))
    return ElMessage.error("文件名不符合要求,请修改后重新上传!");
  if (!file.value?.name.split(".")[0])
    return ElMessage.error("文件名不能为空,请修改后重新上传!");
  if ((file.value?.size || 0) / 1024 / 1024 > 200)
    return ElMessage.error("请上传200M以内大小的文件");
  state.loading = true;
  emit("import", file.value?.raw);
}

const openDialog = () => {
  state.open = true;
  file.value = undefined;
  state.loading = false;
};
const closeDialog = () => {
  state.open = false;
  state.loading = false;
};
const loadingFalse = () => {
  state.loading = false;
  file.value = undefined;
};
const onlyLogdingFalse = () => {
  state.loading = false;
};

defineExpose({
  closeDialog,
  loadingFalse,
  onlyLogdingFalse,
});
</script>

<style scoped lang="scss">
.flex {
  display: flex;
  flex-direction: row;
}
.justify-end {
  justify-content: flex-end;
}
.mb-4 {
  margin-bottom: 8px;
}
.mt-4 {
  margin-top: 8px;
}
.mb-6 {
  margin-bottom: 12px;
}
</style>
