<template>
  <div>
    <div class="cntSec">

      <!--QNA 검색 -->
      <QnaSearchForm @searchQna="searchQna" :qnaCode="state.qnaCode" />

      <div class="boxLayout">
        <div class="boxTit">
          <h3>QNA 목록</h3>
        </div>
        <div class="boxCnt">
          <div style="overflow-x: hidden; overflow-y: auto">
            <QnaList
              :qnaList="state.qnaList"
              :qnaCode="state.qnaCode"
              :totalPage="state.pageInfo.totalListSize"
              :curPage="state.pageInfo.curPage"
              @pageMove="pageMove"
              @qnaDetail="qnaDetail"
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
            @click="registerQna"
            >등록</el-button
          >
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import QnaSearchForm from "@/components/admin/qna/QnaSearchForm.vue";
import QnaList from "@/components/admin/qna/QnaList.vue";
import { useStore } from "vuex";
import { onMounted, reactive } from "vue";
import { useRoute } from "vue-router";
import util from "util";
import {
  getGlobalProperties,
  isWriteYn,
  isReadYn,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const store = useStore();
const route = useRoute();

const state = reactive({
  qnaList: [],
  qnaCode: [],
  pageInfo: {
    curPage: 1,
    fromDate: "",
    toDate: "",
    searchWord: "",
    searchType: 0,
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    sttusCd: "",
  },
});

onMounted(() => {
  getQnaCode();
  getQnaList();
});

const getQnaCode = async () => {
  await store.dispatch("CodeStore/getCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      grpIdList: ["CGR00479"],
    },
  });

  const typeCdList = store.getters["CodeStore/getStoreCodeList"]("CGR00479");
  state.qnaCode = typeCdList;
};

const getQnaList = () => {
  $axios
    .get($apiUrls.admin.qna.getQnaListPaging, {
      params: {
        curPage: state.pageInfo.curPage,
        qnaTitle:
          state.pageInfo.searchType == 1 ? state.pageInfo.searchWord : null,
        regrId:
          state.pageInfo.searchType == 2 ? state.pageInfo.searchWord : null,
        searchWord:
          state.pageInfo.searchType == 0 ? state.pageInfo.searchWord : null,
        searchRegSt: state.pageInfo.fromDate,
        searchRegEd: state.pageInfo.toDate,
        sttusCd: state.pageInfo.sttusCd,
        pltfrmId: getCookie("pltfrmId"),
      },
    })
    .then((res) => {
      state.qnaList = res.data.data;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getQnaList();
};


const qnaDetail = (payload) => {
  if (isReadYn(route.meta.auth)) {
    let platform = getCookie("pltfrmId");
    let query = {
      qnaOid: payload.qnaOid,
    };
    countRetvNum(payload.qnaOid);
    routerPush(platform, "QnaDetailPage", query);
  } else {
    alert("읽기 권한이 없습니다.");
  }
};


const countRetvNum = (qnaOid) => {
  $axios
    .patch(util.format($apiUrls.admin.qna.patchQnaHit, qnaOid))
    .then(() => {
      
    })
    .catch((err) => {
      console.log(err);
    });
}

const searchQna = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.searchType = payload.pageInfo.searchType;
  state.pageInfo.searchWord = payload.pageInfo.searchWord;
  state.pageInfo.fromDate = payload.pageInfo.fromDate;
  state.pageInfo.toDate = payload.pageInfo.toDate;
  state.pageInfo.sttusCd = payload.pageInfo.sttusCd;

  getQnaList();
};

const registerQna = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "QnaEditPage", query);
};
</script>
<style lang="scss"></style>
