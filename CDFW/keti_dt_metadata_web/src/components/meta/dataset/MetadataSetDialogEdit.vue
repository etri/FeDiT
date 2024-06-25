<template>
	<div class="dialog-area">

		<el-form ref="ruleFormRef" :model="state.metadataSet" :rules="IdSchmUseYn == 'Y' && metaIdSchmSettings.id_schm_object.typeModelId == model.typeModelId ? state.rules : state.idSchmNotUseRules" label-width="200px"
			class="demo-ruleForm" label-position="right">

			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 셋 등록</h3>
				</div>
				<div class="boxCnt">

					<el-form-item label="메타데이터 셋 ID">
						<el-input placeholder="자동 생성" disabled></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 유형 모델" prop="typeModelNm">
						<el-input v-model="state.metadataSet.typeModelNm" disabled></el-input>
					</el-form-item>					

					<el-form-item label="메타데이터 모델" prop="modelNm">
						<div class="inline-area">
							<el-input v-model="state.metadataSet.modelNm" disabled style="width: 250px" />
							<el-button type="default" class="ml15" @click="dialogVisibleModelSearch = true"><!-- 유형이 같은 모델을 선택할 수 있게 하자. 동일 모델만으로 요구 조건이 바뀔 경우는 다시 show 조건! v-show="props.modelDisabledYn !== 'Y'" -->
								<el-icon class="icon icon-search"></el-icon>
							</el-button>
							<el-button type="delete" @click="refreshModelInfo"><!-- 유형이 같은 모델을 선택할 수 있게 하자. 동일 모델만으로 요구 조건이 바뀔 경우는 다시 show 조건! v-show="props.modelDisabledYn !== 'Y'" -->
								<el-icon class="icon icon-refresh" />
							</el-button>
						</div>
						<el-dialog v-model="dialogVisibleModelSearch" title="모델 검색">
							<MetaDataModelSearchPage 
								:searchSttusCd="searchSttusCd" 
								:searchMode="searchMode"
								:typeModelId="state.metadataSet.typeModelId" 
								@selectedRow="selectedMetaDataModel" />
						</el-dialog>						
					</el-form-item>

					<el-form-item label="식별체계 - 국가코드" prop="idSchmCntryCd" v-show="IdSchmUseYn === 'Y' && metaIdSchmSettings.id_schm_object.typeModelId == model.typeModelId">
						<el-select 
								v-model="state.metadataSet.idSchmCntryCd"
								placeholder="선택">
								<el-option
									v-for="item in countryCodeList"
									:key="item.cntryCd"
									:label="item.cntryNm"
									:value="item.cntryCd"
								/>
              			</el-select>
					</el-form-item>

					<el-form-item label="식별체계 - 분류코드 종류" prop="idSchmType" v-show="IdSchmUseYn === 'Y' && metaIdSchmSettings.id_schm_object.typeModelId == model.typeModelId">
						<el-select 
								v-model="state.metadataSet.idSchmType"
								placeholder="선택"
								@change="typeChg()">
								<el-option
									v-for="item in idSchmObjectList"
									:key="item.mtcd"
									:label="item.mtcdNm"
									:value="item.mtcd"
								/>
              			</el-select>
					</el-form-item>

					<el-form-item label="식별체계 - 코드" prop="idSchmCd" v-show="IdSchmUseYn === 'Y' && metaIdSchmSettings.id_schm_object.typeModelId == model.typeModelId">
						<div class="inline-area">
							<el-input	v-model="state.metadataSet.idSchmCd"	disabled style="width: 100px" />
							<el-input	v-model="state.idSchmCdNm"	disabled style="width: 250px; margin-left: 5px;" />
							<el-button type="default" class="ml15" @click="codeSearchClick"><el-icon class="icon icon-search"/></el-button>
							<el-button type="delete" @click="refreshCodeInfo"><el-icon class="icon icon-refresh"/></el-button>
						</div>	
						<el-dialog v-model="dialogVisibleCodeSearch" :title="`식별체계 코드 검색 - ${state.idSchmTypeNm}`">
							<IdSchemeCodeSearchPage 
							:idSchmType="state.metadataSet.idSchmType" 
							@selectedRow="selectedIdSchmCd" />
						</el-dialog>
					</el-form-item>

					<el-form-item label="메타데이터 셋 명" prop="medataSetNm">
						<el-input v-model="state.metadataSet.medataSetNm"></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 셋 논리명" prop="medataSetLogicNm">
						<el-input v-model="state.metadataSet.medataSetLogicNm"></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 셋 설명" prop="medataSetDesc">
						<el-input v-model="state.metadataSet.medataSetDesc"></el-input>
					</el-form-item>

				</div>
			</div>

			<div class="boxLayout">
				<div class="boxTit">
					<h3>연결 메타데이터 셋 프라퍼티 (상위로 연결)</h3>
				</div>
				<div class="boxCnt">
					<el-form-item label="연결 메타데이터 셋" prop="cnctMedataSetNm">
						<div class="inline-area">
							<el-input v-model="state.metadataSet.cnctMedataSetNm" disabled style="width: 250px" />
							<el-button type="default" class="ml15" @click="popDialog('SearchMetadataSet')" v-show="props.cnctInfoDisabledYn !== 'Y'">
								<el-icon class="icon icon-search"></el-icon>
							</el-button>
							<el-button type="delete" @click="refreshSearchMetadataSetInfo" v-show="props.cnctInfoDisabledYn !== 'Y'">
								<el-icon class="icon icon-refresh" />
							</el-button>
						</div>
						<!-- 메타데이터 셋 검색 dialog : 전체 상태 , 해당 유형 모델만 조회 -->
						<el-dialog v-model="dialogVisibleSearchMetadataSet" title="메타데이터 셋 검색">
							<MetadataSetDialogSearch 
								searchSttusCd=""
								searchMode="all"
								@selectedRow="initUpperMetadataSetBySelectedInfo" />
						</el-dialog>
					</el-form-item>

					<el-form-item label="연결 프라퍼티" prop="cnctPrptyId">
						<el-select 
							v-model="state.metadataSet.cnctPrptyId"
							placeholder="선택"
							:disabled="props.cnctInfoDisabledYn === 'Y'" > 
							<el-option v-for="item in state.selectedUpperPrptyList" 
								:key="item.prptyId" 
								:label="`${item.prptyNm} ${item.prptyLogicNm}`" 
								:value="item.prptyId" />
						</el-select>
					</el-form-item>

				</div>
			</div>

		</el-form>

		<div class="btnSec taR mt20">
			<el-button type="primary" @click="editMetadataSetInfo">저장</el-button>
			<el-button type="default" @click="cancelDialog">취소</el-button>
		</div>
	</div>
