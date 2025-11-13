<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>공지사항 등록</h3>
      </div>
      <div class="boxCnt">
        <OpernaticeEdit ref="editOper" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditOpernation">저장</el-button>
      <el-button plain type="primary" @click="goToList">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import OpernaticeEdit from "@/components/admin/opernotice/OpernaticeEdit.vue";

import { ref } from "vue";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const editOper = ref(null);

const EditOpernation = async () => {
  let ruleForm = editOper.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      const { notice, fileList } = editOper.value.data;

      const noticeInfo = {
        ...notice,
        prevNtfYn: notice.prevNtfYn ? "Y" : "N",
        admPrsnNtfYn: notice.typeNtcTF == 1 ? "Y" : "N",
        mainPopupYn: notice.typeNtcTF == 2 ? "Y" : "N",
        clsButtIndcYn: notice.clsButtIndcYn ? "Y" : "N",
        todayPopupIndcYn: notice.todayPopupIndcYn ? "Y" : "N",
        pltfrmId: getCookie("pltfrmId"),
      };

      const formData = new FormData();

      formData.append(
        "info",
        new Blob([JSON.stringify(noticeInfo)], { type: "application/json" })
      );

      if (fileList.length > 0) {
        fileList.forEach((file) => formData.append("fileList", file.raw));
      }

      $axios
        .post($apiUrls.admin.notices.setNoticeDetail, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then(() => {
          alert("저장이 완료되었습니다.");

          let platform = getCookie("pltfrmId");
          let query = null;
          routerPush(platform, "OpernoticeListPage", query);
        })
        .catch((err) => {
          console.log(err);
          alert("저장이 실패하였습니다.");
        });
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "OpernoticeListPage", query);
};
</script>
<style lang="scss"></style>
