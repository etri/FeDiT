<template>
  <el-upload
    v-model:file-list="fileList"
    class="upload-demo"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    multiple
    :on-remove="handleRemove"
    :before-remove="beforeRemove"
    :limit="limit"
    :on-exceed="handleExceed"
    :auto-upload="false"
    :on-change="handleChange"
  >
    <el-button type="primary">FILE</el-button>
    <template #tip>
      <div class="el-upload__tip text-red" v-if="limit > 0">
        업로드 가능한 파일 수는 {{ limit }}개 입니다.
      </div>
    </template>
  </el-upload>
</template>
<script setup>
import { defineProps, defineEmits, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
// import { asyncComputed } from "@vueuse/core";

const emits = defineEmits(["uploadFile"]);

const props = defineProps({
  limit: {
    //제한이 따로 없다면 부모에서 0으로 세팅
    type: Number,
    required: false,
  },
  infofileList: {
    type: Array,
    required: false,
  },
});

const fileList = computed(() => {
  return props.infofileList;
});

const handleRemove = (file, uploadFiles) => {
  handleChange(file, uploadFiles);
};

const handleExceed = (files, uploadFiles) => {
  ElMessage.warning(
    `업로드 가능한 파일 수는 ${props.limit}개며, 현재 추가한 ${
      files.length
    } 개의 파일을 포함한 총 파일 수는 ${
      files.length + uploadFiles.length
    }개 입니다`
  );
};

const beforeRemove = (uploadFile, uploadFiles) => {
  return ElMessageBox.confirm(
    `${uploadFile.name} 파일을 삭제하시겠습니까?`
  ).then(
    () => true,
    () => false
  );
};

const handleChange = (file, fileList) => {
  emits("uploadFile", { fileList: fileList });
};
</script>
<style lang=""></style>
