<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="typeModelList"
    >
			<template v-slot:btn="slotData" v-if="isAmdYn(route.meta.auth)">
        <el-button type="primary" size="small" @click="goToDetailDialog(slotData)" >수정</el-button>
      </template>
      <template v-slot:btn="slotData" v-else-if="!isAmdYn(route.meta.auth) && isReadYn(route.meta.auth)">
        <el-button type="default" size="small" @click="goToDetailDialog(slotData)">조회</el-button>
      </template>
    </comn-list>
		<el-dialog v-model="dialogVisibleModify" v-bind:title="curTitle">
      <TypeModelDialogModify
				:typeModel="state.typeModel"
				:curPage="curPage"
        :curTitle="curTitle"
				:dataStatusCdList="dataStatusCdList"
				:structdModelSchmaList="structdModelSchmaList"
 				@cancelModifyDialog="cancelModifyDialog"
        @modifyTypeModel="modifyTypeModel"
        @deleteTypeModel="deleteTypeModel"
      />
    </el-dialog>
    <ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
  </div>   
</template>

<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import TypeModelDialogModify from "@/components/meta/datamodel/TypeModelDialogModify.vue";

import { ref, reactive, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getGlobalProperties, isAmdYn, isReadYn } from "@/assets/js/common.js";
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
	typeModelList: {
		type: Array,
		required: true,
	},
	dataStatusCdList: {
		type: Array,
		required: true,
	},
	structdModelSchmaList: {
		type: Array,
		required: true,
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
	typeModelList: [],
	typeModel:{},
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
    width: 100,
  },
  {
    prop: "modelLogicNm",
    label: "모델 논리명",
    width: 100,
  },
  {
    prop: "modelDataUri",
    label: "모델 데이터 URI",
    width: 100,
  },
/* 2023-07-27 정형모델 사용안함 
  {
    prop: "structdModelYn",
    label: "정형 모델 여부",
    width: 100,
  }, */
  {
    prop: "modelDataSttusMtcdNm",
    label: "상태",
    width: 80,
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
				state.typeModel.index = node.$index;
				state.typeModel.modelId = node.row.modelId;
				state.typeModel.structdModelYn = res.data.structdModelYn;
				if(state.typeModel.structdModelSchmaMtcd == null) {
					state.typeModel.structdModelSchmaMtcd = "";
				} else {
					state.typeModel.structdModelSchmaMtcd = res.data.structdModelSchmaMtcd;
				}
				state.typeModel.orgModelDataUri = res.data.modelDataUri;
				state.typeModel.modelDataUri = res.data.modelDataUri;
				state.typeModel.modelNm = res.data.modelNm;
				state.typeModel.modelLogicNm = res.data.modelLogicNm;
				state.typeModel.modelDesc = res.data.modelDesc;
				state.typeModel.modelDataSttusMtcd = res.data.modelDataSttusMtcd;
				state.typeModel.modelSortOdrg = res.data.modelSortOdrg;				
				state.typeModel.modelDataIdPfix = res.data.modelDataIdPfix;
				state.typeModel.regrInfo = res.data.modelRegrId + " / " + res.data.modelRegDt;
				state.typeModel.amdrInfo = res.data.modelAmdrId + " / " + res.data.modelAmdDt;
			})
			.catch((err)=>{
				console.log(err);
			});

			if (isAmdYn(route.meta.auth)) {
				curPage.value = "modify";
				curTitle.value = "메타데이터 유형 모델 편집"      
				} else {
				curPage.value = "detail";
				curTitle.value = "메타데이터 유형 모델 상세조회";
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
const modifyTypeModel = async (payload) => {
	let ruleForm = payload.ruleFormRef.value;
	if (!ruleForm) return;

	await ruleForm.validate((valid, fields) => {		
		if (valid) {
			let result = confirm("수정 하시겠습니까?");
			if (result) {
				let typeModel = {
					...payload.data
				};
				$axios
					.put(util.format($apiUrls.meta.data.type.modifyTypeModel, props.typeModelList[state.typeModel.index].modelId), typeModel)
					.then(() => {
						alert("수정이 완료되었습니다.");
						dialogVisibleModify.value = false;
						$emitter.emit("initTypeModelList");
					})
					.catch((err) => {
						console.log(err);
						if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
							alert(err.response.data.message);
						} else {
							alert("유형 모델 수정에 실패하였습니다.");
						}						
					});
			}
		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
};

const deleteTypeModel = (payload) => {
	// 2023-06-30 모델 삭제 로직 변경.let result = confirm("삭제하시겠습니까?\n삭제가 불가능한 경우 폐기 상태로 처리됩니다.");
	let result = confirm("삭제하시겠습니까?");
	if (result) {
		$axios.
			delete(util.format($apiUrls.meta.data.type.deleteTypeModel, payload.data))
			.then(() => {
				alert("삭제 완료하였습니다.");
				dialogVisibleModify.value = false;
				$emitter.emit("initTypeModelList");
			})
			.catch((err) => {
				console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("유형 모델 삭제에 실패하였습니다.");
				}
			});
	}
};


</script>
<style lang="scss"></style>