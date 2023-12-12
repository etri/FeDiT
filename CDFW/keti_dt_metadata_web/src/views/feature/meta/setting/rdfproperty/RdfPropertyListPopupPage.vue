<template>
  <div class="dialog-area">
      <RdfPropertyPopupSearchForm
        :rdfFormMtcdList="rdfFormMtcdList"
        :rdfNmspList="rdfNamespaceList"
        :searchMode="searchMode"
        :searchTypeFix="searchTypeFix"
        :rdfInfo="rdfInfo"
        @searchRdfProperty="searchRdfProperty"
      />

      <div style="overflow-x: hidden; overflow-y: auto">
        <RdfPropertyPopupList
          :rdfPropertyList="state.rdfPropertyList"
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
  </div>
</template>
<script setup>
import RdfPropertyPopupSearchForm from "@/components/meta/rdfproperty/RdfPropertyPopupSearchForm.vue";
import RdfPropertyPopupList from "@/components/meta/rdfproperty/RdfPropertyPopupList.vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";

const router = useRouter();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const amdDtVisibleYn = ref(false);
const emits = defineEmits(["selectedRow"]);

const state = reactive({
  rdfPropertyList: [],
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
  getRdfPropertyList();
});

if(props.searchMode === "domain"){
  watch(() => props.rdfInfo.nodeDivId, () => {
    state.searchInfo.rdfClassId = props.rdfInfo.nodeDivId;
    getRdfPropertyList();
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

const searchRdfProperty = (payload) => {
  state.pageInfo = {
    curPage: 1,
  };
  state.searchInfo = payload;
};

const getRdfPropertyList = () => {
  if(typeof props.rdfInfo.rdfFormMtcd !== "undefined"){
    state.searchInfo.rdfFormMtcd = props.rdfInfo.rdfFormMtcd
  }
  state.searchInfo.searchMode = props.searchMode;
  if(props.searchMode === "all"){
  }
  if(props.searchMode === "domain"){
    state.searchInfo.rdfClassId = props.rdfInfo.nodeDivId;
  }

  let param = Object.assign({}, state.pageInfo, state.searchInfo);
  console.log(param);
  $axios
    .get($apiUrls.meta.rdf.property.getPropertyList, {
      params: param,
    })
    .then((res) => {
      state.pageInfo.totalListSize = res.data.page.totalListSize;
      state.rdfPropertyList = res.data.list;
    })
    .catch((err) => {
      console.log(err);
    });
};


const pageMove = (curPage) => {
  state.pageInfo.curPage = curPage;
  getRdfPropertyList();
};

const selectedRow = (payload) => {
  emits("selectedRow", payload);
};

</script>
<style lang="scss"></style>