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
import { getCookie } from "@/assets/js/common.js";
import { ref, reactive, defineExpose } from "vue";

const limit = ref(1);
const ruleFormRef = ref(null);
const labelPosition = ref("left");

const state = reactive({
  fileList: [],
  image: {
    imgNm: "",
    imgLnydNm: "",
    pltfrmId: getCookie("pltfrmId"),
  },
  rules: {
    imgNm: [
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
    imgLnydNm: [
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
<style lang="scss"></style>
