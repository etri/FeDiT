<template>
  <div class="ly-table">
    <el-form label-width="160px" :model="(image, fileList)">
      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="이미지명">{{ image.imgNm }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="이미지 설명">{{ image.imgLnydNm }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="첨부파일">
            <ul v-if="fileList.length == 0" class="fileList">
              <span> 첨부파일이 없습니다.</span>
            </ul>
            <ul v-else class="fileList">
              <li v-for="file in fileList">
                <a
                  class="download"
                  @click="downloadFile(file)"
                  title="파일 다운로드"
                  >{{ file.fileOriginNm }}</a
                >
              </li>
            </ul>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>
<script setup>
import { defineProps, defineEmits } from "vue";
const emits = defineEmits(["downloadFile"]);
const props = defineProps({
  image: {
    type: Object,
    required: true,
  },
  fileList: {
    type: Array,
    required: false,
  },
});

const downloadFile = (file) => {
  emits("downloadFile", file);
};
</script>
<style lang="scss"></style>
