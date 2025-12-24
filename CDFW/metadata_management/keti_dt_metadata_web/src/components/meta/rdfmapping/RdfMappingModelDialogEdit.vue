<template>
  <div class="dialog-area"> 
    <div class="boxLayout"> 
      <div class="boxTit">
        <h3>RDF 매핑 모델 등록</h3>
      </div>
      <div class="boxCnt">
        <el-form label-position="right"
          :model="state.device"
          :rules="state.rules"
          ref="ruleForm"
          label-width="200px"
          class="demo-ruleForm"
          onsubmit="return false;"
          style="overflow: overlay;"
        >
          <el-scrollbar style="height: 100%;">
            <el-form-item label="RDF 매핑 모델 ID" required>
              <el-input placeholder="(자동 생성)" disabled></el-input>  
            </el-form-item>
      
            <el-form-item label="조건 순서" required>
              <el-input type="number" v-model="state.rdfCondOdrg" maxlength="5"></el-input>  
            </el-form-item>

            <el-form-item label="RDF 클래스" required>
              <div class="inline-area">
                <el-input style="width: 250px;" v-model="state.rdfClass" disabled	/>
                <el-input style="width: 250px; margin-left: 5px;" v-model="state.rdfClassLgcNm" disabled	/>
                <el-button type="default" class="ml15" @click="dialogVisibleClassSearch = true"><el-icon class="icon icon-search"/></el-button>
                <el-button type="default" class="el-button--delete" @click="refreshRdfClass"><el-icon class="icon icon-refresh"/></el-button>
              </div>
              <el-dialog v-model="dialogVisibleClassSearch" title="RDF 클래스 검색">
                <RdfClassListPopupPage
                  :searchMode="classSearchMode"
                  :searchTypeFix="searchTypeFix"
                  :rdfInfo="rdfInfo"
                  @selectedRow="selectedRangeClass"
                /> 
              </el-dialog>												
            </el-form-item>

            <el-form-item label="대표 모델 여부" required>
              <el-select v-model="state.rdfRepModelYn">
                <el-option value="Y" label="Y"></el-option>
                <el-option value="N" label="N"></el-option>
              </el-select> 
            </el-form-item>

            <el-form-item v-if="state.rdfRepModelYn === 'Y'" label="조건 메타데이터 모델">
              <div class="inline-area">
                <el-input style="width: 250px;" v-model="state.condModelId" disabled	/>
                <el-input style="width: 250px; margin-left: 5px;" v-model="state.condModelNm" disabled	/>
                <el-button type="default" class="ml15" @click="dialogVisibleModelSearch = true"><el-icon class="icon icon-search"/></el-button>
                <el-button type="default" class="el-button--delete" @click="refreshRangeModel"><el-icon class="icon icon-refresh"/></el-button>
              </div>
              <el-dialog v-model="dialogVisibleModelSearch" title="조건 메타데이터 모델 검색">
                <MetaDataModelSearchPage
                  :searchSttusCd="searchSttusCd"
                  :searchMode="searchMode"
                  :typeModelId="searchTypeModelId"
                  @selectedRow="selectedRangeModel"
                /> 
              </el-dialog>												
            </el-form-item>

            <el-form-item v-if="state.rdfRepModelYn === 'N'" label="조건 메타데이터 모델" required>
              <div class="inline-area">
                <el-input style="width: 250px;" v-model="state.condModelId" disabled	/>
                <el-input style="width: 250px; margin-left: 5px;" v-model="state.condModelNm" disabled	/>
                <el-button type="default" class="ml15" @click="dialogVisibleModelSearch = true"><el-icon class="icon icon-search"/></el-button>
                <el-button type="default" class="el-button--delete" @click="refreshRangeModel"><el-icon class="icon icon-refresh"/></el-button>
              </div>
              <el-dialog v-model="dialogVisibleModelSearch" title="조건 메타데이터 모델 검색">
                <MetaDataModelSearchPage
                  :searchSttusCd="searchSttusCd"
                  :searchMode="searchMode"
                  :typeModelId="searchTypeModelId"
                  @selectedRow="selectedRangeModel"
                /> 
              </el-dialog>												
            </el-form-item>
          </el-scrollbar>
        </el-form>
      </div>
    </div>

    <div class="btnSec taR mt20">
      <el-button type="default" @click="cancelPopup">취소</el-button>
      <el-button type="primary" v-if="isWriteYn(route.meta.auth)" @click="EditRdfMappingModel()">저장</el-button>
    </div>
  </div>
</template>
<script setup>
import { reactive, defineExpose, onMounted, watch, ref } from "vue";
import { getGlobalProperties, isWriteYn } from "@/assets/js/common.js";
import { useRouter, useRoute } from "vue-router";
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";
import RdfClassListPopupPage from "@/views/feature/meta/setting/rdfclass/RdfClassListPopupPage.vue";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const router = useRouter();
const route = useRoute();

const dialogVisibleModelSearch = ref(false);
const dialogVisibleClassSearch = ref(false);

const emits = defineEmits([
  "getRdfMappingModelList",
  "cancelPopup"
]);

const state = reactive({
  rdfCondOdrg: 1,
  rdfClassId: "",
  rdfClassNm: "",
  rdfClass: "",
  rdfClassLgcNm: "",
  rdfRepModelYn: "N",
  condModelId: "",
  condModelNm: "",
});
 
