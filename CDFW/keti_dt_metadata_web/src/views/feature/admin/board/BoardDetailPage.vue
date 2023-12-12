<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>게시판 정보</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <BoardDetail :board="board" />
        </div>
      </div>
    </div>
    <div class="btnSec taR">
      <el-button
        v-if="isAmdYn(route.meta.auth)"
        type="primary"
        @click="modifyBoard"
        >수정</el-button
      >
      <el-button type="primary" plain @click="goToList">목록</el-button>
    </div>
  </div>
</template>
<script setup>
import BoardDetail from "@/components/admin/board/BoardDetail.vue";

import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  isAmdYn,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const board = ref({});
onMounted(() => {
  getBoardDetail();
});

const getBoardDetail = () => {
  let bbsOid = route.query.bbsOid;
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
  let query = null;
  routerPush(platform, "BoardListPage", query);
};
const modifyBoard = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    bbsOid: route.query.bbsOid,
  };
  routerPush(platform, "BoardModifyPage", query);
};
</script>
<style lang="scss"></style>
