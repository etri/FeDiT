<template>
  <div class="ly-table">
    <el-form label-width="160px" :model="(boardmsg, fileList)">
      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="번호">{{ boardmsg.pstngOid }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="조회수">{{ boardmsg.retvNum == null ? 0 : boardmsg.retvNum}}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="등록자">{{ boardmsg.regrId }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="등록일시">{{ boardmsg.regDt }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="10" :xs="24">
          <el-form-item label="최종 수정자">{{ boardmsg.amdrId }}</el-form-item>
        </el-col>
        <el-col :span="10" :xs="24">
          <el-form-item label="최종 수정일시">{{
            boardmsg.amdDt
          }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="선제시 여부"
            ><el-checkbox
              label="항상 목록의 최상위에 표시 됩니다."
              v-model="boardmsg.prevPstngYn"
              disabled
            ></el-checkbox
          ></el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="제목">{{ boardmsg.pstngTitle }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="내용"
            ><p v-html="boardmsg.pstngSbst"></p
          ></el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="board.atcFileUseYn == 'Y'">
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
  board: {
    type: Object,
    required: true,
  },
  boardmsg: {
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
<style lang="scss">
.download {
  cursor: pointer !important;
}
</style>