const props = defineProps({
  rdfInfo: {
    type: Object,
  },
  rdfMappingModelList: {
    type: Array,
  },
  refreshKey: {
    type: Object,
  },
});

defineExpose({
  data: state,
})

onMounted(() => {
  state.rdfCondOdrg = 1;
  state.rdfClassId = "";
  state.rdfClassNm = "";
  state.rdfClass = "";
  state.rdfClassLgcNm = "";
  state.rdfRepModelYn = "N";
  state.condModelId = "";
  state.condModelNm = "";
  for(var i=0; i<props.rdfMappingModelList.length; i++) {
    if(state.rdfCondOdrg <= parseInt(props.rdfMappingModelList[i].rdfCondOdrg)){
      state.rdfCondOdrg = parseInt(props.rdfMappingModelList[i].rdfCondOdrg) + 1;
    }
  }
});

watch(() => props.refreshKey.nowDate, () => {
  state.rdfCondOdrg = 1;
  state.rdfClassId = "";
  state.rdfClassNm = "";
  state.rdfClass = "";
  state.rdfClassLgcNm = "";
  state.rdfRepModelYn = "N";
  state.condModelId = "";
  state.condModelNm = "";
  for(var i=0; i<props.rdfMappingModelList.length; i++) {
    if(state.rdfCondOdrg <= parseInt(props.rdfMappingModelList[i].rdfCondOdrg)){
      state.rdfCondOdrg = parseInt(props.rdfMappingModelList[i].rdfCondOdrg) + 1;
    }
  }
})

const searchSttusCd = "use";
const searchMode = "std";
const searchTypeModelId = props.rdfInfo.typeModelId;
const selectedRangeModel = (payload) => {
	state.condModelId = payload.rowData.modelId;
	state.condModelNm = payload.rowData.modelLogicNm;
	dialogVisibleModelSearch.value = false;
};

const refreshRangeModel = () => {
  state.condModelId = "";
	state.condModelNm = "";
};

const classSearchMode = "all";
const searchTypeFix = true;
const selectedRangeClass = (payload) => {
  state.rdfClassNm = payload.rowData.rdfClassNm;
  state.rdfClass = payload.rowData.rdfClass;
	state.rdfClassLgcNm = payload.rowData.rdfClassLogicNm;
  state.rdfClassId = payload.rowData.rdfClassId;
	dialogVisibleClassSearch.value = false;
};

const refreshRdfClass = () => {
  state.rdfClassNm = "";
  state.rdfClass = "";
  state.rdfClassLgcNm = "";
  state.rdfClassId = "";
};

const EditRdfMappingModel = () => {

  if(state.rdfCondOdrg === null || state.rdfCondOdrg === ""){
    alert("조건 순서를 입력해주세요.");
    return;
  }
  else{
    const parsedValue = parseInt(state.rdfCondOdrg, 10);
    if(state.rdfCondOdrg.length > 5){
      alert("조건 순서는 5자 이하만 가능합니다.");
      return;
    }
    if(isNaN(parsedValue) || parsedValue < 0 || parsedValue > 99999){
      alert("조건 순서는 0 ~ 99999 사이의 값만 입력할 수 있습니다.");
      return;
    }
  }
  if(state.rdfClassId === null || state.rdfClassId === ""){
    alert("RDF 클래스를 입력해주세요.");
    return;
  }
  if(state.rdfRepModelYn === null || state.rdfRepModelYn === ""){
    alert("대표 모델 여부를 선택해주세요.");
    return;
  }
  if(state.rdfRepModelYn === "Y"){
    for(var i=0; i<props.rdfMappingModelList.length; i++) {
      if(props.rdfMappingModelList[i].rdfRepModelYn === "Y") {
        alert("이미 대표 모델이 존재합니다.");
        return;
      }
    }
  }
  if(state.rdfRepModelYn === "N"){
    if(state.condModelId === null || state.condModelId === ""){
      alert("조건 메타데이터 모델을 입력해주세요.");
      return;
    }
    else{
      for(var i=0; i<props.rdfMappingModelList.length; i++) {
        if(props.rdfMappingModelList[i].condModelId === state.condModelId) {
          alert("이미 사용 중인 조건 메타데이터 모델입니다.");
          return;
        }
      }
    }
  }

  if (!confirm("저장하시겠습니까?")) return;

  const rdfMappingModelinfo = {
    rdfMappgId: props.rdfInfo.rdfMappgId,
    rdfCondOdrg: parseInt(state.rdfCondOdrg),
    rdfClassId: state.rdfClassId,
    rdfRepModelYn: state.rdfRepModelYn,
    condModelId: state.condModelId,
  };
  
  $axios
  .post($apiUrls.meta.rdf.mapping.createMappingModel, rdfMappingModelinfo)
  .then(() => {
    alert("저장되었습니다.");
    emits("getRdfMappingModelList");
  })
  .catch((err) => {
    console.log(err);
    if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
      alert(err.response.data.message);
    } else {
      alert("저장에 실패하였습니다.");
    }
  });


};

const cancelPopup = () => {
  emits("cancelPopup");
}

</script>
<style lang="scss">

</style>
