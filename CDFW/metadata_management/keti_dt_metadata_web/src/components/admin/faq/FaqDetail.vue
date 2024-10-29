<template>
  <div class="ly-table">
    <el-form label-width="160px" :model="(faq, fileList)">
      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="번호">{{ faq.faqOid }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="조회수">{{ faq.retvNum == null ? 0 : faq.retvNum }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="등록자">{{ faq.regrId }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="등록일시">{{ faq.regDt }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="최종 수정자">{{ faq.amdrId }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="최종 수정일시">{{ faq.amdDt }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="20" :xs="24">
          <el-form-item label="제목">{{ faq.faqTitle }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="20" :xs="24">
          <el-form-item label="질문"><p v-html="faq.faqQstn"></p></el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="20" :xs="24">
          <el-form-item label="답변"><p v-html="faq.faqAns"></p></el-form-item>
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
  faq: {
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
