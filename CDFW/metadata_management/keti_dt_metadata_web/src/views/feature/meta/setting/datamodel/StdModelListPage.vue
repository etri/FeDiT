<template>
	<div class="cntSec flex-container">
		<div class="container-items-left">
			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 모델</h3>
					<div class="btnSec taR">
						<el-checkbox style="margin-right: 20px;" @change="checkAll">
							<span style="font-size: 12px;">전체 상태 보기</span>
						</el-checkbox>
						<el-button type="primary" v-if="isWriteYn(route.meta.auth)" @click="dialogEditModel" >하위 모델 등록</el-button>
					</div>

				</div>
				<div class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<!-- tree list -->
						<MetadataModelList ref="modelTreeRef" :renderContent="renderContent"
							:metadataModelItemList="state.metadataModelItems" @chooseMetadataModel="chooseMetadataModel" />
					</div>
				</div>
			</div>

			<el-dialog v-model="dialogVisibleEdit" :key="dialogKeyByEdit" title="메타데이터 표준 모델 등록">
				<StdModelDialogEdit :stdModel="state.modelInfo" :dataStatusCdList="dataStatusCdList"
					@cancelDialog="cancelDialogEdit" @editModel="editModel" />
			</el-dialog>

		</div>

		<div class="container-items-right">

			<el-dialog v-model="dialogVisibleModify" :key="dialogKeyByEdit" title="메타데이터 표준 모델 수정">
				<StdModelDialogModify :stdModel="state.modelInfo" :dataStatusCdList="dataStatusCdList"
					@deleteModel="deleteModel" @cancelDialogModify="cancelDialogModify" @modifyModel="modifyModel" />
			</el-dialog>

			<div class="boxSectionTit" style="margin-top: 0">
				<div v-if="!state.modelInfo.modelNm ">
					<h3>메타데이터 모델을 선택하세요.</h3>
				</div>
				<div v-else>
					<h3>[{{ state.modelInfo.modelNm }}] &nbsp; {{ state.modelInfo.modelLogicNm }} </h3>
				</div>
			</div>

			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 모델 정보</h3>
					<div class="btnSec taR">
						<el-button type="primary" @click="dialogModifyModel" 
							v-show="isAmdYn(route.meta.auth) && (state.modelInfo.modelId != 'Class' && state.modelInfo.upModelId != 'Class')">수정</el-button>
					</div>
				</div>
				<div class="boxCnt">
					<div class="ly-table">
						<el-form label-width="160px" label-position="right">
							<el-row>
								<el-col :span="12">
									<el-form-item label="모델 데이터URI">{{ state.modelInfo.modelDataUri }}</el-form-item>
								</el-col>
							</el-row>
							<el-row>
								<el-col :span="24">
									<el-form-item label="모델 ID">{{ state.modelInfo.modelId }}</el-form-item>
								</el-col>
							</el-row>
							<el-row>
								<el-col :span="24">
									<el-form-item label="유형 모델">{{ state.modelInfo.typeModelLogicExNm }}</el-form-item>
								</el-col>
							</el-row>
							<el-row>
								<el-col :span="24">
									<el-form-item label="상위 모델">{{ state.modelInfo.upModelLogicExNm }}</el-form-item>
								</el-col>
							</el-row>
							<el-row>
								<el-col :span="24">
									<el-form-item label="모델 명(물리명)">{{ state.modelInfo.modelNm }}</el-form-item>
								</el-col>
							</el-row>
							<el-row>
								<el-col :span="24">
									<el-form-item label="모델 논리명">{{ state.modelInfo.modelLogicNm }}</el-form-item>
								</el-col>
							</el-row>
							<el-row>
								<el-col :span="24">
									<el-form-item label="모델 상태">{{ state.modelInfo.modelDataSttusMtcdNm }}</el-form-item>
								</el-col>
							</el-row>
							<el-row>
								<el-col :span="24">
									<el-form-item label="설명">{{ state.modelInfo.modelDesc }}</el-form-item>
								</el-col>
							</el-row>
						</el-form>
					</div>
				</div>
			</div>
			
			<div class="boxLayout">
				<div class="boxTit">
					<h3>모델 프라퍼티 목록</h3>
					<div class="btnSec taR">
						<!-- <el-button type="default" @click="openModelPropertyListPopup">프라퍼티 목록(TEST)</el-button> -->
						<el-button type="primary" v-if="isWriteYn(route.meta.auth)" @click="dialogEditModelProperty" 
							v-show="isAmdYn(route.meta.auth) && (state.modelInfo.modelId != 'Class' && state.modelInfo.upModelId != 'Class') && state.modelInfo.modelDataSttusMtcd != 'disuse'">모델
							프라퍼티 관리</el-button>
					</div>
				</div>

				<div class="boxCnt">
					<comn-list :tableHeader="tableHeader" :tableData="state.modelPropertyList">
						<template v-slot:rownum="slotData">
							<span :class="[isDisuseText(slotData.row, '')]">{{ slotData.row.rownum }}</span>
						</template>
						<template v-slot:prptyNm="slotData">
							<span :class="[isDisuseText(slotData.row, 'prptyNm')]">{{ slotData.row.prptyNm }}</span>
						</template>
						<template v-slot:prptyLogicNm="slotData">
							<span :class="[isDisuseText(slotData.row, '')]">{{ slotData.row.prptyLogicNm }}</span>
						</template>
						<template v-slot:domnModelNm="slotData">
							<span :class="[isDisuseText(slotData.row, '')]">{{ slotData.row.domnModelNm }}</span>
						</template>
						<template v-slot:rangeModelNm="slotData">
							<span :class="[isDisuseText(slotData.row, 'rangeModelNm')]">{{ slotData.row.rangeModelNm }}</span>
						</template>
						<template v-slot:modelPrptyMandMtcdNm="slotData">
							<span :class="[isDisuseText(slotData.row, '')]">{{ slotData.row.modelPrptyMandMtcdNm }}</span>
						</template>
					</comn-list>
				</div>

			</div>
		</div>
	</div>
