<template>
	<div>
		<!-- btn area -->
		<div class="btnSec taR mb10">
			<el-button type="primary" v-if="dataEditableYn == 'Y'" @click="modifyMetadataListForSaveInfo">저장</el-button>
		</div>
		<!-- list area -->

		<comn-list :tableHeader="tableHeader" :tableData="metadataListSettingByDataType" class="data-edit-list">
			<!-- slot -->
			<template v-slot:langMtcd="slotData">
				<el-select v-bind:disabled="slotData.row.langEnableYn != 'Y'" v-model="slotData.row.langMtcd" @change="emitOnDataChanged"
					:placeholder="`${slotData.row.langEnableYn != 'Y' ? '해당없음' : '선택'}`"
					:class="[isRequiredAreaLangMtcd(slotData.row)]">
					<el-option :label="`${slotData.row.langEnableYn != 'Y' ? '해당없음' : '선택'}`" value=""></el-option>
					<el-option v-for="item in langMtcdList" :key="item.mtcd" :label="item.mtcdNm" :value="item.mtcd" />
				</el-select>
			</template>

			<template v-slot:medataVal="slotData">

				<!-- case1. valModelTypeMtcd object_type 경우 -->
				<div v-if="slotData.row.valModelTypeMtcd === 'object_type'">
					<div class="inline-area">
						<el-input v-model="slotData.row.medataVal" disabled style="width: calc(100% - 70px);" /> 
						<div class="btnSec taR ml15">
							<el-button type="primary" @click="popModifyMetadata(slotData.row)">
								값 {{ dataEditableYn == 'Y' ? '편집' : '조회' }}
							</el-button>
						</div>
					</div>
				</div>

				<!-- case2. dataTypeMtcd이 code, categoryId, categoryConcept 가 아닌 경우 - input el -->
				<el-input v-else-if="(slotData.row.dataTypeMtcd != 'code' && slotData.row.dataTypeMtcd != 'categoryId' && slotData.row.dataTypeMtcd != 'categoryConcept')"  
					@change="emitOnDataChanged" 
					v-model="slotData.row.medataVal" v-bind:disabled="slotData.row.editableYn != 'Y'"
					:class="[isRequiredAreaMedataVal(slotData.row)]" />

				<!-- case3. dataTypeMtcd이 code인 경우 - select box -->
				<el-select v-else-if="slotData.row.dataTypeMtcd === 'code'" @change="changeCd(slotData.row, $event)"
					v-bind:disabled="slotData.row.editableYn != 'Y'" v-model="slotData.row.medataVal"
					:placeholder="`${slotData.row.editableYn != 'Y' ? '' : '선택'}`" :class="[isRequiredAreaMedataVal(slotData.row)]">
					<el-option :label="`${slotData.row.editableYn != 'Y' ? '' : '선택'}`" value=""></el-option>
					<el-option v-for="item in slotData.row.codeListByMetadataVal" :key="item.mtcd"
						:label="`[${item.mtcd}] ${item.mtcdNm}`" :value="item.mtcd" />
				</el-select>

				<!-- case4. dataTypeMtcd이 categoryId, categoryConcept 인 경우 - 카테고리 검색용 modal -->
				<div v-else-if="slotData.row.dataTypeMtcd === 'categoryId' || slotData.row.dataTypeMtcd === 'categoryConcept'">
					<div class="inline-area" v-if="dataEditableYn == 'Y'">
						<el-input v-model="slotData.row.medataVal" disabled style="width: calc(100% - 123px);" /> 
						<div class="btnSec taR ml15">
							<el-button type="default" @click="searchCategory(slotData.row)">
								<el-icon class="icon icon-search"></el-icon>
							</el-button>
							<el-button type="default" class="el-button--delete" @click="refreshCategory(slotData.row)"><el-icon class="icon icon-refresh" /></el-button>
						</div>
					</div>
					<div v-else>
						<el-input v-model="slotData.row.medataVal" disabled /> 
					</div>
				</div>	

			</template>
		</comn-list>

		<el-dialog v-model="dialogVisibleSearchCategory" title="카테고리 검색">
			<CategoryDialogSearch @selectCategory="selectCategory" />
		</el-dialog>

		<el-dialog v-model="dialogVisibleModifyMetadata"
			:title="state.popModifyMetadataParam.title"
			:before-close="onBeforeCloseDialogModifyMetadata">
			<MetadataArrayDialogModify ref="dialogModifyMetadataRef" :dataEditableYn="dataEditableYn"
				:medataSetId="medataSet.medataSetId" 
				:medataSet="medataSet"
				:generalProperty="state.popModifyMetadataParam.generalProperty"
				:backPageName="state.popModifyMetadataParam.backPageName" 
				@goToDetailPage="dialogVisibleModifyMetadata = false;" />
		</el-dialog>		

	</div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnFormItemInput2Btns from "@/components/common/ComnFormItemInput2Btns.vue";