</template>
<script setup>
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";
import MetadataSetDialogSearch from "@/components/meta/dt/MetadataSetDialogSearch.vue";
import IdSchemeCodeSearchPage from "@/views/feature/meta/stddata/idshemecommon/IdSchemeCodeSearchPage.vue";
import metaIdSchmSettings from "@/assets/json/metaIdSchmSettings.json";

import { ref, toRefs, reactive, defineEmits, defineProps, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties, isEmpty } from "@/assets/js/common.js";
import util from "util";

const emits = defineEmits(["editMetadataSetInfo", "cancelDialog"]);

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);
const IdSchmUseYn = ref(process.env.VUE_APP_METADATA_ID_SCHM_USE_YN);

const dialogVisibleModelSearch = ref(false);
const dialogVisibleCodeSearch = ref(false);
const searchSttusCd = "use"; //use 조건절 지정 (모델 검색 시 사용 상태만 select)
const searchMode = "objectType"; 

//메타데이터 셋 검색 modal (object type 선택 등록)
const dialogVisibleSearchMetadataSet = ref(false);

const props = defineProps({
	model: { // 메타데이터 관리에서 선택한 모델 정보
		type: Object,
		required: false,
		default: () => { return {
				modelId: "",
				modelNm: "",
				typeModelId: "",
				typeModelNm: "",	
			};
		}
	},	
	modelDisabledYn: {
		type: String,
		required: false,
		default: 'N',
	},
	cnctInfo: { // 연결 정보
		type: Object,
		required: false,
		default: () => { return {
				cnctMedataSetId: "",
				cnctMedataSetNm: "",
				cnctPrptyId: "",
			};
		}
	},
	cnctInfoDisabledYn: {
		type: String,
		required: false,
		default: 'N',
	},
	countryCodeList: { // 국가코드
		type: Array,
		required: false,
	},
	idSchmObjectList: {
		type: Array,
		required: false,
	},
});

