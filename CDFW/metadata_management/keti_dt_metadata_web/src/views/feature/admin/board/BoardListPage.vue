<template>
  <div>
    <div class="cntSec">
      <div class="boxLayout">
        <div class="boxTit">
          <h3>게시판 검색</h3>
        </div>
        <div class="boxCnt">
          <BoardSearchForm @searchBoard="searchBoard" />
        </div>
      </div>
      <div class="boxLayout">
        <div class="boxTit">
          <h3>게시판 목록</h3>
        </div>
        <div class="boxCnt">
          <div style="overflow-x: hidden; overflow-y: auto">
            <BoardList
              :boardList="state.boardList"
              :totalPage="state.pageInfo.totalListSize"
              :curPage="state.pageInfo.curPage"
              @pageMove="pageMove"
              @detailBoard="detailBoard"
            />
          </div>
        </div>
      </div>
      <ul class="btnSec taR mt10">
        <li>
          <el-button
            v-if="isWriteYn(route.meta.auth)"
            type="primary"
            size="large"
            @click="registerBoard"
            >등록</el-button
          >
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import BoardSearchForm from "@/components/admin/board/BoardSearchForm.vue";
import BoardList from "@/components/admin/board/BoardList.vue";

import { reactive, onMounted } from "vue";
import {
  getGlobalProperties,
  isWriteYn,
  isReadYn,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import { useRoute } from "vue-router";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const route = useRoute();

const state = reactive({
  boardList: [],
  pageInfo: {
    curPage: 1,
    fromDate: "",
    toDate: "",
    searchWord: "",
    searchType: "0",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    searchFirstTF: "0",
  },
});
onMounted(() => {
  getBoardList();
});

const getBoardList = () => {
  $axios
    .get($apiUrls.admin.board.getBoardPaging, {
      params: {
        curPage: state.pageInfo.curPage,
        searchWord: state.pageInfo.searchWord,
        pltfrmId: getCookie("pltfrmId"),
      },
    })
    .then((res) => {
      state.boardList = res.data.data;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const registerBoard = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "BoardEditPage", query);
};
const searchBoard = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.searchWord = payload.pageInfo.value.searchWord;
  getBoardList();
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getBoardList();
};

const detailBoard = (payload) => {
  if (isReadYn(route.meta.auth)) {
    let platform = getCookie("pltfrmId");
    let query = {
      bbsOid: payload.bbsOid,
    };
    routerPush(platform, "BoardDetailPage", query);
  } else {
    alert("읽기 권한이 없습니다.");
  }
};
</script>
<style lang="scss"></style>
