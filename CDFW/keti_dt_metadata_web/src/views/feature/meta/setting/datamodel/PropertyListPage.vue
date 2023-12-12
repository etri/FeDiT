<template>
<!-- 메타데이터 프라퍼티 검색 -->
  <div class="cntSec">
    <PropertySearchForm
      :domainModelList="state.domainModelList"
      :dataStatusCdList="dataStatusCdList"
      @searchPropertyList="searchPropertyList"
    />

    <div class="btnSec taR mt10">
      <el-button type="primary" size="large"
        v-if="isWriteYn(route.meta.auth)"        
        @click="dialogVisibleEdit = true"
        >등록</el-button
      >
    </div>
    <el-dialog v-model="dialogVisibleEdit" title="프라퍼티 등록">
      <PropertyDialogEdit
        :dataStatusCdList="dataStatusCdList"
        :metaCodeGroupList="metaCodeGroupList"
        :domainModelList="state.domainModelList"
        @cancelDialog="cancelDialog"
        @editPropertyInfo="editPropertyInfo"
      />
    </el-dialog>

    <div class="boxLayout">
      <div class="boxTit">
        <h3>프라퍼티 검색 결과</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <PropertyList
            :propertyList="state.propertyList"
            :totalPage="state.pageInfo.totalListSize"
            :curPage="state.pageInfo.curPage"
            :metaCodeGroupList="metaCodeGroupList"
            :domainModelList="state.domainModelList"
            :dataStatusCdList="dataStatusCdList"
            @pageMove="pageMove"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import PropertyList from "@/components/meta/datamodel/PropertyList.vue";
import PropertySearchForm from "@/components/meta/datamodel/PropertySearchForm.vue";
import PropertyDialogEdit from "@/components/meta/datamodel/PropertyDialogEdit.vue";

import { getGlobalProperties, isWriteYn } from "@/assets/js/common.js";
import { ref, reactive, onMounted, computed, getCurrentInstance } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";

const $emitter =
  getCurrentInstance().appContext.config.globalProperties.$emitter;
const store = useStore();
const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const dialogVisibleEdit = ref(false);
const state = reactive({
  propertyList: [],
  domainModelList: [],
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    searchAmdStDt : "", 
    searchAmdEdDt : "",
    searchName:"",
    domnModelId:"",
    prptyDataSttusMtcd:"",
  },
});

onMounted(() => {
  init();
});

const init = async () => {
  await store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00002"],
    },
  });
  getMetaCodeGroupList();
  getDomainModelList();
  getPropertyList();
  $emitter.on("initPropertyList", getPropertyList);
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getPropertyList();
};

const searchPropertyList = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.searchAmdStDt = payload.pageInfo.searchAmdStDt;
  state.pageInfo.searchAmdEdDt = payload.pageInfo.searchAmdEdDt;
  state.pageInfo.searchName = payload.pageInfo.searchName;
  state.pageInfo.domnModelId = payload.pageInfo.domnModelId;
  state.pageInfo.prptyDataSttusMtcd = payload.pageInfo.prptyDataSttusMtcd;
  getPropertyList();
};

const getPropertyList = () => {
  $axios
    .get($apiUrls.meta.data.property.getPropertyList, {
      params: {
        curPage: state.pageInfo.curPage,
        prptyAmdStDt: state.pageInfo.searchAmdStDt,
        prptyAmdEnDt: state.pageInfo.searchAmdEdDt,
        searchName: state.pageInfo.searchName,
        domnModelId: state.pageInfo.domnModelId,
        prptyDataSttusMtcd: state.pageInfo.prptyDataSttusMtcd,
        sqlDateFormat: "YYYY-MM-DD",
      },
    })
    .then((res) => {
      state.propertyList = res.data.list;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const dataStatusCdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00002")
);

const getDomainModelList = () => {
  $axios
    .get($apiUrls.meta.data.model.getMetaDataModelList, {
      params: {
        searchMode: "domain",
        modelDataSttusMtcd: "use",
        isPaging: false,
      },
    })
    .then((res) => {
      state.domainModelList = res.data.list;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getMetaCodeGroupList = async () => {
  await store.dispatch("MetaStore/getAllMetaCodeGroupList", {
    axios: $axios,
    apiUrls: $apiUrls,
  });
};
const metaCodeGroupList = computed(
  () => store.getters["MetaStore/getSotreAllMetaCodeGroupList"]
);

const editPropertyInfo = () => {
  getPropertyList();
  dialogVisibleEdit.value = false;
};

const cancelDialog = () => {
  dialogVisibleEdit.value = false;
};
</script>
<style lang="scss"></style>