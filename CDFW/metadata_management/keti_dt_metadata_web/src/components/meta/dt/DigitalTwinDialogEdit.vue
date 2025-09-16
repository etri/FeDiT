<template>
	<div class="dialog-area">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>디지털트윈 등록</h3>
			</div>
			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="state.metadataSet" :rules="IdSchmUseYn == 'Y' ? state.rules : state.idSchmNotUseRules" label-width="200px"
					class="demo-ruleForm" label-position="right">

					<el-form-item label="디지털트윈 ID">
						<el-input placeholder="자동 생성" disabled></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 유형" prop="typeModelNm">
						<el-input v-model="state.metadataSet.typeModelNm" disabled></el-input>
					</el-form-item>						

					<el-form-item label="메타데이터 모델" prop="modelNm">
						<div class="inline-area">
							<el-input	v-model="state.metadataSet.modelNm"	disabled style="width: 250px" />
							<el-button type="default" class="ml15" @click="dialogVisibleModelSearch = true"><el-icon class="icon icon-search"/></el-button>
							<el-button type="default" class="el-button--delete" @click="refreshModelInfo"><el-icon class="icon icon-refresh"/></el-button>
						</div>			
						<el-dialog v-model="dialogVisibleModelSearch" title="메타데이터 셋 검색">
							<MetaDataModelSearchPage 
								:searchSttusCd="searchSttusCd" 
								:searchMode="searchMode"
								:typeModelId="searchTypeModelId" 
								@selectedRow="selectedMetaDataModel" />
						</el-dialog>									
					</el-form-item>

					<el-form-item label="식별체계 - 국가코드" prop="idSchmCntryCd" v-show="IdSchmUseYn === 'Y'">
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

					<el-form-item label="식별체계 - 분류코드 종류" prop="idSchmType" v-show="IdSchmUseYn === 'Y'">
						<el-select 
								v-model="state.metadataSet.idSchmType"
								placeholder="선택"
								@change="typeChg()">
								<el-option
									v-for="item in idSchmDtList"
									:key="item.mtcd"
									:label="item.mtcdNm"
									:value="item.mtcd"
								/>
              			</el-select>
					</el-form-item>

					<el-form-item label="식별체계 - 코드" prop="idSchmCd" v-show="IdSchmUseYn === 'Y'">
						<div class="inline-area">
							<el-input	v-model="state.metadataSet.idSchmCd"	disabled style="width: 100px" />
							<el-input	v-model="state.idSchmCdNm"	disabled style="width: 250px; margin-left: 5px;" />
							<el-button type="default" class="ml15" @click="codeSearchClick"><el-icon class="icon icon-search"/></el-button>
							<el-button type="default" class="el-button--delete" @click="refreshCodeInfo"><el-icon class="icon icon-refresh"/></el-button>
						</div>	
						<el-dialog v-model="dialogVisibleCodeSearch" :title="`식별체계 코드 검색 - ${state.idSchmTypeNm}`">
							<IdSchemeCodeSearchPage 
							:idSchmType="state.metadataSet.idSchmType" 
							@selectedRow="selectedIdSchmCd" />
						</el-dialog>
					</el-form-item>

					<el-form-item label="디지털트윈 명" prop="medataSetNm">
						<el-input v-model="state.metadataSet.medataSetNm"></el-input>
					</el-form-item>

					<el-form-item label="디지털트윈 논리명" prop="medataSetLogicNm">
						<el-input v-model="state.metadataSet.medataSetLogicNm"></el-input>
					</el-form-item>

					<el-form-item label="디지털트윈 설명" prop="medataSetDesc">
						<el-input v-model="state.metadataSet.medataSetDesc"></el-input>
					</el-form-item>					

				</el-form>
			</div>
		</div>

		<div class="btnSec taR mt20">
			<el-button type="primary" @click="editMetadataSetInfo">저장</el-button>
			<el-button type="default" @click="cancelDialog">취소</el-button>
		</div>
	</div>
</template>
<script setup>
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";
import IdSchemeCodeSearchPage from "@/views/feature/meta/stddata/idshemecommon/IdSchemeCodeSearchPage.vue";
import metaIdSchmSettings from "@/assets/json/metaIdSchmSettings.json";

