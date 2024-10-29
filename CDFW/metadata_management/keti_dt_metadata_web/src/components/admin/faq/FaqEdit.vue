<template>
  <el-form
    ref="ruleFormRef"
    :model="state.faq"
    :rules="state.rules"
    label-width="120px"
    class="demo-ruleForm"
    :label-position="labelPosition"
  >
    <el-form-item label="작성자" prop="regrId">
      <el-input v-model="user.id" disabled></el-input>
    </el-form-item>

    <el-form-item label="제목" prop="faqTitle">
      <el-input v-model="state.faq.faqTitle"></el-input>
    </el-form-item>

    <el-form-item label="질문 내용" prop="faqQstn">
      <el-input v-model="state.faq.faqQstn" type="textarea" />
    </el-form-item>

    <el-form-item label="답변" prop="faqAns">
      <el-input v-model="state.faq.faqAns" type="textarea" />
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
  faq: {
    faqTitle: "",
    faqQstn: "",
    faqAns: "",
  },
  rules: {
    faqTitle: [
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
    faqQstn: [
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
    faqAns: [
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