const propsModel = toRefs(props).model;
watch(propsModel, (curr, prev) => {

	if (ruleFormRef.value) { ruleFormRef.value.resetFields(); } // 밸리데이션 초기화

	state.metadataSet.modelId = curr.modelId;
	state.metadataSet.modelNm = curr.modelNm;
	state.metadataSet.typeModelId = curr.typeModelId;
	state.metadataSet.typeModelNm = curr.typeModelNm;
	state.idSchmCdNm = "";
});

const propsCnct = toRefs(props).cnctInfo;
watch(propsCnct, (curr) => {
	state.metadataSet.cnctMedataSetId = curr.cnctMedataSetId;
	state.metadataSet.cnctMedataSetNm = curr.cnctMedataSetNm;
	// 콤보 조회 후 설정 되도록 함. state.metadataSet.cnctPrptyId = curr.cnctPrptyId;
	//선택값에 대한 프라퍼티 목록 set
	getUpperMetadataSetsPropertyList(curr.cnctMedataSetId, curr.cnctPrptyId);
});

const state = reactive({
	metadataSet: {
		modelId: props.model.modelId, // props.rangeModelId, //"", //모델 아이디 (=범위모델아이디)
		modelNm: props.model.modelNm,
		typeModelId: props.model.typeModelId,
		typeModelNm: props.model.typeModelNm,
		medataSetNm: "", //메타데이터 셋 명
		medataSetLogicNm: "", //메타데이터 셋 논리 명
		medataSetDesc: "", //메타데이터 셋 설명
		idSchmCntryCd: IdSchmUseYn.value == 'Y' && metaIdSchmSettings.id_schm_object.typeModelId == props.model.typeModelId ? "KR" : "",
		idSchmType: "",
		idSchmCd: "",
		idSchmUseYn: IdSchmUseYn.value, 
		cnctMedataSetId: props.cnctInfo.cnctMedataSetId, //연결 메타데이터 셋 ID (상위) -> prop을 통해 이전 화면부터 선택한 값 전송받기
		cnctMedataSetNm: props.cnctInfo.cnctMedataSetNm,
		cnctPrptyId: props.cnctInfo.cnctPrptyId, //연결 프라퍼티 ID (상위) -> prop을 통해 이전 화면부터 선택한 값 전송받기
	},
	idSchmCdNm: "",
	idSchmTypeNm: "",
	selectedUpperPrptyList: [], // 선택한 상위 메타데이터 셋에 연결된 프라퍼티 목록

	rules: {
    modelNm: [
      {
        required: true,
        message: "모델을 선택하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "모델 선택",
        trigger: "blur",
      },
    ], 
	idSchmCntryCd: [
		{
			required: true,
			message: "",
			trigger: "blur",
		},
    ],
	idSchmType: [
		{
			required: true,
			message: "",
			trigger: "blur",
		},
    ],
	idSchmCd: [
		{
			required: true,
			message: "코드를 선택하세요.",
			trigger: "blur",
		},
	], 
		medataSetNm: [
			{
				required: true,
        message: "메타데이터 셋 명을 입력하세요.",
        trigger: "blur",				
			},			
			{
				max: 128,
				message: "128자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		medataSetLogicNm: [
			{
				max: 128,
				message: "128자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		medataSetDesc: [
			{
				required: true,
				message: "메타데이터 셋 설명을 입력하세요.",
				trigger: "blur",				
			},
			{
				max: 1000,
				message: "1000자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
    cnctMedataSetNm: [
      {
        required: true,
        message: "연결 메타데이터 셋을 선택하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "연결 메타데이터 셋 선택",
        trigger: "blur",
      },
    ],		
		cnctPrptyId: [
			{
				required: true,
        message: "연결 프라퍼티를 선택하세요.",
        trigger: "blur",				
			},			
		],		
	},
	idSchmNotUseRules: {
    modelNm: [
      {
        required: true,
        message: "모델을 선택하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "모델 선택",
        trigger: "blur",
      },
    ],  
		medataSetNm: [
			{
				required: true,
        message: "메타데이터 셋 명을 입력하세요.",
        trigger: "blur",				
			},			
			{
				max: 128,
				message: "128자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		medataSetLogicNm: [
			{
				max: 128,
				message: "128자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		medataSetDesc: [
			{
				required: true,
				message: "메타데이터 셋 설명을 입력하세요.",
				trigger: "blur",				
			},
			{
				max: 1000,
				message: "1000자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
    cnctMedataSetNm: [
      {
        required: true,
        message: "연결 메타데이터 셋을 선택하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "연결 메타데이터 셋 선택",
        trigger: "blur",
      },
    ],		
		cnctPrptyId: [
			{
				required: true,
        message: "연결 프라퍼티를 선택하세요.",
        trigger: "blur",				
			},			
		],		
	}
});

onMounted(() => {
	if (props.cnctInfo.cnctMedataSetId) {
		// 콤보 조회 후 설정 되도록 함. 
		//선택값에 대한 프라퍼티 목록 set
		getUpperMetadataSetsPropertyList(props.cnctInfo.cnctMedataSetId, props.cnctInfo.cnctPrptyId);		
	}
});

const editMetadataSetInfo = async () => {

	let ruleForm = ruleFormRef.value;
	if (!ruleForm) return;

	await ruleForm.validate((valid, fields) => {
		if (!valid) { 
			alert("입력 정보를 다시 한번 확인해주세요."); 
			return;
		}

		let metadataSetInfo = {
			...state.metadataSet,
		};

		if (!confirm("저장하시겠습니까?")) return;

		$axios
			.post($apiUrls.meta.resource.metadatasets.createMetadataSet, metadataSetInfo)
			.then((res) => {
				alert("저장되었습니다.");				
				emits("editMetadataSetInfo", res.data.id, metadataSetInfo.medataSetNm); //등록 후 object_type 목록 재검색
			})
			.catch((err) => {

				console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("저장에 실패하였습니다.");
				}
			});

	});
};

const cancelDialog = () => {
	emits("cancelDialog");
};

const selectedMetaDataModel = (payload) => {
	state.metadataSet.modelId = payload.rowData.modelId;
	state.metadataSet.modelNm = payload.rowData.modelNm;
	state.metadataSet.typeModelId = payload.rowData.typeModelId;
	state.metadataSet.typeModelNm = payload.rowData.typeModelNm;	

	dialogVisibleModelSearch.value = false;
};

const refreshModelInfo = () => {
	state.metadataSet.modelId = ""; 
	state.metadataSet.modelNm = "";
	state.metadataSet.typeModelId = "";
	state.metadataSet.typeModelNm = "";
}

const popDialog = (dialogName) => {
	if ('SearchMetadataSet' === dialogName) {
		if (!state.metadataSet || !state.metadataSet.modelId) {
			alert('먼저 모델을 선택해 주세요.');
			return;
		}
		dialogVisibleSearchMetadataSet.value = true;
	}
}

const initUpperMetadataSetBySelectedInfo = (payload) => {
	let { medataSetId, medataSetNm } = payload.rowData;
	state.metadataSet.cnctMedataSetId = medataSetId;
	state.metadataSet.cnctMedataSetNm = medataSetNm;
	//선택값에 대한 프라퍼티 목록 set
	getUpperMetadataSetsPropertyList(medataSetId, '');
	dialogVisibleSearchMetadataSet.value = false;
};

const refreshSearchMetadataSetInfo = () => {
	state.metadataSet.cnctMedataSetId = ""; 
	state.metadataSet.cnctMedataSetNm = ""; 
	state.metadataSet.cnctPrptyId = ""; 

	state.selectedUpperPrptyList = []; // 선택한 상위 메타데이터 셋에 연결된 프라퍼티 목록
};

const getUpperMetadataSetsPropertyList = (medataSetId, cnctPrptyId) => {
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getModelInfoBySetId, medataSetId))
		.then((res) => {
			let propertyMap = res.data.propertyMap; //일반프라퍼티 정보가 object로 set되어있음
			selectedUpperPrptyList(propertyMap, cnctPrptyId);
		}).catch((err) => {
			console.log(err);
		});
};

const selectedUpperPrptyList = (propertyMap, cnctPrptyId) => {
	state.selectedUpperPrptyList = [];

	for (let property in propertyMap) {
		if ("Y" == propertyMap[property].setUsgPrptyYn || propertyMap[property].rangeTypeModelId != state.metadataSet.typeModelId ) continue;
		//destructuring and setting
		let { prptyId, prptyNm, prptyLogicNm } = propertyMap[property];
		let prptyOption = { prptyId, prptyNm, prptyLogicNm };
		state.selectedUpperPrptyList.push(prptyOption);
	}

	if (cnctPrptyId) {
		const idx = state.selectedUpperPrptyList.findIndex(x => x.prptyId === cnctPrptyId);
		if (idx != -1) {
			state.metadataSet.cnctPrptyId = state.selectedUpperPrptyList[idx].prptyId;
		} else {
			// 2023-09-21 현재 페이지에서 메타데이터ID 변경시 시간차로 watch 에서 cnctPrptyId 가 늦게 변경되면서 가끔 이 메시지가 뜸. 주석처리. alert(cnctPrptyId + ' 프라퍼티를 설정할 수 없습니다.'); // 이 경우는 나오면 이상한 것임.
			console.log(state.metadataSet.cnctMedataSetId + ' - ' + cnctPrptyId + ' 프라퍼티를 설정할 수 없습니다.');
		}
	} else if (state.selectedUpperPrptyList.length == 1) {
		state.metadataSet.cnctPrptyId = state.selectedUpperPrptyList[0].prptyId;
	}
};

const typeChg = () => {
	if(state.metadataSet.idSchmType === "1") {
		state.idSchmTypeNm = "물품"
	}
	if(state.metadataSet.idSchmType === "2") {
		state.idSchmTypeNm = "시설"
	}

	refreshCodeInfo();
};

const codeSearchClick = () => {
	if(state.metadataSet.idSchmType === ""){
		alert("분류코드 종류를 먼저 선택해주세요");
		return;
	}
	dialogVisibleCodeSearch.value = true;
};

const refreshCodeInfo = () => {
	state.metadataSet.idSchmCd = "";
	state.idSchmCdNm = "";
};


const selectedIdSchmCd = (payload) => {
	state.metadataSet.idSchmCd = payload.rowData.idSchmCd;
	state.idSchmCdNm = payload.rowData.idSchmCdNm;
	
	dialogVisibleCodeSearch.value = false;
};

</script>
<style lang="scss"></style>