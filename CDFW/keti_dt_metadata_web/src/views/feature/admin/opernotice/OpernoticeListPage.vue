<template>
  <div>
    <div class="cntSec">
      
      <!-- 공지사항 검색 -->
      <OpernoticeSearchForm @searchOpernotice="searchOpernotice" />
      
      <div class="boxLayout">
        <div class="boxTit">
          <h3>공지사항 목록</h3>
        </div>
        <div class="boxCnt">
          <div style="overflow-x: hidden; overflow-y: auto">
            <OpernoticeList
              :operList="state.operList"
              :totalPage="state.pageInfo.totalListSize"
              :curPage="state.pageInfo.curPage"
              @pageMove="pageMove"
              @detailNotice="detailNotice"
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
            @click="registerOpernotice"
            >등록</el-button
          >
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import OpernoticeSearchForm from "@/components/admin/opernotice/OpernoticeSearchForm.vue";
import OpernoticeList from "@/components/admin/opernotice/OpernoticeList.vue";

import { onMounted, reactive } from "vue";
import {
  getGlobalProperties,
  isWriteYn,
  isReadYn,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import { useRoute } from "vue-router";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const route = useRoute();

const state = reactive({
  operList: [],
  pageInfo: {
    curPage: 1,
    fromDate: "",
    toDate: "",
    searchWord: "",
    searchType: "0",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    prevNtfYn: "",
  },
});

onMounted(() => {
  getOpernoticeList();
});

const getOpernoticeList = () => {
  $axios
    .get($apiUrls.admin.notices.getNoticePaging, {
      params: {
        curPage: state.pageInfo.curPage,
        ntfTitle:
          state.pageInfo.searchType == 1 ? state.pageInfo.searchWord : null,
        regrId: state.pageInfo.searchType == 2 ? state.pageInfo.searchWord : null,
        searchWord:
          state.pageInfo.searchType == 0 ? state.pageInfo.searchWord : null,
        prevNtfYn: state.pageInfo.prevNtfYn,
        searchRegSt: state.pageInfo.fromDate,
        searchRegEd: state.pageInfo.toDate,
        pltfrmId: getCookie("pltfrmId"),
      },
    })
    .then((res) => {
      state.operList = res.data.data;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
      console.log(state.operList);
    })
    .catch((err) => {
      console.log(err);
    });
};

const registerOpernotice = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "OpernoticeEditPage", query);
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getOpernoticeList();
};

const detailNotice = (payload) => {
  if (isReadYn(route.meta.auth)) {
    let platform = getCookie("pltfrmId");
    let query = {
      ntfOid: payload.ntfOid,
    };
    countRetvNum(payload.ntfOid);
    routerPush(platform, "OpernoticeDetailPage", query);
  } else {
    alert("읽기 권한이 없습니다.");
  }
};

const countRetvNum = (ntfOid) => {
  $axios
    .patch(util.format($apiUrls.admin.notices.patchNoticeHit, ntfOid))
    .then(() => {
      
    })
    .catch((err) => {
      console.log(err);
    });
}

const searchOpernotice = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.searchWord = payload.pageInfo.searchWord;

  state.pageInfo.searchType =
    payload.pageInfo.searchType == "" ? 0 : payload.pageInfo.searchType;

  state.pageInfo.prevNtfYn =
    payload.pageInfo.prevNtfYn == "" ? 0 : payload.pageInfo.prevNtfYn;

  if (payload.pageInfo.fromDate == null) state.pageInfo.fromDate = "";
  else if (payload.pageInfo.fromDate.length > 0) {
    if (payload.pageInfo.fromDate.toString().includes("-") == true)
      state.pageInfo.fromDate = payload.pageInfo.fromDate;
    else null;
  }

  if (payload.pageInfo.toDate != "") {
    if (payload.pageInfo.toDate.toString().includes("-") == true)
      state.pageInfo.toDate = payload.pageInfo.toDate;
    else null;
  } else state.pageInfo.toDate = "";
  getOpernoticeList();
};
</script>
<style lang="scss"></style>