import CategoryDialogSearch from "@/components/meta/category/CategoryDialogSearch.vue";
import MetadataArrayDialogModify from "@/components/meta/dt/MetadataArrayDialogModify.vue";

import { ref, reactive, defineProps, getCurrentInstance, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { getUser, getLoginUserId } from "@/assets/js/auth.js";
import { getGlobalProperties, isAmdYn, isReadYn, isEmpty } from "@/assets/js/common.js";
import util from "util";

const store = useStore();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;
const user = getUser();

const dialogVisibleSearchCategory = ref(false); //카테고리 검색 modal 상태
const dialogVisibleRdfSearch = ref(false); //RDF 확인
const targetCategoryElement = ref({}); //카테고리 검색창 modal을 활성화한 카테고리 요소

const dialogVisibleModifyMetadata = ref(false); //메타데이터 배열 편집 팝업
const dialogModifyMetadataRef = ref(null);

const langMtcdList = ref([]); //언어코드리스트
const metadataListSettingByDataType = ref([]); //data type에 따라 세부 데이터를 세팅한 저장용 메타데이터 목록(props로 받아온 metadataListWithSetId 목록을 가공)
watch(
	() => metadataListSettingByDataType,
	() => {
	},
	{ deep: true }
)

const emits = defineEmits([
	"modifyMetadataListForSaveInfo", "on-data-changed"
]);

const props = defineProps({
	dataEditableYn: {
		type: String,
		required: true
	},
	metadataListWithSetId: {
		type: Array,
		required: true,
	},
	medataSet: {
		type: Object,
		required: true
	},
	generalPropertyMap: {
		type: Object,
		required: true,
	},	
	refPropertyNmMap: {
		type: Object,
		required: false,
	},
	backPageName: {
		type: String,
		required: false,
	}	
});

const tableHeader = ref([
	{ //pagination이 적용되지 않을 때 사용 가능한 순번 컬럼
		prop: "",
		label: "번호",
		width: 45,
		align: "center",
		type: "index",
	},
	{
		prop: "prptyNm",
		label: "프라퍼티 명",
		width: 110,
	},
	{
		prop: "prptyLogicNm",
		label: "프라퍼티 논리명",
		width: 100,
	},
	{
		prop: "modelPrptyMandMtcdNm",
		label: "필수 구분",
		width: 80,
	},
	{
		prop: "valModelNm", // valModelId
		label: "범위 모델",
		width: 110,
	},
	{
		prop: "modelPrptyValExam",
		label: "값 설명(예제)",
		width: 180,
	},
	{
		prop: "langMtcd",
		label: "언어",
		width: 100,
		columnType: "custom",
	},
	{
		prop: "medataVal",
		label: "메타데이터 값",
		width: 250,
		columnType: "custom",
	}
]);

const state = reactive({
	popModifyMetadataParam: {
		title: '',
		generalProperty: {},
		backPageName: props.backPageName,
	}
});

//class binding
//언어(langMtcd) 컬럼에 바인딩할 클래스 (required-input-area로 입력 필수 부분 적색으로 표시)
const isRequiredAreaLangMtcd = (alotDataRow) => {
	return alotDataRow.langEnableYn == 'Y' && alotDataRow.modelPrptyMandMtcd == 'required' ? 'required-input-area' : '';
};
//메타데이터값(MedataVal) 컬럼에 바인딩할 클래스 (required-input-area로 입력 필수 부분 적색으로 표시)
const isRequiredAreaMedataVal = (slotDataRow) => {
	return slotDataRow.editableYn == 'Y' && slotDataRow.modelPrptyMandMtcd == 'required' ? 'required-input-area' : '';
};

onMounted(() => {
	getMetaCodeList();
	initMetadataValByDataType();
});

const getMetaCodeList = async () => {
	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00006"], // 언어코드
		},
	});

	const List = store.getters["MetaStore/getStoreMetaCodeList"]("MCG00006");  // 언어코드
	langMtcdList.value = List;
};

