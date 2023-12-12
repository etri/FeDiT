<template>
	<div>
		<div class="inline-area mb10" style="justify-content: space-between;">
			<div class="taL">
				<el-button type="primary" plain @click="moveUp">▲ 위로</el-button>
				<el-button type="primary" plain @click="moveDown">▼ 아래로</el-button>
				<span class="guide-text ml15">※ 변경된 순서는 저장을 해야 반영됩니다.</span>
			</div>
			<div class="taR">
				<el-button type="primary" plain @click="deleteModelProperty">모델 프라퍼티 삭제</el-button>
				<el-button type="primary" @click="getTypePropertyList">모델 프라퍼티 추가</el-button>
				<el-button type="primary" @click="modifyModelProperty">저장</el-button>
				<el-button type="default" plain @click="prevStdModel" v-if="props.stdModelPrev">목록</el-button>
			</div>
		</div>
		<el-dialog style="width: 700px;" v-model="dialogVisibleDelete" :title="`메타데이터 ${state.modelGubunNm} 모델 프라퍼티 삭제`">
			<ModelPropertyDialogDelete :key="dialogKeyByEdit" :modelPropertyList="modelPropertyList" :modelId="modelId"
				@cancelDialog="cancelDialogDelete" @completeDialog="completeDialogDelete" />
		</el-dialog>
		<el-dialog style="width: 1300px;" v-model="dialogVisibleEdit" :title="`메타데이터 ${state.modelGubunNm} 모델 프라퍼티 추가`">
			<ModelPropertyDialogEdit ref="editRef" :key="dialogKeyByEdit" :typeModelYn="typeModelYn"
				:typeModelList="typeModelList" :modelId="modelId" @cancelDialog="cancelDialogModify"
				@getModelPropertyList="getModelPropertyList" />
		</el-dialog>
		<comn-list :tableHeader="tableHeader" :tableData="modelPropertyList" highlight-current-row
			:defaultSort="{ prop: 'rownum', order: 'ascending' }" @current-change="handleCurrentChange"
			>

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
				<template v-if="typeModelYn == 'N' && slotData.row.rangeModelTypeMtcd == 'object_type'">
					<el-button type="primary" plain size="small" class="ml10" @click="popDefaultStdModel(slotData.row)">기본 모델</el-button>
					<div :class="state.isStdModelChanged[slotData.row.rownum] ? 'warning-text' : ''">
						{{ slotData.row.stdModelNm ? '( ' + slotData.row.stdModelNm + ' )' : '( )' }}
						<el-button type="primary" plain size="small" v-show="slotData.row.stdModelNm" class="ml10" style="margin-top:2px;" @click="clearDefaultStdModel(slotData.row)"><el-icon><Close /></el-icon></el-button>
					</div>
				</template>
			</template>

			<template v-slot:modelPrptyValExam="slotData">
				<el-input v-model="slotData.row.modelPrptyValExam"></el-input>
			</template>

			<template v-slot:modelPrptyMandMtcd="slotData">
				<el-select v-model="slotData.row.modelPrptyMandMtcd" v-bind:disabled="isDisabledMandMtcd(slotData.row)">
					<el-option v-for="item in mandCdList" :key="item.mtcd" :label="item.mtcdNm" :value="item.mtcd"></el-option>
				</el-select>
			</template>

			<!-- 2023-07-27 정형모델 사용안함
			<template v-slot:tblColnMappgNm="slotData">
				<el-input v-model="slotData.row.tblColnMappgNm" v-bind:disabled="structdModelYn == 'N'"></el-input>
			</template>
		  -->
			
			<template v-slot:modelPrptyDelYn="slotData">
				<el-checkbox v-model="slotData.row.modelPrptyDelYn"></el-checkbox>
			</template>
		</comn-list>

		<el-dialog v-model="dialogVisibleModelSearch" title="모델 검색">
			<MetaDataModelSearchPage 
				searchSttusCd="use" 
				searchMode="std"
				:typeModelId="state.popTypeModelId" 
				@selectedRow="selectedMetaDataModel" />
		</el-dialog>		
	</div>
</template>

