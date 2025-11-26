<template>
  <el-table :data="tableData" class="!h-full">
    <el-table-column label="名称" prop="name" align="center" />

    <el-table-column label="修改项1" prop="editItem1" align="center">
      <template #default="{ row }">
        <template v-if="isEditing(row, 'editItem1')">
          <el-input
            v-model="row.editItem1"
            @blur="handleBlur(row, 'editItem1')"
            ref="editInput"
            autofocus
            maxlength="40"
            clearable
            class="edit-input"
          ></el-input>
        </template>
        <template v-else>
          <span
            @click="handleClick(row, 'editItem1')"
            class="cursor-pointer block"
          >
            {{ row.editItem1 || "-" }}
          </span>
        </template>
      </template>
    </el-table-column>
    <el-table-column label="修改项2" prop="editItem2" align="center">
      <template #default="{ row }">
        <template v-if="isEditing(row, 'editItem2')">
          <el-select
            v-model.number="row.editItem2"
            @blur="handleBlur(row, 'editItem2')"
            ref="editInput"
            autofocus
            clearable
          >
            <el-option
              v-for="(item, index) in storeageList"
              :key="index"
              :label="item.storageName"
              :value="item.id"
            >
              {{ item.storageName }}
            </el-option>
          </el-select>
        </template>
        <template v-else>
          <span
            @click="handleClick(row, 'editItem2')"
            class="cursor-pointer block"
          >
            {{ formatItem(row.editItem2) }}
          </span>
        </template>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { ref, reactive, Ref, nextTick } from "vue";
import { ElMessage, type ElInput } from "element-plus";
const props = defineProps<{
  tableData: any[];
}>();

interface dataItem {
  id: number;
  name: string;
  editItem1: string;
  editItem2: number;
}
interface LastEditedData_ct {
  row: dataItem;
  field: keyof dataItem;
  value: string;
}

const storeageList = ref<any[]>([
  { id: 1, storageName: "选项1" },
  { id: 2, storageName: "选项2" },
]);
const editingStatus: Ref<any> = ref({
  rowId: null,
  field: null,
});

// 最后编辑的数据
const lastEditedData: Ref<LastEditedData_ct | null> = ref(null);

// 编辑输入框的引用
const editInput = ref<InstanceType<typeof ElInput> | null>(null);
// 输入值是否为空

// 当前编辑的字段
const currentField = ref<keyof dataItem | null>(null);

// 判断单元格是否处于编辑状态
const isEditing = (row: dataItem, field: keyof dataItem) => {
  return (
    editingStatus.value.rowId === row.id && editingStatus.value.field === field
  );
};
const handleClick = (row: dataItem, field: keyof dataItem) => {
  // 设置当前编辑状态
  editingStatus.value = {
    rowId: row.id,
    field: field,
  };
  currentField.value = field;
  // 确保输入框渲染后自动聚焦
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus();
    }
  });
};
// 表格内输入框失去焦点
const handleBlur = (row: dataItem, field: keyof dataItem) => {
  const value = row[field] as string;
  // 验证值是否为空
  if (value == "") {
    ElMessage.error("输入值不能为空");
    currentField.value = null;
    editingStatus.value = {
      rowId: null,
      field: null,
    };
    return;
  }

  // 如果值有效，清除错误状态
  currentField.value = null;

  // 记录最后编辑的数据
  lastEditedData.value = {
    row: { ...row }, // 复制行数据，避免引用更新
    field: field,
    value: row[field] as string,
  };
  editingStatus.value = {
    rowId: null,
    field: null,
  };
};

const formatItem = (id: number) => {
  let item = storeageList.value.find((item) => item.id == id);
  return item?.storageName;
};

// 可以在这里添加保存到服务器的逻辑
</script>
<style scoped lang="scss"></style>
