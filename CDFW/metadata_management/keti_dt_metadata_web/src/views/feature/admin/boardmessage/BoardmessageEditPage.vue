<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>등록</h3>
      </div>
      <div class="boxCnt">
        <BoardmessageEdit ref="boardmsg" :board="board" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditBoardmsg">저장</el-button>
      <el-button plain type="primary" @click="goToList">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import BoardmessageEdit from "@/components/admin/boardmessage/BoardmessageEdit.vue";

import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const route = useRoute();

const boardmsg = ref(null);
const board = ref({});

onMounted(() => {
  getBoardDetail();
});

const setBbsOid = () => {
  let checkOidArr = route.query.param.split("=");
  return checkOidArr[1];
};

const EditBoardmsg = async () => {
  let ruleForm = boardmsg.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      const bbsOid = setBbsOid();
      const { pstngTitle, pstngSbst, prevPstngYn, retvNum } =
        boardmsg.value.boardmsg;
      const fileList = boardmsg.value.data.fileList;

      const boardmsgInfo = {
        pstngTitle,
        pstngSbst,
        prevPstngYn: prevPstngYn ? "Y" : "N",
        retvNum,
        pltfrmId: getCookie("pltfrmId"),
      };
      const formData = new FormData();

      formData.append(
        "info",
        new Blob([JSON.stringify(boardmsgInfo)], { type: "application/json" })
      );

      if (fileList.length > 0) {
        fileList.forEach((file) => formData.append("fileList", file.raw));
      }
      $axios
        .post(
          util.format($apiUrls.admin.boardmsg.setBoardmsgDetail, bbsOid),
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        )
        .then(() => {
          alert("저장이 완료되었습니다.");

          let platform = getCookie("pltfrmId");
          let query = {
            param: route.query.param,
          };
          routerPush(platform, "BoardmessageListPage", query);
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

const getBoardDetail = () => {
  let bbsOid = setBbsOid();
  $axios
    .get(util.format($apiUrls.admin.board.getBoardDetail, bbsOid))
    .then((res) => {
      board.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    param: route.query.param,
  };
  routerPush(platform, "BoardmessageListPage", query);
};
</script>
<style lang="scss"></style>
