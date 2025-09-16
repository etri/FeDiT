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
              <el-input v-model="props.rdfInfo.rdfMappgId" disabled></el-input>  
            </el-form-item>
      
            <el-form-item label="RDF 매핑 형식" required>
              <el-select v-model="props.rdfInfo.rdfFormMtcd" placeholder="선택" disabled>
                <el-option
                  v-for="item in rdfFormMtcdList"
                  :key="item.mtcdNm"
                  :label="item.mtcdNm"
                  :value="item.mtcd"
                />
              </el-select>  
            </el-form-item>
      
            <el-form-item label="메타데이터 유형" required>
              <el-select v-model="props.rdfInfo.typeModelId" placeholder="선택" disabled>
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

            <el-form-item label="등록정보">
              <el-input v-model="state.regrInfo" maxlength="100" disabled></el-input>
            </el-form-item>

            <el-form-item label="수정정보">
              <el-input v-model="state.amdrInfo" maxlength="100" disabled></el-input>
            </el-form-item>
          </el-scrollbar>
        </el-form>
      </div>    
    </div>

    <div class="btnSec taR mt20">
      <el-button type="default" @click="cancelPopup">취소</el-button>
      <el-button type="primary" plain v-if="isDelYn(route.meta.auth)" @click="DeleteRdfMapping()">삭제</el-button>
      <el-button type="primary" v-if="isAmdYn(route.meta.auth)" @click="ModifyRdfMapping()">저장</el-button>
    </div>    
  </div>
</template>
<script setup>
import { reactive, defineExpose, onMounted, watch, ref } from "vue";
import { getGlobalProperties, isAmdYn, isDelYn, routerPush, getCookie } from "@/assets/js/common.js";
import { useRouter, useRoute } from "vue-router";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const router = useRouter();
const route = useRoute();

const typeModelList = ref([]);
const rdfFormMtcdList = ref([]);

const emits = defineEmits([
  "cancelPopup"
]);

const state = reactive({
  rdfMappgId: "",
  rdfFormMtcd: "",
  typeModelId: "",
  rdfMappgNm : "",
});
 
const props = defineProps({
  rdfInfo: {
    type: Object,
    required: true,
  },
  refreshKey: {
    type: Object,
  }
});

defineExpose({
  data: state,
})

onMounted(() => {
  getTypeModelList();
  getRdfFormMtcdList();
  state.rdfMappgNm = props.rdfInfo.rdfMappgNm;
  state.regrInfo = props.rdfInfo.rdfMappgRegrId + " / " + props.rdfInfo.rdfMappgRegDt;
  state.amdrInfo = props.rdfInfo.rdfMappgAmdrId + " / " + props.rdfInfo.rdfMappgAmdDt;
});

watch(() => props.refreshKey.nowDate, () => {
  state.rdfMappgNm = props.rdfInfo.rdfMappgNm;
  state.regrInfo = props.rdfInfo.rdfMappgRegrId + " / " + props.rdfInfo.rdfMappgRegDt;
  state.amdrInfo = props.rdfInfo.rdfMappgAmdrId + " / " + props.rdfInfo.rdfMappgAmdDt;
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

const ModifyRdfMapping = () => {

  if(state.rdfMappgNm === null || state.rdfMappgNm === ""){
    alert("RDF 매핑 명을 입력해주세요.");
    return;
  }

  if (!confirm("수정하시겠습니까?")) return;

  const rdfMappinginfo = {
    rdfMappgId: props.rdfInfo.rdfMappgId,
    rdfMappgNm: state.rdfMappgNm,
    rdfFormMtcd: props.rdfInfo.rdfFormMtcd,
    typeModelId: props.rdfInfo.typeModelId
  };
  
  $axios
  .put(util.format($apiUrls.meta.rdf.mapping.modifyMapping, props.rdfInfo.rdfMappgId), rdfMappinginfo)
  .then(() => {
    alert("저장되었습니다.");
    router.go(0);
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

const DeleteRdfMapping = () => {

  if (!confirm("삭제하시겠습니까?")) return;

  $axios
  .delete(util.format($apiUrls.meta.rdf.mapping.deleteMapping, props.rdfInfo.rdfMappgId))
  .then(() => {
    alert("삭제되었습니다.");

    let platform = getCookie("pltfrmId");
    let query = { rdfMappgId: props.rdfInfo.rdfMappgId, };

    routerPush(platform, "RefMappingListPage", query);
  })
  .catch((err) => {
    console.log(err);
    if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
      alert(err.response.data.message);
    } else {
      alert("삭제에 실패하였습니다.");
    }
  });

};

const cancelPopup = () => {
  emits("cancelPopup");
}

</script>
<style lang="scss">

</style>
