<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>QNA 검색</h3>
      </div>
      <div class="boxCnt">
        <QnaSearchForm
          :qnaCode="state.qnaCode"
          :searchWordVisibleYn="searchWordVisibleYn"
          @searchQna="searchQna"
        />
      </div>
    </div>

    <div class="boxLayout">
      <div class="boxTit">
        <h3>QNA 목록</h3>
      </div>
      <div class="boxCnt">
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
    <ul class="btnSec taR mt10">
      <li>
        <el-button type="primary" size="large"
          v-if="isWriteYn(route.meta.auth)"          
          @click="goToEditPage"
          >등록</el-button
        >
      </li>
    </ul>
  </div>
</template>
<script setup>
import QnaSearchForm from "@/components/admin/qna/QnaSearchForm.vue";
import QnaList from "@/components/admin/qna/QnaList.vue";

import { onMounted, reactive, ref, getCurrentInstance, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { getUser } from "@/assets/js/auth.js";
import util from "util";
import {
  getGlobalProperties,
  isWriteYn,
  isReadYn,
  routerPush,
  getCookie,
} from "@/assets/js/common.js";
import metaNotifcUtil from "@/assets/js/metaNotifcUtil.js"

const user = getUser();
const store = useStore();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
  getCurrentInstance().appContext.config.globalProperties.$emitter;
const searchWordVisibleYn = ref(false);

const state = reactive({
  qnaList: [],
  qnaCode: [],
  pageInfo: {
    curPage: 1,
    fromDate: "",
    toDate: "",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    sttusCd: "",
    qnaTitle: "",
  },
});

const getQnaList = () => {
  $axios
    .get($apiUrls.admin.qna.getQnaListPaging, {
      params: {
        curPage: state.pageInfo.curPage,
        pltfrmId: getCookie("pltfrmId"),
        regrId: user.id,
        qnaTitle: state.pageInfo.qnaTitle,
        searchRegSt: state.pageInfo.fromDate,
        searchRegEd: state.pageInfo.toDate,
        sttusCd: state.pageInfo.sttusCd,
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

const countRetvNum = (qnaOid) => {
  $axios
    .patch(util.format($apiUrls.admin.qna.patchQnaHit, qnaOid))
    .then(() => {})
    .catch((err) => {
      console.log(err);
    });
};

const qnaDetail = (payload) => {
  if (!isReadYn(route.meta.auth)) {
    alert("읽기 권한이 없습니다.");
    return;
  }
  let platform = getCookie("pltfrmId");
  let query = {
    qnaOid: payload.qnaOid,
  };
  countRetvNum(payload.qnaOid);
  routerPush(platform, "MyQnaDetailPage", query);
};

const searchQna = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.fromDate = payload.pageInfo.fromDate;
  state.pageInfo.toDate = payload.pageInfo.toDate;
  state.pageInfo.sttusCd = payload.pageInfo.sttusCd;
  state.pageInfo.qnaTitle = payload.pageInfo.qnaTitle;
  getQnaList();
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getQnaList();
};   
 
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

const goToEditPage = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "MyQnaEditPage", query);
};

onMounted(() => {
  getQnaCode();
  getQnaList();
});
</script>
<style lang="scss"></style>