</template>
<script setup>

import MetadataModelList from '@/components/meta/dataset/MetadataModelList.vue';
import StdModelDialogEdit from "@/components/meta/datamodel/StdModelDialogEdit.vue";
import StdModelDialogModify from "@/components/meta/datamodel/StdModelDialogModify.vue";
import ModelPropertyList from "@/components/meta/datamodel/ModelPropertyList.vue";
import ModelPropertyDeleteHistList from "@/components/meta/datamodel/ModelPropertyDeleteHistList.vue";
import ComnList from "@/components/common/ComnList";

import { onMounted, computed, reactive, ref, getCurrentInstance, watch, onUpdated } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import {
	getGlobalProperties,
	isWriteYn,
	isAmdYn,
	nowTimestamp,
	routerPush,
	getCookie
} from "@/assets/js/common.js";
import util from "util";

const store = useStore();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const dialogVisibleEdit = ref(false);
const dialogVisibleModify = ref(false);
const dialogKeyByEdit = ref('');
const allStatusChecked = ref(false);
const modelTreeRef = ref(null);

const dataStatusCdList = computed(() => store.getters["MetaStore/getStoreMetaCodeList"]("MCG00002"));

const state = reactive({
	metadataModelItems: [],
	modelPropertyList: [],
	modelPropertyDelHistList: [],
	modelInfo: {},
	stdModel: {}
});

const tableHeader = ref([
	{
		prop: "rownum",
		label: "번호",
		width: 30,
		align: "center",
		columnType: "custom",
	},
	{
		prop: "prptyNm",
		label: "프라퍼티 명",
		width: 100,
		align: "left",
		columnType: "custom",
	},
	{
		prop: "prptyLogicNm",
		label: "프라퍼티 논리명",
		width: 100,
		align: "left",
		columnType: "custom",
	},
	{
		prop: "domnModelNm",
		label: "도메인 모델",
		width: 80,
		align: "left",
		columnType: "custom",
	},
	{
		prop: "rangeModelNm",
		label: "범위모델",
		width: 100,
		align: "left",
		columnType: "custom",
	},
	{
		prop: "modelPrptyMandMtcdNm",
		label: "필수",
		width: 80,
		align: "left",
		columnType: "custom",
	},
]);

