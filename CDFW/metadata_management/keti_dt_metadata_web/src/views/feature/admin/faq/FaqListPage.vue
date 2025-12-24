<template>
  <div>
    <div class="cntSec">
      
      <!-- FAQ 검색 -->
      <FaqSearchForm @searchFaq="searchFaq" />

      <div class="boxLayout">
        <div class="boxTit">
          <h3>FAQ 목록</h3>
        </div>
        <div class="boxCnt">
          <div style="overflow-x: hidden; overflow-y: auto">
            <FaqList
              :faqList="state.faqList"
              :totalPage="state.pageInfo.totalListSize"
              :curPage="state.pageInfo.curPage"
              @pageMove="pageMove"
              @faqDetail="faqDetail"
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
            @click="registerFaq"
            >등록</el-button
          >
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import FaqSearchForm from "@/components/admin/faq/FaqSearchForm.vue";
import FaqList from "@/components/admin/faq/FaqList.vue";
import util from "util";
import { onMounted, reactive } from "vue";
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
  faqList: [],
  pageInfo: {
    curPage: 1,
    fromDate: "",
    toDate: "",
    searchWord: "",
    searchType: "0",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
  },
});

onMounted(() => {
  getFaqList();
});

const getFaqList = () => {
  $axios
    .get($apiUrls.admin.faq.getFaqListPaging, {
      params: {
        curPage: state.pageInfo.curPage,
        faqTitle:
          state.pageInfo.searchType == 1 ? state.pageInfo.searchWord : null,
        regrId:
          state.pageInfo.searchType == 2 ? state.pageInfo.searchWord : null,
        searchWord:
          state.pageInfo.searchType == 0 ? state.pageInfo.searchWord : null,
        searchRegSt: state.pageInfo.fromDate,
        searchRegEd: state.pageInfo.toDate,
        pltfrmId: getCookie("pltfrmId"),
      },
    })
    .then((res) => {
      state.faqList = res.data.data;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const registerFaq = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "FaqEditPage", query);
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getFaqList();
};

const faqDetail = (payload) => {
  if (isReadYn(route.meta.auth)) {
    let platform = getCookie("pltfrmId");
    let query = {
      faqOid: payload.faqOid,
    };
    countRetvNum(payload.faqOid);
    routerPush(platform, "FaqDetailPage", query);
  } else {
    alert("읽기 권한이 없습니다.");
  }
};


const countRetvNum = (faqOid) => {
  $axios
    .patch(util.format($apiUrls.admin.faq.patchFaqHit, faqOid))
    .then(() => {
      
    })
    .catch((err) => {
      console.log(err);
    });
}

const searchFaq = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.searchType = payload.pageInfo.searchType;
  state.pageInfo.searchWord = payload.pageInfo.searchWord;
  state.pageInfo.fromDate = payload.pageInfo.fromDate;
  state.pageInfo.toDate = payload.pageInfo.toDate;

  getFaqList();
};
</script>
<style lang="scss"></style>
