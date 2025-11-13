<template>
  <div class="ly-table">
    <el-form label-width="160px" :model="qna">
      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="번호">{{ qna.qnaOid }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="조회수">{{
            qna.retvNum == null ? 0 : qna.retvNum
          }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="등록자">{{ qna.regrId }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="등록일시">{{ qna.regDt }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="최종 수정자">{{ qna.amdrId }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="최종 수정일시">{{ qna.amdDt }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="진행현황">{{
            qna.sttusCd == "COD_02828" ? "답변대기" : "답변완료"
          }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="공개여부">{{
            qna.ottpYn == "Y" ? "공개" : "비공개"
          }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="20" :xs="24">
          <el-form-item label="제목">{{ qna.qnaTitle }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="20" :xs="24">
          <el-form-item label="질문 내용">
            <p v-html="qna.qnaQstn"></p>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="20" :xs="24">
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
  qna: {
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
