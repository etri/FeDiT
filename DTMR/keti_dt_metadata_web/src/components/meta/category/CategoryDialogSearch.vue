<template>
  <div class="dialog-area" id="codePopup">
    <CategoryDialogSearchForm @searchCategory="searchCategory" />

    <div class="boxLayout">
      <div class="boxTit">
        <h3>카테고리 검색결과</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <CategoryDialogSearchList
            :categoryList="state.categoryList"
            :totalPage="state.pageInfo.totalListSize"
            :curPage="state.pageInfo.curPage"
            @chooseUpperCategory="chooseUpperCategory"
            @pageMove="pageMove"
          />
        </div>
      </div>
    </div>
  </div>

</template>
<script setup>
import CategoryDialogSearchForm from "@/components/meta/category/CategoryDialogSearchForm.vue";
import CategoryDialogSearchList from "@/components/meta/category/CategoryDialogSearchList.vue";

import { reactive, onMounted, defineEmits } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const emits = defineEmits(["selectCategory"]);

const state = reactive({
  categoryList: [],
  category: {},
  pageInfo: {
    curPage: 1,
    mtcdGrpUseYn: "use", // 해당 modal 검색 조건 -> 사용 상태 default
    searchWord: "",
    searchType: "1",
    searchUpcdWord: "",
    searchUpcdType: "1",
    ctgryId: "",
    upCtgryId: "",
    ctgryNm: "",
    ctgryRdfCncptNm: "",

    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
  },
});

onMounted(() => {
  getUsableStateCategoryList();
});

const getUsableStateCategoryList = () => {
  $axios
    .get($apiUrls.meta.resource.category.getCategoryList, {
      params: {
        curPage: state.pageInfo.curPage,
        ctgryDataSttusMtcd: "use",
        ctgryNm:
          state.pageInfo.searchType == 1 ? state.pageInfo.searchWord : null,
        ctgryId:
          state.pageInfo.searchType == 2 ? state.pageInfo.searchWord : null,
        ctgryRdfCncptNm:
          state.pageInfo.searchType == 3 ? state.pageInfo.searchWord : null,
        upCtgryNm:
          state.pageInfo.searchUpcdType == 1
            ? state.pageInfo.searchUpcdWord
            : null,
        upCtgryId:
          state.pageInfo.searchUpcdType == 2
            ? state.pageInfo.searchUpcdWord
            : null,
        sortField: "ctgryNm",
        sortOrder: "ascending",
      },
    })
    .then((res) => {
      state.categoryList = res.data.list;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const searchCategory = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.searchType = payload.pageInfo.searchType;
  state.pageInfo.searchWord = payload.pageInfo.searchWord;
  state.pageInfo.searchUpcdType = payload.pageInfo.searchUpcdType;
  state.pageInfo.searchUpcdWord = payload.pageInfo.searchUpcdWord;
  state.pageInfo.ctgryMappgCd = payload.pageInfo.ctgryMappgCd;
  state.pageInfo.ctgryId = payload.pageInfo.ctgryId;
  state.pageInfo.upCtgryId = payload.pageInfo.upCtgryId;

  getUsableStateCategoryList();
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getUsableStateCategoryList();
};

const chooseUpperCategory = (payload) => {
  state.category.ctgryId = payload.ctgryId;
  state.category.ctgryNm = payload.ctgryNm;
  state.category.ctgryRdfCncptNm = payload.ctgryRdfCncptNm;
  emits("selectCategory", payload);
};
</script>
<style lang="scss"></style>