const isDisuseText = (row, prop) => {
	if (row.prptyDataSttusMtcd === 'disuse' && prop === 'prptyNm') return 'disuse-text-cause';
	if (row.rangeModelDataSttusMtcd === 'disuse' && prop === 'rangeModelNm') return 'disuse-text-cause';
	if (row.prptyDataSttusMtcd === 'disuse' || row.rangeModelDataSttusMtcd === 'disuse') return 'disuse-text';
	return '';
}

onMounted(() => {
	let nextModelId = "";
	if (route.query.modelId != null) nextModelId = route.query.modelId;
	getMetadataModelItemList(nextModelId);
})

const checkAll = (checked) => {
	allStatusChecked.value = checked;
	getMetadataModelItemList();
}

const renderContent = (h, { node, data }) => {
	if (!data) {
		return h('span', { class: 'el-tree-node__label' });
	}

	let classNames = "el-tree-node__label";
	if (data.modelId === 'Class' || data.upModelId === 'Class') {
		classNames += " custom-disabled-label";
	}
	if (data.modelDataSttusMtcd == "disuse") {
		classNames += " custom-class";
	}
	let label = data && data.modelNm ? data.modelNm : '';

	const vnode = h('span');
	vnode.props = { class: classNames, innerHTML: label };

	return vnode;
};

const chooseMetadataModel = (payload) => {
	getDetailModel(payload.modelId);
	getModelPropertyList(payload.modelId, payload.structdModelYn);
};

const getDetailModel = (modelId) => {
	$axios
		.get(util.format($apiUrls.meta.data.model.getModel, modelId))
		.then((res) => {
			if (res.data.structdModelYn == 'N') {
				res.data.structdModelExYn = res.data.structdModelYn + " (비정형)";
			} else {
				res.data.structdModelExYn = res.data.structdModelYn + " (정형)";
			}

			res.data.typeModelLogicExNm = (res.data.typeModelId == null ? "" : res.data.typeModelId) + " " + (res.data.typeModelLogicNm == null ? "" : res.data.typeModelLogicNm);
			res.data.upModelLogicExNm = (res.data.upModelId == null ? "" : res.data.upModelId) + " " + (res.data.upModelLogicNm == null ? "" : res.data.upModelLogicNm);
			res.data.modelLogicExNm = res.data.modelId + " " + res.data.modelLogicNm;

			res.data.regrInfo = res.data.modelRegrId + " / " + res.data.modelRegDt;
			res.data.amdrInfo = res.data.modelAmdrId + " / " + res.data.modelAmdDt;

			state.modelInfo = res.data;
		})
		.catch((err) => {
			console.log(err);
		});
}

const getModelPropertyList = (modelId, structdModelYn) => {
	state.modelPropertyList.length = 0;
	$axios
		.get(util.format($apiUrls.meta.data.std.getStdModelPropertyList, modelId))
		.then((res) => {
			let rownum = 0;
			state.modelPropertyList = res.data.list.map((data) => {
				data.rownum = ++rownum;
				return data;
			});			
		})
		.catch((err) => {
			console.log(err);
		});
};

const getMetadataModelItemList = (nextModelId, cmd) => {
	$axios
		.get($apiUrls.meta.resource.metadatasets.getMetadataModelsTree, {
			params: {
				modelDataSttusMtcd: allStatusChecked.value ? "" : "use",
				modelTypeMtcd: "object_type"
			},
		})
		.then((res) => {
			state.metadataModelItems = [res.data];

			selectTreeItemAndExecuteCmd(nextModelId, cmd);
		})
		.catch((err) => {
			console.log(err);
		});
}

const selectTreeItemAndExecuteCmd = (nextModelId, cmd) => {
	if (nextModelId) {
		const foundModel = findTreeDataItem(nextModelId, state.metadataModelItems[0]);
		if (foundModel) {
			if (cmd === 'GO_PROPERTY_PAGE' && isAmdYn(route.meta.auth)) {
				state.modelInfo = foundModel;
				dialogEditModelProperty();
			} else {
				modelTreeRef.value.setCurrentKey(nextModelId);
				chooseMetadataModel(foundModel);
			}
		}
	}
}

