<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>코드그룹 수정</h3>
      </div>
      <div class="boxCnt">
        <BoardModify ref="modifyBoard" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="modifyBoardDetail">저장</el-button>
      <el-button
        v-if="isDelYn(route.meta.auth)"
        type="primary"
        text
        bg
        @click="deleteBoard"
        >삭제</el-button
      >
      <el-button plain type="primary" @click="goToReadPage">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import BoardModify from "@/components/admin/board/BoardModify.vue";

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

const modifyBoard = ref(null);

const modifyBoardDetail = async () => {
  let ruleForm = modifyBoard.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let result = confirm("수정 하시겠습니까?");
      if (result) {
        let bbsOid = route.query.bbsOid;
        let board = modifyBoard.value.data.board;

        let boardInfo = {
          ...board,
          atcFileUseYn: board.atcFileUseYn == true ? "Y" : "N",
          replUseYn: board.replUseYn == true ? "Y" : "N",
        };

        $axios
          .put(
            util.format($apiUrls.admin.board.modifyBoardDetail, bbsOid),
            boardInfo
          )
          .then(() => {
            alert("수정이 완료되었습니다.");

            let platform = getCookie("pltfrmId");
            let query = {
              bbsOid: route.query.bbsOid,
            };
            routerPush(platform, "BoardDetailPage", query);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

const deleteBoard = () => {
  let result = confirm("삭제 하시겠습니까?");
  if (result) {
    let bbsOid = route.query.bbsOid;

    $axios
      .delete(util.format($apiUrls.admin.board.deleteBoardDetail, bbsOid))
      .then(() => {
        alert("삭제가 완료되었습니다.");

        let platform = getCookie("pltfrmId");
        let query = null;
        routerPush(platform, "BoardListPage", query);
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

const goToReadPage = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    bbsOid: route.query.bbsOid,
  };
  routerPush(platform, "BoardDetailPage", query);
};
</script>
<style lang="scss"></style>
