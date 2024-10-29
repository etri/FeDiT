<template>
  <div class="dialog-area">
    <!-- <div class="cntSec"> -->
      <RdfClassPopupSearchForm
        :rdfFormMtcdList="rdfFormMtcdList"
        :rdfNmspList="rdfNamespaceList"
        :searchMode="searchMode"
        :searchTypeFix="searchTypeFix"
        :rdfInfo="rdfInfo"
        @searchRdfClass="searchRdfClass"
      />

      <RdfClassPopupList
        :rdfClassList="state.rdfClassList"
        :totalPage="state.pageInfo.totalListSize"
        :curPage="state.pageInfo.curPage"
        :rdfFormMtcdList="rdfFormMtcdList"
        :rdfNmspList="rdfNamespaceList"
        :searchMode="searchMode"
        :searchTypeFix="searchTypeFix"
        :rdfInfo="rdfInfo"
        @selectedRow="selectedRow"
        @pageMove="pageMove"
      />
  </div>
</template>
<script setup>
import RdfClassPopupSearchForm from "@/components/meta/rdfclass/RdfClassPopupSearchForm.vue";
import RdfClassPopupList from "@/components/meta/rdfclass/RdfClassPopupList.vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";
import dayjs from "dayjs";

const router = useRouter();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const emits = defineEmits(["selectedRow"]);

const state = reactive({
  rdfClassList: [],
  searchInfo: {},
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  },
});

const props = defineProps({
  searchMode: {
    type: String,
    required: false
  },
  searchTypeFix:{
    type: Boolean,
  },
  rdfInfo: {
    type: Object,
  }
});

onMounted(() => {
  getCodeList();
  getMetaCodeGroupList();
  getRdfNamespaceList();
  getRdfClassList();
});

if(props.searchMode === "range"){
  watch(() => props.rdfInfo.nodeDivId, () => {
    state.searchInfo.rdfPrptyId = props.rdfInfo.nodeDivId;
    getRdfClassList();
  });
}
  
const getCodeList = () =>
  store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00009"],
    },
  });

const rdfFormMtcdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00009")
);

const getMetaCodeGroupList = () => {
  store.dispatch("MetaStore/getAllMetaCodeGroupList", {
    axios: $axios,
    apiUrls: $apiUrls,
  });
};

const rdfNamespaceList = ref([]);

const getRdfNamespaceList = () => {
  $axios
    .get($apiUrls.meta.rdf.namespace.getNamespaceList, {
      params: {
        isPaging: false,
      },
    })
    .then((res) => {
      rdfNamespaceList.value = res.data.list;
      makeRdfNamespaceLabel();
    })
    .catch((err) => {
      console.log(err);
    });
};

const makeRdfNamespaceLabel = () => {
  for (let rdfNamespace of rdfNamespaceList.value) {
    rdfNamespace.label =
      "[" + rdfNamespace.rdfNmspPfix + "] " + rdfNamespace.rdfNmspUri;
  }
};

const searchRdfClass = (payload) => {
  state.pageInfo = {
    curPage: 1,
  };
  state.searchInfo = payload;
};

const getRdfClassList = () => {
  if(props.rdfInfo != undefined && typeof props.rdfInfo.rdfFormMtcd !== "undefined"){
    state.searchInfo.rdfFormMtcd = props.rdfInfo.rdfFormMtcd
  }
  state.searchInfo.searchMode = props.searchMode;
  if(props.searchMode === "all"){
  }
  if(props.searchMode === "range"){
    state.searchInfo.rdfPrptyId = props.rdfInfo.nodeDivId;
  }
  let param = Object.assign({}, state.pageInfo, state.searchInfo);
  console.log(param);
  $axios
    .get($apiUrls.meta.rdf.class.getClassList, {
      params: param,
    })
    .then((res) => {
      state.pageInfo.totalListSize = res.data.page.totalListSize;
      state.rdfClassList = res.data.list.map((x, idx) => {
        x.rdfClassAmdDt = dayjs(x.rdfClassAmdDt).format("YYYY-MM-DD");
        x.rdfClassRegDt = dayjs(x.rdfClassRegDt).format("YYYY-MM-DD");
        return x;
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

const pageMove = (curPage) => {
  state.pageInfo.curPage = curPage;
  getRdfClassList();
};

const selectedRow = (payload) => {
  emits("selectedRow", payload);
};

</script>
<style lang="scss"></style>