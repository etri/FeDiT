<template>
  <el-form
    ref="ruleFormRef"
    :model="state.qna"
    :rules="state.rules"
    label-width="120px"
    class="demo-ruleForm"
    :label-position="labelPosition"
  >
    <el-form-item label="작성자" prop="regrId">
      <el-input v-model="user.id" disabled></el-input>
    </el-form-item>

    <el-form-item label="제목" prop="qnaTitle">
      <el-input v-model="state.qna.qnaTitle"></el-input>
    </el-form-item>

    <el-form-item label="질문 내용" prop="qnaQstn">
      <el-input v-model="state.qna.qnaQstn" type="textarea" />
    </el-form-item>

    <el-form-item label="공개여부" prop="ottpYn">
      <el-radio-group v-model="state.qna.ottpYn" class="ml-4">
        <el-radio label="1" size="large">공개</el-radio>
        <el-radio label="2" size="large">비공개</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="파일 업로드" prop="file">
      <ComnUpload
        @uploadFile="uploadFile"
        :limit="limit"
        style="width: 100%"
        :infofileList="state.fileList"
      />
    </el-form-item>
  </el-form>
</template>
<script setup>
import ComnUpload from "@/components/common/ComnUpload.vue";

import { getUser } from "@/assets/js/auth.js";
import { ref, reactive, defineExpose } from "vue";

const user = getUser();
const limit = ref(0);

const ruleFormRef = ref(null);
const labelPosition = ref("right");

const state = reactive({
  fileList: [],
  qna: {
    qnaTitle: "",
    qnaQstn: "",
    ottpYn: '1',
    regrId: user.id,
    regrNm: user.nm,
  },
  rules: {
    qnaTitle: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "내용 입력",
        trigger: "blur",
      },
    ],
    qnaQstn: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "내용 입력",
        trigger: "blur",
      },
    ],
  },
});

const uploadFile = (payload) => {
  state.fileList = [];
  for (let i of payload.fileList) state.fileList.push(i);
};

defineExpose({
  data: state,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss">
textarea {
  width: 100%;
  height: 7em;
  resize: none;
}
</style>