const findTreeDataItem = (modelId, dataDto) => {
	if (!dataDto) return null;

	if (dataDto.modelId === modelId) return dataDto;
	if (dataDto.children && dataDto.children.length > 0) {
		for (let i = 0; i < dataDto.children.length; i++) {
			const foundDto = findTreeDataItem(modelId, dataDto.children[i]);
			if (foundDto) return foundDto;
		}
	}

	return null;
}

const dialogEditModel = () => {
	if (state.modelInfo.modelId == "Class" || state.modelInfo.modelId == "" || state.modelInfo.modelId == null) {
		alert("상위모델을 선택해주세요");
		return;
	}
	if (state.modelInfo.modelDataSttusMtcd == 'disuse') {
		alert("하위에 모델을 추가할 수 없습니다. (상태: " + state.modelInfo.modelDataSttusMtcdNm + ")");
		return;
	}
	dialogKeyByEdit.value = nowTimestamp();
	dialogVisibleEdit.value = true;
}
const dialogModifyModel = () => {
	if (state.modelInfo.modelId == "Class" || state.modelInfo.modelId == "" || state.modelInfo.modelId == null) {
		alert("모델을 선택해주세요");
		return
	}
	dialogKeyByEdit.value = nowTimestamp();
	dialogVisibleModify.value = true;
}

const dialogEditModelProperty = () => {
	if (state.modelInfo.modelId == "Class" || state.modelInfo.modelId == "" || state.modelInfo.modelId == null) {
		alert("모델을 선택해주세요");
		return
	}
	let query = {
		modelId: state.modelInfo.modelId,
		typeModelId: state.modelInfo.typeModelId
	}
	routerPush(getCookie("pltfrmId"), "StdModelPropertyListPage", query);

}

const editModel = (payload) => {
	getMetadataModelItemList(payload.modelId, 'GO_PROPERTY_PAGE');
	dialogVisibleEdit.value = false;
};

const modifyModel = () => {
	getMetadataModelItemList();
	dialogVisibleModify.value = false;
};

const deleteModel = () => {
	getMetadataModelItemList();
	modelTreeRef.value.setCurrentKey(null);
	state.modelInfo={};
	state.modelPropertyList	= [];
	dialogVisibleModify.value = false;
}

const cancelDialogEdit = () => {
	dialogVisibleEdit.value = false;
};

const cancelDialogModify = () => {
	dialogVisibleModify.value = false;
};

const openModelPropertyListPopup = () => {
	var popup = {
		x: (document.body.offsetWidth / 2) - (500 / 2),
		y: (document.body.offsetHeight / 2) - (720 / 2)
	};

	let url = '/meta/popup/modelPropertyList';

	let { modelId, typeModelId } = state.modelInfo;
	if (modelId) {
		url += '?modelId=' + modelId;
	}
	if (typeModelId) {
		url += '&typeModelId=' + typeModelId;
	}

	var base = {
		name: '모델 프라퍼티 목록',
		option: 'width=1200, height=800, top=' + popup.y + ', left=' + popup.x + ', status=no, scrollbars=no, resizable=no, location=no, toolbar=no',
		url
	}

	store.dispatch("MetaStore/openPopup", base);
};

window.addEventListener('beforeunload', () => {
  store.commit('MetaStore/closePopup');
});

</script>
<style lang="scss">
.flex-container {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-around;
}

.container-items-left {
	width: 35%;
	margin-right: 20px;
}

.container-items-right {
	width: calc(65% - 20px);
}

.container-items {
	flex-grow: 1;
	flex-shrink: 1;
	flex-basis: 300px;
}

.custom-class {
	color: #ec4a4a !important;
}

.custom-disabled-label {
	color: var(--el-disabled-text-color);
	background-color: var(--el-disabled-bg-color);
	line-height: 20px;
	padding: 0px 5px 0px 2px;
}
</style>
