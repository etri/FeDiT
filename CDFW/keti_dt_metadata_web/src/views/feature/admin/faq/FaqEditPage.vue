<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>FAQ 등록</h3>
      </div>
      <div class="boxCnt">
        <FaqEdit ref="editFaq" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditFaqDetail">저장</el-button>
      <el-button plain type="primary" @click="goToList">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import FaqEdit from "@/components/admin/faq/FaqEdit.vue";

import { ref } from "vue";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const editFaq = ref(null);

const EditFaqDetail = async () => {
  let ruleForm = editFaq.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      const faq = editFaq.value.data.faq;
      const fileList = editFaq.value.data.fileList;

      const faqInfo = {
        faqTitle: faq.faqTitle,
        faqQstn: faq.faqQstn,
        faqAns: faq.faqAns,
        pltfrmId: getCookie("pltfrmId"),
      };

      const formData = new FormData();

      formData.append(
        "info",
        new Blob([JSON.stringify(faqInfo)], { type: "application/json" })
      );

      if (fileList.length > 0) {
        fileList.forEach((file) => formData.append("fileList", file.raw));
      }

      $axios
        .post($apiUrls.admin.faq.setFaqDetail, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then(() => {
          alert("저장되었습니다.");

          let platform = getCookie("pltfrmId");
          let query = null;
          routerPush(platform, "FaqListPage", query);
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
  routerPush(platform, "FaqListPage", query);
};
</script>
<style lang="scss"></style>
