<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="dataTypeModelList"
    >
			<template v-slot:btn="slotData" v-if="isAmdYn(route.meta.auth)">
        <el-button type="primary" size="small" @click="goToDetailDialog(slotData)">수정</el-button>
      </template>
      <template v-slot:btn="slotData" v-else-if="!isAmdYn(route.meta.auth) && isReadYn(route.meta.auth)">
        <el-button type="default" size="small" @click="goToDetailDialog(slotData)">조회</el-button>
      </template>
    </comn-list>
		<el-dialog v-model="dialogVisibleModify" v-bind:title="curTitle">
      <DataTypeModelDialogModify
				:dataTypeModel="state.dataTypeModel"
				:curPage="curPage"
        :curTitle="curTitle"
				:dataTypeModelList="dataTypeModelList"
				:dataStatusCdList="dataStatusCdList"
				:metaCodeGroupList="metaCodeGroupList"
				:useLangCdList="useLangCdList"
				:dataTypeCdList="dataTypeCdList"
 				@cancelModifyDialog="cancelModifyDialog"
        @modifyDataTypeModel="modifyDataTypeModel"
        @deleteDataTypeModel="deleteDataTypeModel"
      />
    </el-dialog>
    <ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
  </div>   
</template>

<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import DataTypeModelDialogModify from "@/components/meta/datamodel/DataTypeModelDialogModify.vue";

import { ref, reactive, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { 
  getGlobalProperties,
  isAmdYn, 
  isReadYn 
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const curPage = ref("");
const curTitle = ref("");
const dialogVisibleModify = ref(false);
const $emitter = getCurrentInstance().appContext.config.globalProperties.$emitter;

const emits = defineEmits(["pageMove"]);
const props = defineProps({
	dataTypeModelList: {
		type: Array,
		required: true,
	},
	dataStatusCdList: {
		type: Array,
		required: true,
	},
	metaCodeGroupList: {
		type: Array,
		required: true,
	},
	useLangCdList: {
		type: Array,
		required: false
	},
	dataTypeCdList: {
		type: Array,
		required: false
	},
	totalPage: {
		type: Number,
		required: true,
	},
  curPage: {
    type: Number,
    required: true,
  },
});

const state = reactive({
	dataTypeModelList: [],
	dataTypeModel:{},
	pageInfo: {
			curPage: 1,
			totalListSize: 0,
			pageListSize: 10,
			blockSize: 5,    
	}
});

const tableHeader = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 40,
    align: "center"
  },
  {
    prop: "modelNm",
    label: "모델 명",
    width: 120,
  },
  {
    prop: "modelLogicNm",
    label: "모델 논리명",
    width: 120,
  },
  {
    prop: "dataTypeMtcd",
    label: "데이터 유형 매핑",
    width: 120,
  },
  {
    prop: "useLangMtcdNm",
    label: "사용 언어",
    width: 70,
  },
  {
    prop: "mtcdGrpIdNm",
    label: "코드 그룹 ID",
    width: 120,
  },
  {
    prop: "modelDataSttusMtcdNm",
    label: "상태",
    width: 70,
  },
  {
    prop: "modelAmdDt",
    label: "수정일",
    width: 80,
  },
	{
    prop: "btn",
    label: "",
    width: 50,
    columnType: "custom",
  }
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const goToDetailDialog = (node) => {
	if (isReadYn(route.meta.auth)) {
		$axios
			.get(util.format($apiUrls.meta.data.model.getModel, node.row.modelId))
			.then((res)=> {
				state.dataTypeModel.index = node.$index;
				state.dataTypeModel.modelId = node.row.modelId;
				state.dataTypeModel.modelNm = res.data.modelNm;
				state.dataTypeModel.modelLogicNm = res.data.modelLogicNm;
				state.dataTypeModel.modelDesc = res.data.modelDesc;
				state.dataTypeModel.modelDataSttusMtcd = res.data.modelDataSttusMtcd;
				state.dataTypeModel.modelSortOdrg = res.data.modelSortOdrg;
				state.dataTypeModel.dataTypeMtcd = res.data.dataTypeMtcd;
				state.dataTypeModel.dataTypeValExam = res.data.dataTypeValExam;
				state.dataTypeModel.mtcdGrpId = res.data.mtcdGrpId;
				state.dataTypeModel.useLangMtcd = res.data.useLangMtcd;
				state.dataTypeModel.regrInfo = res.data.modelRegrId + " / " + res.data.modelRegDt;
				state.dataTypeModel.amdrInfo = res.data.modelAmdrId + " / " + res.data.modelAmdDt;
			})
			.catch((err)=>{
				console.log(err);
			});

			if (isAmdYn(route.meta.auth)) {
				curPage.value = "modify";
				curTitle.value = "DataType 모델 편집"      
				} else {
				curPage.value = "detail";
				curTitle.value = "DataType 모델 상세조회";
			}
			dialogVisibleModify.value = true;

	} else {
    dialogVisibleModify.value = false;
    alert("읽기 권한이 없습니다.");
  }
};

const cancelModifyDialog = () => {
  dialogVisibleModify.value = false;
};
const modifyDataTypeModel = async (payload) => {
	let ruleForm = payload.ruleFormRef.value;
	if (!ruleForm) return;

	await ruleForm.validate((valid, fields) => {		
		if (valid) {
			let result = confirm("수정 하시겠습니까?");
			if (result) {
				let dataTypeModel = {
					...payload.data
				};
				$axios
					.put(util.format($apiUrls.meta.data.datatype.modifyDataTypeModel, props.dataTypeModelList[state.dataTypeModel.index].modelId), dataTypeModel)
					.then(() => {
						alert("수정이 완료되었습니다.");
						dialogVisibleModify.value = false;
						$emitter.emit("initDataTypeModelList");
					})
					.catch((err) => {
						console.log(err);
						if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
							alert(err.response.data.message);
						} else {
							alert("DataType 모델 수정에 실패하였습니다.");
						}						
					});
			}
		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
};

const deleteDataTypeModel = (payload) => {
	// 2023-06-30 모델 삭제 로직 변경.let result = confirm("삭제하시겠습니까?\n삭제가 불가능한 경우 폐기 상태로 처리됩니다.");
	let result = confirm("삭제하시겠습니까?");
	if (result) {
		$axios.
			delete(util.format($apiUrls.meta.data.datatype.deleteDataTypeModel, payload.data))
			.then(() => {
				alert("삭제 완료하였습니다.");
				dialogVisibleModify.value = false;
				$emitter.emit("initDataTypeModelList");
			})
			.catch((err) => {
				console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("DataType 모델 삭제에 실패하였습니다.");
				}
			});
	}
};


</script>
<style lang="scss"></style>