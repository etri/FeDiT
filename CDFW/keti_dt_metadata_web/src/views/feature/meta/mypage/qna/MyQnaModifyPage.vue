<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>Q&A 수정</h3>
      </div>
      <div class="boxCnt">
        <QnaModify ref="modifyForm" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="modifyQna">저장</el-button>
      <el-button type="primary" text bg
        v-if="isDelYn(route.meta.auth)"
        @click="deleteQna"
        >삭제</el-button
      >
      <el-button type="primary" plain @click="goToDetail">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import QnaModify from "@/components/admin/qna/QnaModify.vue";

import { ref } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  isDelYn,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const modifyForm = ref(null);

const goToDetail = () => {
  let platform = getCookie("pltfrmId");
  let query = {qnaOid: route.query.qnaOid};
  routerPush(platform, "MyQnaDetailPage", query);
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "MyQnaListPage", query);
};

const findDelArr = (fileList, originFile) => {
  const delArr = originFile.filter((origin) => {
    return !fileList.some((file) => file.atcOid === origin.atcOid);
  });
  return delArr;
};

const modifyQna = async () => {
  let ruleForm = modifyForm.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid) => {
    if (!valid) {
      alert("필수사항을 입력하십시오.");
      return;
    }
    let result = confirm("수정 하시겠습니까?");
    if (result) {
      const qnaOid = route.query.qnaOid;
      const { qna, fileList, originFile } = modifyForm.value.data;
      const delArr = findDelArr(fileList, originFile);
      const qnaInfo = {
        ...qna,
        ottpYn: qna.ottpYn == "1" ? "Y" : "N",
      };
      const formData = new FormData();
      formData.append(
        "info",
        new Blob([JSON.stringify(qnaInfo)], { type: "application/json" })
      );

      if (fileList.length > 0) {
        fileList.forEach((file) => formData.append("fileList", file.raw));
      }
      if (delArr.length > 0) {
        formData.append(
          "deleteFileList",
          new Blob([JSON.stringify(delArr)], { type: "application/json" })
        );
      }
      $axios
        .put(util.format($apiUrls.admin.qna.modifyQnaDetail, qnaOid), formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then(() => {
          alert("수정이 완료되었습니다.");
          goToDetail();
        })
        .catch((err) => {
          console.log(err);
          alert("저장에 실패하였습니다.");
        });
    }
  });
};

const deleteQna = () => {
  let result = confirm("삭제하시겠습니까?");
  if (result) {
    let qnaOid = route.query.qnaOid;
    let fileList = modifyForm.value.data.fileList;
    $axios
      .delete(util.format($apiUrls.admin.qna.deleteQnaDetail, qnaOid), {
        data: fileList,
      })
      .then(() => {
        alert("삭제가 완료되었습니다.");
        goToList();
      })
      .catch((err) => {
        console.log(err);
        alert("삭제 실패하였습니다.");
      });
  }
};
</script>
<style lang="scss"></style>
