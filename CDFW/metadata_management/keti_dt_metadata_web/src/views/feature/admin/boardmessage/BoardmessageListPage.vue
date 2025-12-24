<template>
  <div>
    <div class="cntSec">
      <div class="boxLayout">
        <div class="boxTit">
          <h3>{{ state.board.bbsNm }} 검색</h3>
        </div>
        <div class="boxCnt">
          <BoardmessageSearchForm @searchBoardmessage="searchBoardmessage" />
        </div>
      </div>
      <div class="boxLayout">
        <div class="boxTit">
          <h3>{{ state.board.bbsNm }} 목록</h3>
        </div>
        <div class="boxCnt">
          <div style="overflow-x: hidden; overflow-y: auto">
            <BoardmessageList
              :brdmessageList="state.brdmessageList"
              :totalPage="state.pageInfo.totalListSize"
              :curPage="state.pageInfo.curPage"
              @pageMove="pageMove"
              @detailBoardmsg="detailBoardmsg"
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
import BoardmessageSearchForm from "@/components/admin/boardmessage/BoardmessageSearchForm.vue";
import BoardmessageList from "@/components/admin/boardmessage/BoardmessageList.vue";

import { reactive, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  isWriteYn,
  isReadYn,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";

import util from "util";
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const route = useRoute();

const state = reactive({
  brdmessageList: [],
  board: {},
  bbsOid: "",
  pageInfo: {
    curPage: 1,
    fromDate: "",
    toDate: "",
    searchWord: "",
    searchType: "0",
    regrId: "",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    searchFirstTF: "0",
  },
});

watch(
  () => route.query.param,
  () => {
    let bbsOid = setBbsOid();
    getBoardDetail(bbsOid);
    getBoardmessageList(bbsOid);
    state.pageInfo.curPage = 1;
    state.pageInfo.fromDate = "";
    state.pageInfo.toDate = "";
    state.pageInfo.searchWord = "";
    state.pageInfo.searchType = 0;
    state.pageInfo.regrId = "";
    state.pageInfo.totalListSize = 0;
  }
);

onMounted(() => {
  state.bbsOid = setBbsOid();
  getBoardDetail(state.bbsOid);
  getBoardmessageList(state.bbsOid);
});

const setBbsOid = () => {
  if (route.query.param == null) return null;
  else {
    let checkOidArr = route.query.param.split("=");
    return checkOidArr[1];
  }
};

const getBoardDetail = (bbsOid) => {
  $axios
    .get(util.format($apiUrls.admin.board.getBoardDetail, bbsOid))
    .then((res) => {
      state.board = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getBoardmessageList = (bbsOid) => {
  $axios
    .get(util.format($apiUrls.admin.boardmsg.getboardmsgPaging), {
      params: {
        curPage: state.pageInfo.curPage,
        bbsOid: bbsOid,
        pstngTitle:
          state.pageInfo.searchType == 1 ? state.pageInfo.searchWord : null,
        pstngSbst:
          state.pageInfo.searchType == 2 ? state.pageInfo.searchWord : null,
        searchWord:
          state.pageInfo.searchType == 0 ? state.pageInfo.searchWord : null,
        regrId: state.pageInfo.regrId,
        searchRegSt: state.pageInfo.fromDate,
        searchRegEd: state.pageInfo.toDate,
        pltfrmId: getCookie("pltfrmId"),
      },
    })
    .then((res) => {
      state.brdmessageList = res.data.data;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const registerBoard = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    param: route.query.param,
  };
  routerPush(platform, "BoardmessageEditPage", query);
};
const searchBoardmessage = (payload) => {
  state.pageInfo = payload.pageInfo;
  state.pageInfo.curPage = payload.curPage;
  getBoardmessageList(state.bbsOid);
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getBoardmessageList(state.bbsOid);
};

const detailBoardmsg = (payload) => {
  if (isReadYn(route.meta.auth)) {
    let platform = getCookie("pltfrmId");
    let query = {
      param: route.query.param,
      pstngOid: payload.pstngOid,
    };
    countRetvNum(payload.pstngOid);
    routerPush(platform, "BoardmessageDetailPage", query);
  } else {
    alert("읽기 권한이 없습니다.");
  }
};

const countRetvNum = (pstngOid) => {
  $axios
    .patch(util.format($apiUrls.admin.boardmsg.patchBoardmsgeHit, state.bbsOid, pstngOid))
    .then(() => {
      
    })
    .catch((err) => {
      console.log(err);
    });
}
</script>
<style lang="scss"></style>
