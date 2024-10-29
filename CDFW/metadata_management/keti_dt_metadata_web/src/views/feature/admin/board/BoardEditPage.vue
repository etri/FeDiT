<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>게시판 등록</h3>
      </div>
      <div class="boxCnt">
        <BoardEdit ref="editBoard" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="saveBoard">저장</el-button>
      <el-button plain type="primary" @click="goToList">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import BoardEdit from "@/components/admin/board/BoardEdit.vue";

import { ref } from "vue";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const editBoard = ref(null);

const saveBoard = async () => {
  let ruleForm = editBoard.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let board = editBoard.value.board;

      let boardInfo = {
        bbsNm: board.bbsNm,
        bbsCd: board.bbsCd,
        atcFileUseYn: board.atcFileUseYn == true ? "Y" : "N",
        replUseYn: board.replUseYn == true ? "Y" : "N",
        pltfrmId: getCookie("pltfrmId"),
      };

      $axios
        .post($apiUrls.admin.board.setBoardDetail, boardInfo)
        .then(() => {
          alert("등록이 완료되었습니다.");
          let platform = getCookie("pltfrmId");
          let query = null;
          routerPush(platform, "BoardListPage", query);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};
const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "BoardListPage", query);
};
</script>
<style lang="scss"></style>
