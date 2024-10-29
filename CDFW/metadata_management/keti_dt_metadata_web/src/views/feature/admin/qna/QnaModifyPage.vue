<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>Q&A 수정</h3>
      </div>
      <div class="boxCnt">
        <QnaModify ref="modify" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="modifyQna">저장</el-button>
      <el-button
        v-if="isDelYn(route.meta.auth)"
        type="primary"
        text
        bg
        @click="deleteQna"
        >삭제</el-button
      >
      <el-button plain type="primary" @click="goToReadPage">취소</el-button>
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

const modify = ref(null);

const modifyQna = async () => {
  let ruleForm = modify.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let result = confirm("수정 하시겠습니까?");
      if (result) {
        const qnaOid = route.query.qnaOid;
        const { qna, fileList, originFile } = modify.value.data;
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
          .put(
            util.format($apiUrls.admin.qna.modifyQnaDetail, qnaOid),
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          )
          .then(() => {
            alert("수정이 완료되었습니다.");

            let platform = getCookie("pltfrmId");
            let query = {
              qnaOid: route.query.qnaOid,
            };
            routerPush(platform, "QnaDetailPage", query);
          })
          .catch((err) => {
            console.log(err);

            alert("저장에 실패하였습니다.");
          });
      }
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

const findDelArr = (fileList, originFile) => {
  const delArr = originFile.filter((origin) => {
    return !fileList.some((file) => file.atcOid === origin.atcOid);
  });
  return delArr;
};

const deleteQna = () => {
  let result = confirm("삭제 하시겠습니까?");
  if (result) {
    let qnaOid = route.query.qnaOid;
    let fileList = modify.value.data.fileList;
    $axios
      .delete(util.format($apiUrls.admin.qna.deleteQnaDetail, qnaOid), {
        data: fileList,
      })
      .then(() => {
        alert("삭제가 완료되었습니다.");

        let platform = getCookie("pltfrmId");
        let query = null;
        routerPush(platform, "QnaListPage", query);
      })
      .catch((err) => {
        console.log(err);
        alert("삭제에 실패하였습니다.");
      });
  }
};
const goToReadPage = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    qnaOid: route.query.qnaOid,
  };
  routerPush(platform, "QnaDetailPage", query);
};
</script>
<style lang="scss"></style>
