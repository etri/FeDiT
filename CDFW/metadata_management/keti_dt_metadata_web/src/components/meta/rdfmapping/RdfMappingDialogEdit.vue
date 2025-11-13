<template>
  <div class="dialog-area">
    <div class="boxLayout"> 
      <div class="boxTit">
        <h3>RDF 매핑 등록</h3>
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
            <el-form-item label="RDF 매핑 ID" required>
              <el-input placeholder="(자동 생성)" disabled></el-input>  
            </el-form-item>
      
            <el-form-item label="RDF 매핑 형식" required>
              <el-select v-model="state.rdfFormMtcd" placeholder="선택">
                <el-option
                  v-for="item in rdfFormMtcdList"
                  :key="item.mtcdNm"
                  :label="item.mtcdNm"
                  :value="item.mtcd"
                />
              </el-select>  
            </el-form-item>
      
            <el-form-item label="메타데이터 유형" required>
              <el-select v-model="state.typeModelId" placeholder="선택">
                <el-option 
                  v-for="item in typeModelList" 
                  :key="item.modelId"
                  :label="`${item.modelNm} ${item.modelLogicNm}`" 
                  :value="item.modelId" 
                />
                </el-select>   
            </el-form-item>
      
            <el-form-item label="RDF 매핑 명" required>
              <el-input v-model="state.rdfMappgNm" maxlength="100"></el-input>  
            </el-form-item>
          </el-scrollbar>
        </el-form>
      </div>
    </div>

    <div class="btnSec taR mt20">
      <el-button type="default" @click="cancelPopup">취소</el-button>
      <el-button type="primary" v-if="isWriteYn(route.meta.auth)" @click="EditRdfMapping()">저장</el-button>
    </div>
  </div>
</template>
<script setup>
import { reactive, defineExpose, onMounted, watch, ref } from "vue";
import { getGlobalProperties, isWriteYn, routerPush, getCookie } from "@/assets/js/common.js";
import { useRouter, useRoute } from "vue-router";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const router = useRouter();
const route = useRoute();

const typeModelList = ref([]);
const rdfFormMtcdList = ref([]);

const emits = defineEmits([
  "EditRdfMapping",
  "cancelPopup"
]);

const state = reactive({
  rdfFormMtcd: "",
  typeModelId: "",
  rdfMappgNm : "",
});
 
const props = defineProps({
  rdfInfo: {
    type: Object,
    required: true,
  }
});

defineExpose({
  data: state,
})

onMounted(() => {
  getTypeModelList();
  getRdfFormMtcdList();
  state.rdfFormMtcd = props.rdfInfo.mtcd;
  state.typeModelId = props.rdfInfo.modelId;
  state.rdfMappgNm = "";
});

watch(() => props.rdfInfo, () => {
  state.rdfFormMtcd = props.rdfInfo.mtcd;
  state.typeModelId = props.rdfInfo.modelId;
  state.rdfMappgNm = "";
})

const getTypeModelList = () => {
	$axios
		.get($apiUrls.meta.data.type.getTypeModelList, {
			params: {
				isPaging: false,
				searchMode: "type",
				modelDataSttusMtcd: "use"
			},
		})
		.then((res) => {
			typeModelList.value = res.data.list;
		})
		.catch((err) => {  
			console.log(err);
		});
};

const getRdfFormMtcdList = () => {
  $axios
		.get(util.format($apiUrls.meta.portal.code.getCodeList, "MCG00009"), {
			params: {
				isPaging: false,
        mtcdUseYn: "Y"
			},
		})
		.then((res) => {
			rdfFormMtcdList.value = res.data.list;
		})
		.catch((err) => {
			console.log(err);
		});
};

const EditRdfMapping = () => {

  if(state.rdfFormMtcd === null || state.rdfFormMtcd === ""){
    alert("RDF 매핑 형식을 선택해주세요.");
    return;
  }
  if(state.typeModelId === null || state.typeModelId === ""){
    alert("메타데이터 유형을 선택해주세요.");
    return;
  }
  if(state.rdfMappgNm === null || state.rdfMappgNm === ""){
    alert("RDF 매핑 명을 입력해주세요.");
    return;
  }

  if (!confirm("저장하시겠습니까?")) return;

  const rdfMappinginfo = {
    rdfFormMtcd: state.rdfFormMtcd,
    typeModelId: state.typeModelId,
    rdfMappgNm: state.rdfMappgNm,
  };
  
  $axios
  .post($apiUrls.meta.rdf.mapping.createMapping, rdfMappinginfo)
  .then((res) => {
    alert("저장되었습니다.");
    
    let platform = getCookie("pltfrmId");
    let query = { rdfMappgId: res.data.id };
    
    routerPush(platform, "RefMappingDetailPage", query);
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
