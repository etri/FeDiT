<template>
	<div class="dialog-area">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>디지털트윈 등록</h3>
			</div>
			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="state.metadataSet" :rules="state.rules" label-width="200px"
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
							<el-button type="delete" @click="refreshModelInfo"><el-icon class="icon icon-refresh"/></el-button>
						</div>			
						<el-dialog v-model="dialogVisibleModelSearch" title="메타데이터 셋 검색">
							<MetaDataModelSearchPage 
								:searchSttusCd="searchSttusCd" 
								:searchMode="searchMode"
								:typeModelId="searchTypeModelId" 
								@selectedRow="selectedMetaDataModel" />
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

import { ref, toRefs, reactive, defineEmits, defineProps, watch } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties, isEmpty } from "@/assets/js/common.js";

const emits = defineEmits(["editMetadataSetInfo", "cancelDialog"]);

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);

const dialogVisibleModelSearch = ref(false);
const searchSttusCd = "use"; //use 조건절 지정 (모델 검색 시 사용 상태만 select)
const searchMode = "all"; 
const searchTypeModelId = "DigitalTwin";

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
	},
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

const refreshModelInfo = () => {
	state.metadataSet.modelId = "";
	state.metadataSet.modelNm = "";
	state.metadataSet.typeModelId = "";
	state.metadataSet.typeModelNm = "";
};

</script>
<style lang="scss"></style>