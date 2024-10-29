<template>
  <div class="dialog-area">
    <MetaDataModelSearchForm
      :searchMode="searchMode"
      :searchSttusCd="searchSttusCd"
      :dataStatusCdList="dataStatusCdList"
      :typeModelId="typeModelId"
      @searchMetaDataModelList="searchMetaDataModelList"
    />

    <div class="boxLayout">
      <div class="boxTit">
        <h3>모델 검색 결과</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <MetaDataModelSearchList
            :metaDataModelList="state.metaDataModelList"
            :totalPage="state.pageInfo.totalListSize"
            :curPage="state.pageInfo.curPage"
            @selectedRow="selectedRow"
            @pageMove="pageMove"
          />
        </div>
      </div>
    </div>
  </div>


</template>
<script setup>
import MetaDataModelSearchList from "@/components/meta/datamodel/MetaDataModelSearchList.vue";
import MetaDataModelSearchForm from "@/components/meta/datamodel/MetaDataModelSearchForm.vue";

import { getGlobalProperties, isWriteYn } from "@/assets/js/common.js";
import {
  ref,
  toRefs,
  reactive,
  onMounted,
  getCurrentInstance,
  computed,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";

const store = useStore();
const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const title = ref("메타데이터 모델");
const emits = defineEmits(["selectedRow"]);
const props = defineProps({
  searchMode: {
    type: String,
    required: false,
  },
  searchSttusCd: {
    type: String,
    required: false,
  },
  typeModelId: {
    type: String,
    required: false,
  },
});

const state = reactive({
  metaDataModelList: [],
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
  },
});

const propsRefs = toRefs(props);
watch(
  [propsRefs.searchMode, propsRefs.searchSttusCd, propsRefs.typeModelId],
  () => {
    //console.log('changed...');
    onChangedProps();
  }
);

onMounted(() => {
  init();
});

const init = async () => {
  await store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00001"],
    },
  });
  onChangedProps();
};

const onChangedProps = () => {
  if (props.searchMode == "domain") {
    title.value = "도메인 모델";
  } else if (props.searchMode == "range") {
    title.value = "범위 모델";
  } else if (props.searchMode == "type") {
    title.value = "유형 모델";
  } else if (props.searchMode == "std") {
    title.value = "표준 모델";
  } else if (props.searchMode == "dataType") {
    title.value = "DataType 모델";
  } else if (props.searchMode == "objectType") {
    title.value = "ObjectType 모델";
  }
  state.pageInfo.curPage = 1;
  state.pageInfo.searchMode = props.searchMode;
  state.pageInfo.modelDataSttusMtcd = props.searchSttusCd;
  state.pageInfo.typeModelId = props.typeModelId;

  getMetaDataModelList();
};

const dataStatusCdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00001")
);

const searchMetaDataModelList = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.searchMode = payload.pageInfo.searchMode;
  state.pageInfo.searchName = payload.pageInfo.searchName;
  state.pageInfo.modelDataSttusMtcd = payload.pageInfo.modelDataSttusMtcd;
  state.pageInfo.typeModelId = payload.pageInfo.typeModelId;
  getMetaDataModelList();
};
const getMetaDataModelList = () => {
  $axios
    .get($apiUrls.meta.data.model.getMetaDataModelList, {
      params: {
        curPage: state.pageInfo.curPage,
        searchMode: state.pageInfo.searchMode,
        searchName: state.pageInfo.searchName,
        modelDataSttusMtcd: state.pageInfo.modelDataSttusMtcd,
        typeModelId:
          state.pageInfo.typeModelId != "" ? state.pageInfo.typeModelId : "",
      },
    })
    .then((res) => {
      state.metaDataModelList = res.data.list;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getMetaDataModelList();
};

const selectedRow = (payload) => {
  emits("selectedRow", payload);
};
</script>
<style lang="scss"></style>