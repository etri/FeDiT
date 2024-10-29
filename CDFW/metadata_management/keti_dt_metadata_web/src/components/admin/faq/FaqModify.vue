<template>
  <el-form
    ref="ruleFormRef"
    :model="state.faq"
    :rules="state.rules"
    label-width="100px"
    class="demo-ruleForm"
    :label-position="labelPosition"
  >
    <el-form-item label="작성자" prop="regrId">
      <el-input v-model="state.faq.regrId" disabled></el-input>
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

import { ref, reactive, defineExpose, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";

import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const limit = ref(0);
const ruleFormRef = ref(null);
const labelPosition = ref("right");

const state = reactive({
  fileList: [],
  file: [],
  faq: {},
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

onMounted(() => {
  let faqOid = route.query.faqOid;
  getFaqDetail(faqOid);
  getAttachedFileList(faqOid);
});

const getFaqDetail = (faqOid) => {
  $axios
    .get(util.format($apiUrls.admin.faq.getFaqDetail, faqOid))
    .then((res) => {
      state.faq = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAttachedFileList = (faqOid) => {
  $axios
    .get(util.format($apiUrls.admin.faq.getFaqAttachFileList, faqOid))
    .then((res) => {
      state.originFile = res.data.slice();
      state.fileList = res.data;
      state.fileList.forEach((data) => {
        data.name = data.fileOriginNm;
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

const uploadFile = (payload) => {
  state.fileList = [];
  for (let i of payload.fileList) state.fileList.push(i);
};

defineExpose({
  data: state,
  ruleFormRef: ruleFormRef,
});
</script>

<style lang="scss"></style>
