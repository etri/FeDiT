<template>
  <el-form
    ref="ruleFormRef"
    :model="state.image"
    :rules="state.rules"
    label-width="120px"
    class="demo-ruleForm"
    :label-position="labelPosition"
  >
    <el-form-item label="이미지 명" prop="imgNm">
      <el-input v-model="state.image.imgNm"></el-input>
    </el-form-item>

    <el-form-item label="이미지 설명" prop="imgLnydNm">
      <el-input v-model="state.image.imgLnydNm"></el-input>
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

const limit = ref(1);
const ruleFormRef = ref(null);
const labelPosition = ref("left");

const state = reactive({
  fileList: [],
  originFile: [],
  image: {},
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
  let imgOid = route.query.imgOid;
  getImageDetail(imgOid);
  getAttachedFileList(imgOid);
});

const getImageDetail = (imgOid) => {
  $axios
    .get(util.format($apiUrls.admin.image.getImageDetail, imgOid))
    .then((res) => {
      state.image = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAttachedFileList = (imgOid) => {
  $axios
    .get(util.format($apiUrls.admin.image.getImageAttachFileList, imgOid))
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