import { ref, toRefs, reactive, defineEmits, defineProps, watch } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties, isEmpty } from "@/assets/js/common.js";

const emits = defineEmits(["editMetadataSetInfo", "cancelDialog"]);

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);

const dialogVisibleModelSearch = ref(false);
const dialogVisibleCodeSearch = ref(false);
const searchSttusCd = "use"; //use 조건절 지정 (모델 검색 시 사용 상태만 select)
const searchMode = "all"; 
const searchTypeModelId = "DigitalTwin";

const IdSchmUseYn = ref(process.env.VUE_APP_METADATA_ID_SCHM_USE_YN);

const props = defineProps({
	model: {
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
	countryCodeList: { // 국가코드
		type: Array,
		required: false,
	},
	idSchmDtList: {
		type: Array,
		required: false,
	},
})

const propsModel = toRefs(props).model;
watch(propsModel, (curr, prev) => {

	if (ruleFormRef.value) { ruleFormRef.value.resetFields(); }

	state.metadataSet.modelId = curr.modelId;
	state.metadataSet.modelNm = curr.modelNm;
	state.metadataSet.typeModelId = curr.typeModelId;
	state.metadataSet.typeModelNm = curr.typeModelNm;
});

const state = reactive({
	metadataSet: {
		modelId: props.model.modelId,
		modelNm: props.model.modelNm,
		typeModelId: props.model.typeModelId,
		typeModelNm: props.model.typeModelNm,
		medataSetNm: "",
		medataSetLogicNm: "",
		medataSetDesc: "",
		idSchmCntryCd: IdSchmUseYn.value == 'Y' ? "KR" : "",
		idSchmType: "",
		idSchmCd: "",
		idSchmUseYn: IdSchmUseYn.value,
	},
	idSchmCdNm: "",
	idSchmTypeNm: "",
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
        message: "디지털트윈 명을 입력하세요.",
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
				message: "디지털트윈 설명을 입력하세요.",
				trigger: "blur",				
			},			
			{
				max: 1000,
				message: "1000자 이하만 가능합니다.",
				trigger: "blur",
			}
		]
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
        message: "디지털트윈 명을 입력하세요.",
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
				message: "디지털트윈 설명을 입력하세요.",
				trigger: "blur",				
			},			
			{
				max: 1000,
				message: "1000자 이하만 가능합니다.",
				trigger: "blur",
			}
		]
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

		if(IdSchmUseYn.value === 'Y') {
			if(state.metadataSet.typeModelId !== metaIdSchmSettings.id_schm_dt.typeModelId) { // == DigitalTwin
				alert("디지털트윈 식별체계에 알맞지 않은 메타데이터 유형입니다.\n\n설정된 메타데이터 유형 : " + metaIdSchmSettings.id_schm_dt.typeModelId);
				return;
			}
		}

		let metadataSetInfo = {
			...state.metadataSet,
		};

		if (!confirm("저장하시겠습니까?")) return;

		$axios
			.post($apiUrls.meta.resource.metadatasets.createMetadataSet, metadataSetInfo)
			.then((res) => {
				alert("저장되었습니다.");
				emits("editMetadataSetInfo", res.data.id);
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

const selectedIdSchmCd = (payload) => {
	state.metadataSet.idSchmCd = payload.rowData.idSchmCd;
	state.idSchmCdNm = payload.rowData.idSchmCdNm;
	
	dialogVisibleCodeSearch.value = false;
};


const refreshModelInfo = () => {
    state.metadataSet.modelId = "";
    state.metadataSet.modelNm = "";
    state.metadataSet.typeModelId = "";
    state.metadataSet.typeModelNm = "";
}

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

const typeChg = () => {
	if(state.metadataSet.idSchmType === "01") {
		state.idSchmTypeNm = "표준산업분류체계"
	}
	if(state.metadataSet.idSchmType === "02") {
		state.idSchmTypeNm = "공공자원분류체계"
	}

	refreshCodeInfo();
};

</script>
<style lang="scss"></style>