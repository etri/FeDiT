<template>
	<div class="dialog-area">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>대리인 등록</h3>
			</div>
			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="state.agent" :rules="state.rules" label-width="200px" class="demo-ruleForm" label-position="right">
					<el-form-item label="대리인 ID" prop="agentId">
						<el-input v-model="state.agent.agentId" placeholder="자동생성" disabled></el-input>
					</el-form-item>

				<ComnFormItemInput2Btns label="메타데이터 모델" v-model="state.agent.agntModelId"
					@click-search="dialogVisibleModelSearch = true" 
					@click-refresh="refreshModelInfo" />
				<el-dialog v-model="dialogVisibleModelSearch" title="메타데이터 모델 검색">
					<MetaDataModelSearchPage 
						:searchSttusCd="searchSttusCd" 
						:searchMode="searchMode"
						:typeModelId="searchTypeModelId" 
						@selectedRow="selectedMetaDataModel" />
				</el-dialog>

					<el-form-item label="대리인명" prop="agntNm">
						<el-input v-model="state.agent.agntNm"></el-input>
					</el-form-item>

					<el-form-item label="대리인 설명" prop="agntDesc">
						<el-input v-model="state.agent.agntDesc"></el-input>
					</el-form-item>

					<el-form-item label="대리인 영문명" prop="agntEngNm">
						<el-input v-model="state.agent.agntEngNm"></el-input>
					</el-form-item>

					<el-form-item label="대리인 영문설명" prop="agntEngDesc">
						<el-input v-model="state.agent.agntEngDesc"></el-input>
					</el-form-item>

					<el-form-item label="대리인 전화번호" prop="agntTelNo">
						<el-input v-model="state.agent.agntTelNo"></el-input>
					</el-form-item>

					<el-form-item label="대리인 홈페이지" prop="agntHpage">
						<el-input v-model="state.agent.agntHpage"></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 셋 상태" prop="medataSetSttusMtcd">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-model="state.agent.medataSetSttusMtcd" placeholder="선택">
									<el-option v-for="item in dataStatusList" :key="item.mtcd" :label="item.mtcdNm" :value="item.mtcd" />
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>

				</el-form>
			</div>
		</div>
		<div class="btnSec taR mt20">
			<el-button type="primary" @click="EditAgentInfo">저장</el-button>
			<el-button type="default" @click="cancelDialog">취소</el-button>
		</div>
	</div>
</template>
<script setup>
import ComnFormItemInput2Btns from "@/components/common/ComnFormItemInput2Btns.vue";
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";

import { ref, reactive, defineEmits, defineProps } from "vue";
import { useRoute } from "vue-router";
import { getLoginUserId } from "@/assets/js/auth.js";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";
const emits = defineEmits(["editAgentInfo", "cancelDialog"]);

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);

const dialogVisibleModelSearch = ref(false);

//모델 검색 조건
const searchSttusCd = "use"; // (모델 검색 시 사용 상태만 select)
const searchMode = "std"; //"objectType";
const searchTypeModelId = "Agent";

const props = defineProps({
	dataStatusList: { // 대리인 데이터 상태코드리스트
		type: Array,
		required: false,
	}
});

const state = reactive({
	agent: {
		agntId: "",
		agntNm: "",
		agntModelId: "",
		agntModelNm: "",
		agntDesc: "",
		agntEngNm: "",
		agntEngDesc: "",
		agntTelNo: "",
		agntHpage: "",
		medataSetSttusMtcd: "use", // 등록 시, default value
	},
	rules: {
		agntModelId: [
			{
				max: 32,
				message: "32자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		agntNm: [
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			},
			{
			max: 128,
			message: "128자 이하만 가능합니다.",
			trigger: "blur",		
		}
		],
		medataSetSttusMtcd: [
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			}
		],
		agntDesc: [
			{
				max: 1000,
				message: "1000자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		agntTelNo: [
			{
				max: 30,
				message: "30자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		agntEngNm: [
			{
				max: 128,
				massage: "128자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		agntEngDesc: [
			{
				max: 1000,
				massage: "1000자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		agntHpage: [
			{
				max: 512,
				massage: "512자 이하만 가능합니다.",
				trigger: "blur",
			}
		]
	},
});

const EditAgentInfo = async () => {
	let ruleForm = ruleFormRef.value;
	if (!ruleForm) return;
	await ruleForm.validate((valid, fields) => {
		if (valid) {

			let agentInfo = {
				...state.agent,
				regr: getLoginUserId(),
			};

			$axios
				.post($apiUrls.meta.resource.agent.createAgent, agentInfo)
				.then(() => {
					alert("대리인 등록이 완료되었습니다.");
					resetAgentData();
					emits("editAgentInfo");
				})
				.catch((err) => {

					console.log(err);
					if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
						alert(err.response.data.message);
					} else {
						alert("대리인 등록에 실패하였습니다.");
					}
				});
		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
};

const resetAgentData = () => {
	state.agent.agntId = "";
	state.agent.agntNm = "";
	state.agent.agntModelId = "";
	state.agent.agntModelNm = "";
	state.agent.agntDesc = "";
	state.agent.agntEngNm = "";
	state.agent.agntEngDesc = "";
	state.agent.agntTelNo = "";
	state.agent.agntHpage = "";
	state.agent.medataSetSttusMtcd = "use"; //등록 시, default value
};

const refreshModelInfo = () => {	
	state.agent.agntModelId = "";
	state.agent.agntModelNm = "";
};

const selectedMetaDataModel = (payload) => {
	console.log(payload);
	let { modelId, modelNm } = payload.rowData;
	state.agent.agntModelId = modelId;
	state.agent.agntModelNm = modelNm;
	dialogVisibleModelSearch.value = false;
};

const cancelDialog = () => {
	emits("cancelDialog");
};
</script>
<style lang="scss"></style>
