<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>RDF 확인</h3>
      <div class="btnSec taR">
        <el-button type="primary" plain @click="rdfFileDownload()">
          RDF 파일 다운로드
          <el-icon :size="14" style="margin-left: 5px;">
            <Download />
          </el-icon>
        </el-button>
        <el-button type="primary" @click="getRdfStr()">확인</el-button>
      </div>      
    </div>
    <div class="boxCnt">
      <el-form label-position="left"
        :model="searchInfo"
        :inline="true"
        class="demo-form-inline search-form"
        label-width="130px"
      >
        <el-row :gutter="0">
          <el-col :span="12">
            <el-form-item label="메타데이터 모델 명">
              <div class="inline-area">
                <el-input
                  class=""
                  v-model="searchParam.modelNm"
                  disabled
                />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="RDF 매핑 형식">
              <el-select v-model="searchInfo.rdfFormMtcd" placeholder="선택">
                <el-option
                  v-for="item in rdfFormMtcdList"
                  :key="item.mtcd"
                  :label="item.mtcdNm"
                  :value="item.mtcd"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="0">
          <el-col :span="12">
            <el-form-item label="메타데이터 셋">
              <div class="inline-area">
                <el-input class="w-100 m-2" v-model="searchInfo.medataSetNm" disabled />
                <el-button type="default" v-show="searchInfo.medataSetEnabled" class="ml15" @click="dialogVisibleSearchMetadataSet = true"><el-icon class="icon icon-search"/></el-button>
                <el-button type="default" class="el-button--delete" v-show="searchInfo.medataSetEnabled" @click="refreshMedataSet"><el-icon class="icon icon-refresh"/></el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="RDF 출력 형식">
              <el-select v-model="searchInfo.rdfWriteLangMtcd" placeholder="선택">
                <el-option
                  v-for="item in rdfOutputVocaList"
                  :key="item.mtcd"
                  :label="item.mtcdNm"
                  :value="item.mtcd"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-dialog v-model="dialogVisibleSearchMetadataSet" title="메타데이터 셋 검색">
      <MetadataSetDialogSearch :searchMode="searchInfo.searchModeForDt"           searchSttusCd=""
                                :searchMetaTypeFix="searchMetaTypeFix"  :searchMetaTypeId="searchMetaTypeId"
                                :typeModelId="searchParam.typeModelId"      :typeModelNm="searchParam.typeModelNm"
                                :modelId="searchParam.modelId"          :modelNm="searchParam.modelNm"
        @selectedRow="selectedMetaDataSet" />
    </el-dialog>

  </div>
</template>
<script setup>
import {
  reactive,
  ref,
  defineProps,
  defineEmits,
  defineExpose,
  watch,
  computed,
  onMounted,
} from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";
import MetadataSetDialogSearch from "@/components/meta/dt/MetadataSetDialogSearch.vue";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const emits = defineEmits(["searchRdfStr", "rdfFileDownload"]);


const dialogVisibleSearchMetadataSet = ref(false);
const searchMetaTypeFix = true;
const searchMetaTypeId = ref("");

const searchInfo = ref({
  modelId: "",
  rdfFormMtcd: "",
  rdfWriteLangMtcd: "",
  medataSetId: "",
  medataSetNm: "",
  medataSetEnabled: true,
  searchModeForDt: "type",
});

const props = defineProps({
  searchParam: {
    type: Object,
    required: false,
  },
  rdfFormMtcdList: {
    type: Array,
    required: false,
  },
  rdfOutputVocaList: {
    type: Array,
    required: false,
  },
  refreshKey: {
    type: Object,
  },
});

onMounted(() => {
  init();
});

watch(() => props.refreshKey.nowDate, () => {
  init();
});

watch(() => props.searchParam.modelId, () => {
  init();
});

const init = () => {
  searchInfo.value.rdfWriteLangMtcd = "";
  searchInfo.value.modelId = props.searchParam.modelId;
  searchMetaTypeId.value = props.searchParam.typeModelId;

  if (props.searchParam.typeModelId === props.searchParam.modelId) {
    searchInfo.value.searchModeForDt = "type";
  } else {
    searchInfo.value.searchModeForDt = "model";
  }

  if (props.searchParam.medataSetId) {
    searchInfo.value.medataSetId = props.searchParam.medataSetId;
    searchInfo.value.medataSetNm = props.searchParam.medataSetNm;
    searchInfo.value.medataSetEnabled = false;
  } else {
    searchInfo.value.medataSetId = "";
    searchInfo.value.medataSetNm = "";
    searchInfo.value.medataSetEnabled = true;
  }

  if (props.searchParam.rdfFormMtcd) {
    searchInfo.value.rdfFormMtcd = props.searchParam.rdfFormMtcd;
  } else {
    searchInfo.value.rdfFormMtcd = "";
    if (props.rdfFormMtcdList && props.rdfFormMtcdList.length == 1) {
      searchInfo.value.rdfFormMtcd = props.rdfFormMtcdList[0].mtcd;
    }
  }
}

const selectedMetaDataSet = (payload) => {
	let { medataSetId, medataSetNm } = payload.rowData;
	searchInfo.value.medataSetId = medataSetId;
  searchInfo.value.medataSetNm = medataSetNm;
	dialogVisibleSearchMetadataSet.value = false;
};

const refreshMedataSet = () => {
  searchInfo.value.medataSetId = "";
  searchInfo.value.medataSetNm = "";
}

const getRdfStr = () => {

  if(searchInfo.value.modelId === ""){
    alert("메타데이터 모델 정보가 없습니다.");
    return;
  }
  if(searchInfo.value.rdfFormMtcd === ""){
    alert("RDF 매핑 형식을 선택해주세요.");
    return;
  }
  if(searchInfo.value.rdfWriteLangMtcd === ""){
    alert("RDF 출력 형식을 선택해주세요.");
    return;
  }

  emits("searchRdfStr", searchInfo.value);
};

const rdfFileDownload = () => {
  
  if(searchInfo.value.modelId === ""){
    alert("메타데이터 모델 정보가 없습니다.");
    return;
  }
  if(searchInfo.value.rdfFormMtcd === ""){
    alert("RDF 매핑 형식을 선택해주세요.");
    return;
  }
  if(searchInfo.value.rdfWriteLangMtcd === ""){
    alert("RDF 출력 형식을 선택해주세요.");
    return;
  }

  emits("rdfFileDownload", searchInfo.value);
};

</script>
<style lang="scss"></style>