<template>
  <div class="dialog-area">
    <RdfViewSearchForm
      :rdfFormMtcdList="rdfFormMtcdList"
      :rdfOutputVocaList="rdfOutputVocaList"
      :searchTypeFix="searchTypeFix"
      :searchParam="searchParam"
      :refreshKey="refreshKey"
      @searchRdfStr="searchRdfStr"
      @rdfFileDownload="rdfFileDownload"
    />
    <div class="mt20">
      <el-input type="textarea" v-model="state.rdfStr" readonly :autosize="{ minRows: 25, maxRows: 25 }"></el-input>
    </div>
  </div>
</template>
<script setup>
import RdfViewSearchForm from "@/components/meta/rdfmapping/RdfViewSearchForm.vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";

const router = useRouter();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const emits = defineEmits(["selectedRow"]);

const state = reactive({
  searchInfo: {},
  rdfStr: "",
});

const props = defineProps({
  searchTypeFix:{
    type: Boolean,
  },
  searchParam: {
    type: Object,
  },
  emptyPrptyShowYn: "",
  refreshKey: {
    type: Object,
  }
});

onMounted(() => {
  getMtcdList();
  rdfOutputVoca();
  getMetaCodeGroupList();
  state.rdfStr = "검색 조건을 선택 후 확인 버튼을 클릭해주세요.";
});

watch(() => props.refreshKey.nowDate, () => {
  state.rdfStr = "검색 조건을 선택 후 확인 버튼을 클릭해주세요.";
});
  
const getMtcdList = () =>
  store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00009"],
    },
});

const rdfOutputVoca = () =>
  store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00017"],
    },
});

const rdfFormMtcdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00009")
);

const rdfOutputVocaList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00017")
);

const getMetaCodeGroupList = () => {
  store.dispatch("MetaStore/getAllMetaCodeGroupList", {
    axios: $axios,
    apiUrls: $apiUrls,
  });
};

const searchRdfStr = (payload) => {
  state.searchInfo = payload;
  getRdfStr();
};

const getRdfStr = () => {
  let param = Object.assign({}, state.searchInfo);
  param.emptyPrptyShowYn = props.emptyPrptyShowYn;
  console.log(param);
  $axios
    .get(util.format($apiUrls.meta.data.model.getRdfStr, state.searchInfo.modelId), {
      params: param,
    })
    .then((res) => {
      state.rdfStr = res.data.rdfStr;
      state.rdfNull = false;
      state.crntWriteType = state.searchInfo.rdfWriteLangMtcd;
      state.crntMedataSetNm = state.searchInfo.medataSetNm;
    })
    .catch((err) => {
      console.log(err);
      if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
        alert(err.response.data.message);
      } else {
        alert("RDF 확인에 실패하였습니다.");
      }      
    });
};

const rdfFileDownload = (payload) => {
  state.searchInfo = payload;
  getRdfStrForFile();
}

const getRdfStrForFile = () => {
  let param = Object.assign({}, state.searchInfo);
  param.emptyPrptyShowYn = props.emptyPrptyShowYn;
  console.log(param);
  $axios
    .get(util.format($apiUrls.meta.data.model.getRdfStr, state.searchInfo.modelId), {
      params: param,
    })
    .then((res) => {
      const text = res.data.rdfStr;
      const writeType = state.searchInfo.rdfWriteLangMtcd;
      const filename = state.searchInfo.medataSetNm;
      const element = document.createElement("a");

      let extension = ".txt";
      let mediaType = "text/plain";

      if (writeType == "xml" || writeType == "xml_abbrev") {
        extension = ".rdf";
        mediaType = "application/rdf+xml";
      }
      if (writeType == "turtle" || writeType == "turtle_flat") {
        extension = ".ttl";
        mediaType = "text/turtle";
      }
      if (writeType == "n_triple") {
        extension = ".nt";
        mediaType = "application/n-triples";
      }
      if (writeType == "n3") {
        extension = ".n3";
        mediaType = "text/n3";
      }
      if (writeType == "json_ld") {
        extension = ".jsonld";
        mediaType = "application/ld+json";
      }
      if (writeType == "json") {
        extension = ".json";
        mediaType = "application/json";
      }

      element.setAttribute("href", "data:" + mediaType + ";charset=utf-8, " + encodeURIComponent(text));
      element.setAttribute("download", filename + extension);
      document.body.appendChild(element);
      element.click();
    })
    .catch((err) => {
      console.log(err);
      if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
        alert(err.response.data.message);
      } else {
        alert("파일 다운로드에 실패하였습니다.");
      }      
    });
};

</script>
<style lang="scss"></style>