<script setup>
import ModelPropertyDialogEdit from "@/components/meta/datamodel/ModelPropertyDialogEdit.vue";
import ModelPropertyDialogDelete from "@/components/meta/datamodel/ModelPropertyDialogDelete.vue";
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";
import ComnList from "@/components/common/ComnList";
import { nowTimestamp, routerPush, getCookie } from "@/assets/js/common.js";
import { ref, reactive, getCurrentInstance, onMounted, onUpdated } from "vue";
import util from "util";
import { useRoute } from "vue-router";
import metaConst from "@/assets/js/metaConst.js";

const dialogKeyByEdit = ref('');
const dialogVisibleEdit = ref(false);
const dialogVisibleDelete = ref(false);
const route = useRoute();
const emits = defineEmits(["modifyModelProperty", "getModelPropertyList"]);
const editRef = ref(null);
const selectedRowRef = ref(null);

const dialogVisibleModelSearch = ref(false);

const props = defineProps({
	typeModelYn: {
		type: String,
		required: true
	},
	modelPropertyList: {
		type: Array,
		required: true
	},
	mandCdList: {
		type: Array,
		required: true
	},
	structdModelYn: {
		type: String,
		required: true
	},
	typeModelList: {
		type: Array,
		required: true
	},
	modelId: {
		type: String,
		required: true
	},
	typeModelId: {
		type: String,
		required: false
	},
	stdModelPrev: {
		type: Boolean,
		required: false
	},
});
const tableHeader = ref([
	{
		prop: "rownum",
		label: "순서",
		width: 40,
		align: "center",
		sortable: true
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
		width: 100,
		align: "left",
		columnType: "custom",
	},
	{
		prop: "rangeModelNm",
		label: "범위모델",
		width: 120,
		align: "left",
		columnType: "custom",
	},
	{
		prop: "modelPrptyValExam",
		label: "값 설명",
		width: 180,
		align: "left",
		columnType: "custom"
	},
	{
		prop: "modelPrptyMandMtcd",
		label: "필수구분",
		width: 80,
		align: "left",
		columnType: "custom"
	},
	/* 2023-07-27 정형모델 사용안함
	{
		prop: "tblColnMappgNm",
		label: "테이블 칼럼매핑명",
		width: 100,
		columnType: "custom"
	}, */
	{
		prop: "modelPrptyDelYn",
		label: "삭제",
		width: 40,
		align: "center",
		columnType: "custom"
	}
]);
//class binding (폐기 상태의 data는 적색 표시)
const isDisuseText = (row, prop) => {
	if (row.prptyDataSttusMtcd === 'disuse' && prop === 'prptyNm') return 'disuse-text-cause';
	if (row.rangeModelDataSttusMtcd === 'disuse' && prop === 'rangeModelNm') return 'disuse-text-cause';
	if (row.prptyDataSttusMtcd === 'disuse' || row.rangeModelDataSttusMtcd === 'disuse') return 'disuse-text';
	return '';
}

const state = reactive({
	modelGubunNm: "", // 유형 / 표준
	popTypeModelId: "",
	isStdModelChanged: [],
});

const handleCurrentChange = (ele) => {
	selectedRowRef.value = ele;
}

const moveUp = () => {
	if (!selectedRowRef.value) {
		alert('순서를 변경하려는 행을 선택해 주세요.');
		return;
	}

	if (props.modelPropertyList.length <= 1) return;
	if (selectedRowRef.value.rownum == 1) return; // top

	const currRownum = selectedRowRef.value.rownum;
	props.modelPropertyList = props.modelPropertyList.map((ele) => {
		if (ele.rownum == currRownum - 1) {
			ele.rownum = currRownum;
			ele.modelPrptySortOdrg = ele.rownum;
		}
	});
	selectedRowRef.value.rownum = currRownum - 1;
	selectedRowRef.value.modelPrptySortOdrg = selectedRowRef.value.rownum;
}

