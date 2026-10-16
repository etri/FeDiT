<template>
<!-- 카테고리 관리 -->
  <div class="cntSec">
    <CategorySearchForm
      :dataStatusList="dataStatusList"
      @searchCategory="searchCategory"
    />

    <div class="btnSec taR mt10">
      <el-button type="primary" plain size="large" @click="metaCommon.Buttons.ketidtskosInfoPage.click()" >{{ metaCommon.Buttons.ketidtskosInfoPage.label }}</el-button>
      <el-button type="primary" size="large"
        v-if="isWriteYn(route.meta.auth)"        
        @click="dialogVisibleEdit = true"
      >등록</el-button
      >
    </div>    
    <el-dialog v-model="dialogVisibleEdit" title="카테고리 등록">
      <CategoryDialogEdit
        :countryCodeList="countryCodeList"
        :dataStatusList="dataStatusList"
        :ctgryTypeList="ctgryTypeList"
        @cancelDialog="cancelDialog" 
        @editCategoryInfo="editCategoryInfo" 
      /> 
    </el-dialog>  

    <div class="boxLayout">
      <div class="boxTit">
        <h3>카테고리 목록</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <CategoryList
            :categoryList="state.categoryList"
            :totalPage="state.pageInfo.totalListSize"
            :countryCodeList="countryCodeList"
            :dataStatusList="dataStatusList"
            :ctgryTypeList="ctgryTypeList"
						:curPage="state.pageInfo.curPage"
            @pageMove="pageMove"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import CategorySearchForm from "@/components/meta/category/CategorySearchForm.vue";
import CategoryList from "@/components/meta/category/CategoryList.vue";
import CategoryDialogEdit from "@/components/meta/category/CategoryDialogEdit.vue";
import metaCommon from "@/assets/js/metaCommon.js";

import { onMounted, reactive, ref, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import {
  getGlobalProperties,
  isWriteYn,
  isReadYn,
} from "@/assets/js/common.js";
import dayjs from "dayjs";

const store = useStore();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
  getCurrentInstance().appContext.config.globalProperties.$emitter;

const dialogVisibleEdit = ref(false);

const countryCodeList = ref([]);
const dataStatusList = ref([]);
const ctgryTypeList = ref([]);

const state = reactive({
  categoryList: [],
  pageInfo: {
    curPage: 1,
    srchStartDd: "",
    srchEndDd: "",
    searchWord: "",
    searchType: "1",

    ctgryDataSttusMtcd: "",
    ctgryNm: "",
    ctgryRdfCncptNm: "",
    upCtgryId: "",

    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
  },
});

onMounted(() => {
  getCategoryList();
  getCountryCodeList();
  getMetaCodeList();
  getCtgryTypeList();

  $emitter.on("initCategoryList", () => {
    getCategoryList();
  });
});

const getCategoryList = () => {
  $axios
    .get($apiUrls.meta.resource.category.getCategoryList, {
      params: {
        curPage: state.pageInfo.curPage,
        srchStartDd: state.pageInfo.srchStartDd,
        srchEndDd: state.pageInfo.srchEndDd,

        ctgryDataSttusMtcd: state.pageInfo.ctgryDataSttusMtcd,
        upCtgryId: state.pageInfo.upCtgryId,
        ctgryNm:
          state.pageInfo.searchType == 1 ? state.pageInfo.searchWord : null,
        ctgryId:
          state.pageInfo.searchType == 2 ? state.pageInfo.searchWord : null,
        ctgryRdfCncptNm:
          state.pageInfo.searchType == 3 ? state.pageInfo.searchWord : null,
      },
    })
    .then((res) => {
      state.categoryList = res.data.list.map((x) => {
        x.ctgryAmdDt = dayjs(x.ctgryAmdDt).format("YYYY-MM-DD");
        return x;
      });
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getCountryCodeList = async () => {
  await store.dispatch("MetaStore/getCountryCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
  });

  const CountryCodeList = store.getters["MetaStore/getStoreCountryCodeList"];
  countryCodeList.value = CountryCodeList;
};

const getMetaCodeList = async () => {
  await store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00002"],
    },
  });

  const List = store.getters["MetaStore/getStoreMetaCodeList"]("MCG00002");
  dataStatusList.value = List;
};

const getCtgryTypeList = async () => {
  await store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00005"],
    },
  });

  const CtgryTypeList =
    store.getters["MetaStore/getStoreMetaCodeList"]("MCG00005");
  ctgryTypeList.value = CtgryTypeList;
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getCategoryList();
};

const searchCategory = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.srchStartDd = payload.pageInfo.srchStartDd;
  state.pageInfo.srchEndDd = payload.pageInfo.srchEndDd;
  state.pageInfo.searchType = payload.pageInfo.searchType;
  state.pageInfo.searchWord = payload.pageInfo.searchWord;

  state.pageInfo.ctgryDataSttusMtcd = payload.pageInfo.ctgryDataSttusMtcd;
  state.pageInfo.ctgryNm = payload.pageInfo.ctgryNm;
  state.pageInfo.upCtgryId = payload.pageInfo.upCtgryId;
  getCategoryList();
};

const editCategoryInfo = () => {
  getCategoryList();
  dialogVisibleEdit.value = false;
};

const cancelDialog = () => {
  dialogVisibleEdit.value = false;
};
</script>
<style lang="scss"></style>