<template>
	<div class="dialog-area" id="codePopup">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>{{ curTitle }}</h3>
			</div>
			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="agent" :rules="rules" label-width="280px" class="demo-ruleForm" label-position="right">
					<el-form-item label="대리인 ID" prop="agentId">
						<el-input v-model="agent.agntId" disabled></el-input>
					</el-form-item>

					<ComnFormItemInput2Btns label="메타데이터 모델" v-model="agent.agntModelId"
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
						<el-input v-bind:disabled="curPage != 'modify'" v-model="agent.agntNm"></el-input>
					</el-form-item>

					<el-form-item label="대리인 설명" prop="agntDesc">
						<el-input v-bind:disabled="curPage != 'modify'" v-model="agent.agntDesc"></el-input>
					</el-form-item>

					<el-form-item label="대리인 영문명" prop="agntEngNm">
						<el-input v-bind:disabled="curPage != 'modify'" v-model="agent.agntEngNm"></el-input>
					</el-form-item>

					<el-form-item label="대리인 영문설명" prop="agntEngDesc">
						<el-input v-bind:disabled="curPage != 'modify'" v-model="agent.agntEngDesc"></el-input>
					</el-form-item>

					<el-form-item label="대리인 전화번호" prop="agntTelNo">
						<el-input v-bind:disabled="curPage != 'modify'" v-model="agent.agntTelNo"></el-input>
					</el-form-item>

					<el-form-item label="대리인 홈페이지" prop="agntHpage">
						<el-input v-bind:disabled="curPage != 'modify'" v-model="agent.agntHpage"></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 셋 상태" prop="medataSetSttusMtcd">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-bind:disabled="curPage != 'modify'" v-model="agent.medataSetSttusMtcd" placeholder="선택">
									<el-option v-for="item in dataStatusList" :key="item.mtcd" :label="item.mtcdNm" :value="item.mtcd" />
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>

				</el-form>
			</div>
		</div>
		<div class="btnSec taR mt20">
			<el-button type="primary" v-if="isAmdYn(route.meta.auth) && curPage == 'modify'" 
				@click="modifyAgentInfo">저장</el-button>

			<el-button type="primary" plain v-if="isDelYn(route.meta.auth) && curPage == 'modify'"
				@click="deleteAgentInfo">삭제</el-button>
			<el-button type="default" @click="cancelDialog">취소</el-button>
		</div>
	</div>
</template>
<script setup>
import ComnFormItemInput2Btns from "@/components/common/ComnFormItemInput2Btns.vue";
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";

import { ref, defineProps, defineEmits } from "vue";
import { useRoute } from "vue-router";
import { isAmdYn, isDelYn } from "@/assets/js/common.js";

const route = useRoute();

const dialogVisibleModelSearch = ref(false);

//모델 검색 조건
const searchSttusCd = "use"; // (모델 검색 시 사용 상태만 select)
const searchMode = "std"; //"objectType";
const searchTypeModelId = "Agent";

const props = defineProps({
	dataStatusList: {
		type: Array,
		required: false,
	},
	agent: {
		type: Object,
		required: true,
	},
	curPage: {
		type: String,
		required: false,
	},
	curTitle: {
		type: String,
		required: false,
	},
	curPage: {
		type: String,
		required: false,
	}
});

const emits = defineEmits([
	"cancelModifyDialog",
	"modifyAgentInfo",
	"deleteAgentInfo",
]);

const ruleFormRef = ref(null);

const rules = ref({
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
});

const cancelDialog = () => {
	emits("cancelModifyDialog");
};

const modifyAgentInfo = async () => {
	emits("modifyAgentInfo", { data: props.agent, ruleFormRef });
};

const deleteAgentInfo = () => {
	emits("deleteAgentInfo", { data: props.agent });
};

const selectedMetaDataModel = (payload) => {
	console.log(payload);
	let { modelId, modelNm } = payload.rowData;
	props.agent.agntModelId = modelId;
	props.agent.agntModelNm = modelNm;
	dialogVisibleModelSearch.value = false;
};

const refreshModelInfo = () => {	
	props.agent.agntModelId = "";
	props.agent.agntModelNm = "";
};

</script>
<style lang="scss"></style>
