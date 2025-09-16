<template>
<!-- DataType 모델 검색 -->
  <div class="cntSec">
    <DataTypeModelSearchForm
      :dataStatusCdList="dataStatusCdList"
      @searchDataTypeModelList="searchDataTypeModelList"
    />

    <div class="btnSec taR mt10">
      <el-button type="primary" size="large"
        v-if="isWriteYn(route.meta.auth)"
        @click="dialogVisibleEdit = true"
        >등록</el-button
      >
    </div>
    <el-dialog v-model="dialogVisibleEdit" title="DataType 모델 등록">
      <DataTypeModelDialogEdit
        :dataStatusCdList="dataStatusCdList"
        :dataTypeCdList="dataTypeCdList"
        :metaCodeGroupList="metaCodeGroupList"
        :useLangCdList="useLangCdList"
        @cancelDialog="cancelDialog"
        @editDataTypeInfo="editDataTypeInfo"
      />
    </el-dialog>

    <div class="boxLayout">
      <div class="boxTit">
        <h3>DataType 모델 목록</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <DataTypeModelList
            :dataTypeModelList="state.dataTypeModelList"
            :totalPage="state.pageInfo.totalListSize"
            :curPage="state.pageInfo.curPage"
            :dataStatusCdList="dataStatusCdList"
            :dataTypeCdList="dataTypeCdList"
            :metaCodeGroupList="metaCodeGroupList"
            :useLangCdList="useLangCdList"
            @pageMove="pageMove"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import DataTypeModelList from "@/components/meta/datamodel/DataTypeModelList.vue";
import DataTypeModelDialogEdit from "@/components/meta/datamodel/DataTypeModelDialogEdit.vue";
import DataTypeModelSearchForm from "@/components/meta/datamodel/DataTypeModelSearchForm.vue";
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";

import { getGlobalProperties, isWriteYn } from "@/assets/js/common.js";
import { ref, reactive, onMounted, getCurrentInstance, computed } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";

const store = useStore();
const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
  getCurrentInstance().appContext.config.globalProperties.$emitter;
const dialogVisibleEdit = ref(false);

onMounted(() => {
  getCodeList();
  getMetaCodeGroupList();
  getDataTypeModelList();
  $emitter.on("initDataTypeModelList", getDataTypeModelList);
});

const getMetaCodeGroupList = async () => {
  await store.dispatch("MetaStore/getAllMetaCodeGroupList", {
    axios: $axios,
    apiUrls: $apiUrls,
  });
};
const metaCodeGroupList = computed(
  () => store.getters["MetaStore/getStoreAllMetaCodeGroupList"]
); //no parameter

const getCodeList = async () => {
  await store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00002", "MCG00006", "MCG00007"],
    },
  });
};
const dataStatusCdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00002")
);
const useLangCdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00006")
);
const dataTypeCdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00007")
);

const state = reactive({
  dataTypeModelList: [],
  pageInfo: {
    searchAmdStDt: "",
    searchAmdEdDt: "",
    searchMode: "dataType",
    searchName: "",
    modelDataSttusMtcd: "",
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
  },
});

const searchDataTypeModelList = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.searchAmdStDt = payload.pageInfo.searchAmdStDt;
  state.pageInfo.searchAmdEdDt = payload.pageInfo.searchAmdEdDt;
  state.pageInfo.searchMode = payload.pageInfo.searchMode;
  state.pageInfo.searchName = payload.pageInfo.searchName;
  state.pageInfo.modelDataSttusMtcd = payload.pageInfo.modelDataSttusMtcd;
  getDataTypeModelList();
};
const getDataTypeModelList = () => {
  $axios
    .get($apiUrls.meta.data.datatype.getDataTypeModelList, {
      params: {
        curPage: state.pageInfo.curPage,
        searchAmdStDt: state.pageInfo.searchAmdStDt,
        searchAmdEdDt: state.pageInfo.searchAmdEdDt,
        searchMode: state.pageInfo.searchMode,
        searchName: state.pageInfo.searchName,
        modelDataSttusMtcd: state.pageInfo.modelDataSttusMtcd,
        sqlDateFormat: "YYYY-MM-DD",
      },
    })
    .then((res) => {
      res.data.list.forEach((data) => {
        if (data.mtcdGrpIdNm != null)
          data.mtcdGrpIdNm = "[" + data.mtcdGrpId + "] " + data.mtcdGrpIdNm;
      });
      state.dataTypeModelList = res.data.list;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getDataTypeModelList();
};

const editDataTypeInfo = () => {
  getDataTypeModelList();
  dialogVisibleEdit.value = false;
};

const cancelDialog = () => {
  dialogVisibleEdit.value = false;
};
</script>
<style lang="scss"></style>