const getCodeListByMetadataVal = async (rangeMtcdGrpId) => {
	if (isEmpty(rangeMtcdGrpId)) return;
	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: [rangeMtcdGrpId]
		},
	});

	let codeListByMetadataVal = store.getters["MetaStore/getStoreMetaCodeList"](rangeMtcdGrpId);
	return codeListByMetadataVal;
};

const initMetadataValByDataType = async () => {

	let saveInfoList = JSON.parse(JSON.stringify(props.metadataListWithSetId));
	await Promise.all(
		saveInfoList.map(async (item) => {

			if (item.dataTypeMtcd === 'code') {
				let codeListByMetadataVal = await getCodeListByMetadataVal(item.rangeMtcdGrpId);
				item['codeListByMetadataVal'] = codeListByMetadataVal;
			}
			return item;
		})
	);
	//렌더링에 사용할 데이터(dataTypeMtcd에 따른 나머지 값들을 더해준 저장용 메타데이터 목록 set)
	metadataListSettingByDataType.value = JSON.parse(JSON.stringify(saveInfoList));
};
watch(
	() => props.metadataListWithSetId,
	() => {
		initMetadataValByDataType();
	},
	{ deep: true }
)

async function modifyMetadataListForSaveInfo() {

	let saveInfoList = JSON.parse(JSON.stringify(metadataListSettingByDataType.value));

	for(var i=0; i<saveInfoList.length; i++) {
		if(saveInfoList[i].langEnableYn === "Y" && (saveInfoList[i].langMtcd === null || saveInfoList[i].langMtcd === "")) {
			if(saveInfoList[i].medataVal !== null && saveInfoList[i].medataVal !== ""){
				alert(i+1 + "번째 행 " + saveInfoList[i].prptyNm + " 프라퍼티의 언어를 먼저 선택하신 후\n해당 프라퍼티의 메타데이터 값을 입력해주세요.");
				return;
			}
		}
	}

	saveInfoList = await setSaveInfoExceptEditableYn(saveInfoList);

	emits("modifyMetadataListForSaveInfo", { data: saveInfoList });
};

function setSaveInfoExceptEditableYn(saveInfoList) {
	return new Promise((resolve, reject) => {
		// 저장 시, editableYn == 'Y' 에 해당할 때만 request data로 backend 요청(23.05.25)
		let processedList = saveInfoList.filter(item => item.editableYn == 'Y')
			.map((item) => {
				var newItem = {
					"medataId": item.medataId,
					"prptyId": item.prptyId,
					"langMtcd": item.langMtcd,
					"medataVal": item.medataVal
				};
				return newItem;
			});

		if (processedList.length > 0) {
			resolve(processedList);
		} else {
			reject();
		}
	});
}

const changeCd = (payload, event) => {
	metadataListSettingByDataType.value.map((item) => {
		//서로 의존적인  프라퍼티가 존재할 경우 코드값 변경에 따라서 연관된 프라퍼티를 바꾼다.
		changeRefPropertyForDataTypeCode(payload, event);
		return item;
	});

	emitOnDataChanged();
};

const changeRefPropertyForDataTypeCode = (payload, event) => {
	let refProperty = props.refPropertyNmMap[payload.prptyId];
	if (!refProperty) return;

	metadataListSettingByDataType.value.map((item) => {
		if (refProperty === item['prptyId']) {
			let matchingCode = payload.codeListByMetadataVal.find(item => item.mtcd == event);
			item['medataVal'] = (isEmpty(matchingCode)) ? '' : matchingCode.mtcdNm;
		}
		return item;
	});
};

const changeRefPropertyForDataTypeCategory = (searchedCategoryInfo) => {
	let refProperty = props.refPropertyNmMap[targetCategoryElement.value.prptyId];
	if (!refProperty) return;

	let targetItem = metadataListSettingByDataType.value.find(item => item.prptyId == refProperty);
	if (targetItem && !isEmpty(searchedCategoryInfo?.data.ctgryNm)) targetItem['medataVal'] = searchedCategoryInfo.data.ctgryNm;
	if (targetItem && isEmpty(searchedCategoryInfo?.data.ctgryNm)) targetItem['medataVal'] = '';
};

