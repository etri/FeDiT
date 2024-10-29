<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>이미지 등록</h3>
      </div>
      <div class="boxCnt">
        <ImageEdit ref="edit" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditImage">저장</el-button>
      <el-button plain type="primary" @click="goToList">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import ImageEdit from "@/components/admin/image/ImageEdit.vue";

import { ref } from "vue";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const edit = ref(null);

const EditImage = async () => {
  let ruleForm = edit.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      const { image, fileList } = edit.value.data;

      const formData = new FormData();

      formData.append(
        "info",
        new Blob([JSON.stringify(image)], { type: "application/json" })
      );

      if (fileList.length > 0) {
        fileList.forEach((file) => formData.append("fileList", file.raw));
      }

      $axios
        .post($apiUrls.admin.image.setImageDetail, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then(() => {
          alert("저장이 완료되었습니다.");
          let platform = getCookie("pltfrmId");
          let query = null;
          routerPush(platform, "ImageListPage", query);
        })
        .catch((err) => {
          console.log(err);
          alert("저장에 실패하였습니다.");
        });
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "ImageListPage", query);
};
</script>
<style lang="scss"></style>