const moveDown = () => {
	if (!selectedRowRef.value) {
		alert('순서를 변경하려는 행을 선택해 주세요.');
		return;
	}

	if (props.modelPropertyList.length <= 1) return;
	if (selectedRowRef.value.rownum == props.modelPropertyList.length) return; // bottom

	const currRownum = selectedRowRef.value.rownum;
	props.modelPropertyList = props.modelPropertyList.map((ele) => {
		if (ele.rownum == currRownum + 1) {
			ele.rownum = currRownum;
			ele.modelPrptySortOdrg = ele.rownum;
		}
	});
	selectedRowRef.value.rownum = currRownum + 1;
	selectedRowRef.value.modelPrptySortOdrg = selectedRowRef.value.rownum;
}

onMounted(() => {
	showColTblColnMappgNm();

	state.modelGubunNm = props.typeModelYn === 'Y' ? '유형' : '표준';
})

onUpdated(() => {
	showColTblColnMappgNm();

	state.modelGubunNm = props.typeModelYn === 'Y' ? '유형' : '표준';
})

const showColTblColnMappgNm = () => {
	/* 2023-07-27 정형모델 사용안함
	if (props.structdModelYn == 'Y') {
		// 정형 모델 경우만 tblColnMappgNm 보이게
		let idx = tableHeader.value.findIndex(x => x.prop == 'tblColnMappgNm');
		if (idx == -1) {
			tableHeader.value.splice(7, 0, {
				prop: "tblColnMappgNm",
				label: "테이블 칼럼매핑명",
				width: 100,
				columnType: "custom"
			})
		}
	} else {
		// tblColnMappgNm 안보이게
		let idx = tableHeader.value.findIndex(x => x.prop == 'tblColnMappgNm');
		//console.log(`idx : ${idx}`);  
		if (idx != -1) tableHeader.value.splice(idx, 1);
	} */
}

const isDisabledMandMtcd = (row) => {
	return (row.setUsgPrptyYn == 'Y' || row.cntPrptyYn == 'Y' || metaConst.ARR_DERIVED_DATATYPE.findIndex(x => x === row.rangeDataTypeMtcd) != -1);
}

const getTypePropertyList = () => {
	dialogKeyByEdit.value = nowTimestamp();
	dialogVisibleEdit.value = true;
	setTimeout(() => {
		editRef.value.getTypePropertyList();

	}, 100)
}

const modifyModelProperty = async () => {
	state.isStdModelChanged = state.isStdModelChanged.map(() => false);
	emits("modifyModelProperty", { data: props.modelPropertyList });
};

const getModelPropertyList = (modelId) => {
	emits("getModelPropertyList", modelId);
}

const deleteModelProperty = () => {
	let delCount = 0;
	props.modelPropertyList.map((ele) => {
		if (ele.modelPrptyDelYn == true) {
			delCount++;
		}
	})

	if (delCount == 0) {
		alert("삭제대상을 선택해주세요.");
		return;
	}

	dialogKeyByEdit.value = nowTimestamp();
	dialogVisibleDelete.value = true;
}
const cancelDialogModify = () => {
	dialogVisibleEdit.value = false;
}
const cancelDialogDelete = () => {
	dialogVisibleDelete.value = false;
	getModelPropertyList(props.modelId);
}
const completeDialogDelete = () => {
	dialogVisibleDelete.value = false;
	getModelPropertyList(props.modelId);
}

const prevStdModel = () => {
	routerPush(getCookie("pltfrmId"), "StdModelListPage", { modelId: props.modelId });
}

const popDefaultStdModel = (row) => {
	state.popTypeModelId = row.rangeModelId;
	dialogVisibleModelSearch.value = true;
}

const selectedMetaDataModel = (payload) => {
	const { modelId, modelNm } = payload.rowData;
	selectedRowRef.value.stdModelId = modelId;
	selectedRowRef.value.stdModelNm = modelNm;
	const currRownum = selectedRowRef.value.rownum;
	state.isStdModelChanged[currRownum] = true;
	dialogVisibleModelSearch.value = false;
}

const clearDefaultStdModel = (row) => {
	row.stdModelId = null;
	row.stdModelNm = null;
	const currRownum = row.rownum;
	state.isStdModelChanged[currRownum] = true;	
}

</script>
<style lang="scss"></style>