const searchCategory = (slotData) => {
	targetCategoryElement.value = { ...slotData };
	dialogVisibleSearchCategory.value = true
};

const selectCategory = (searchedCategoryInfo) => {
	dialogVisibleSearchCategory.value = false;
	//shallow copy를 이용하여 렌더링되는 데이터 변경하기
	let targetItem = metadataListSettingByDataType.value.find(item => item.modelPrptyId == targetCategoryElement.value.modelPrptyId);
	if (targetItem['dataTypeMtcd'] === 'categoryConcept') {
		targetItem['medataVal'] = searchedCategoryInfo?.data.ctgryRdfCncptNm;
	} else {
		targetItem['medataVal'] = searchedCategoryInfo?.data.ctgryId;
	}
	targetItem['ctgryNm'] = searchedCategoryInfo?.data.ctgryNm;
	//ref property change
	changeRefPropertyForDataTypeCategory(searchedCategoryInfo);

	emitOnDataChanged();
};

const refreshCategory = (slotData) => {
	targetCategoryElement.value = { ...slotData };
	//shallow copy를 이용하여 렌더링되는 데이터 변경하기
	let targetItem = metadataListSettingByDataType.value.find(item => item.modelPrptyId == slotData.modelPrptyId);
	targetItem['medataVal'] = '';
	targetItem['ctgryNm'] = '';

	//ref property change
	changeRefPropertyForDataTypeCategory();
	targetCategoryElement.value = {};

	emitOnDataChanged();
};

const popModifyMetadata = (slotData) => {
	state.popModifyMetadataParam = {
		title: `메타데이터 값 ${props.dataEditableYn == 'Y' ? '편집' : '조회'} - [ ${slotData.prptyNm} ] 프라퍼티`,
		generalProperty: props.generalPropertyMap[slotData.prptyNm],
		backPageName: props.backPageName ?? props.dataEditableYn == 'Y' ? 'MetadataDetailManagePage' : 'RetrievalMetadataSetPage',
	};

	dialogVisibleModifyMetadata.value = true;
}

const onBeforeCloseDialogModifyMetadata = (done) => {
	if (dialogModifyMetadataRef.value.isDataSaved()) {		
		const newDataList = dialogModifyMetadataRef.value.getNewDataList();
		const delDataList = dialogModifyMetadataRef.value.getDelDataList();
		if (newDataList && newDataList.length > 0) {
			//shallow copy를 이용하여 렌더링되는 데이터 변경하기
			const newData = newDataList[newDataList.length - 1]; // { medataSetId, prptyId, medataVal, medataValNm }
			// console.log(`set new : ${newData.prptyId}`);
			let targetItem = metadataListSettingByDataType.value.find(item => item.prptyId == newData.prptyId);
			targetItem['medataVal'] = newData.medataVal;

			let refProperty = props.refPropertyNmMap[newData.prptyId]; // prptyId equals prptyNm
			if (refProperty) {
				let derivedItem = metadataListSettingByDataType.value.find(item => item.prptyId == refProperty);
				if (derivedItem) derivedItem['medataVal'] = newData.medataValNm;
			}
		} else if (delDataList && delDataList.length > 0) {
			//shallow copy를 이용하여 렌더링되는 데이터 변경하기
			const delData = delDataList[delDataList.length - 1]; // { medataSetId, prptyId, medataVal, medataValNm }
			// console.log(`set null : ${delData.prptyId}`);
			let targetItem = metadataListSettingByDataType.value.find(item => item.prptyId == delData.prptyId);
			targetItem['medataVal'] = null;

			let refProperty = props.refPropertyNmMap[delData.prptyId]; // prptyId equals prptyNm
			if (refProperty) {
				let derivedItem = metadataListSettingByDataType.value.find(item => item.prptyId == refProperty);
				if (derivedItem) derivedItem['medataVal'] = null;
			}
		}
		dialogModifyMetadataRef.value.initDialogData();
	}
	done(); // close
}

const emitOnDataChanged = () => {
	if (props.dataEditableYn != 'Y') return;
	let saveInfoList = JSON.parse(JSON.stringify(metadataListSettingByDataType.value)); // deep copy
	emits("on-data-changed", saveInfoList);
}

</script>
<style>
.required-input-area .el-input__wrapper {
	background-color: #F9EEEE;
	/* #F9E0D3 */
}
</style>
<style lang="scss" scoped>
.data-edit-list .el-select {
	width: 100%;
}
</style>