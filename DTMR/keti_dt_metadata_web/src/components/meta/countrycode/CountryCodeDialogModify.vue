<template>
	<div class="dialog-area" id="codePopup">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>{{ curTitle }}</h3>
			</div>
			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="countryCode" :rules="rules" label-width="200px" class="demo-ruleForm" label-position="right">

					<el-form-item label="국가코드" prop="cntryCd">
						<el-input v-model="countryCode.cntryCd" disabled />
					</el-form-item>

					<el-form-item label="국가명" prop="cntryNm">
						<el-input v-bind:disabled="curPage != 'modify'" v-model="countryCode.cntryNm" />
					</el-form-item>

					<el-form-item label="국가 영문명" prop="cntryEngNm">
						<el-input v-bind:disabled="curPage != 'modify'" v-model="countryCode.cntryEngNm" />
					</el-form-item>

					<el-form-item label="국가 숫자" prop="cntryNumb">
						<el-input v-bind:disabled="curPage != 'modify'" v-model="countryCode.cntryNumb" placeholder="3자리 입력"/>
					</el-form-item>

					<el-form-item label="국가 알파3" prop="cntryAlpha3">
						<el-input v-bind:disabled="curPage != 'modify'" v-model="countryCode.cntryAlpha3" placeholder="3자리 입력"/>
					</el-form-item>

					<el-form-item label="데이터 상태" prop="cntryDataSttusMtcd">
						<el-select v-bind:disabled="curPage != 'modify'" v-model="countryCode.cntryDataSttusMtcd"
							@change="changeCntryDataSttusMtcd" placeholder="선택">
							<el-option v-for="item in dataStatusList" :key="item.mtcd" :label="item.mtcdNm" :value="item.mtcd" />
						</el-select>
					</el-form-item>

				</el-form>
			</div>
		</div>

		<div class="btnSec taR mt20">
			<el-button type="primary" v-if="isAmdYn(route.meta.auth) && curPage == 'modify'" 
				@click="modifyCountryCodeInfo">저장</el-button>
			<el-button type="default" @click="cancelDialog">취소</el-button>
		</div>

	</div>
</template>
<script setup>
import { ref, defineProps, defineEmits } from "vue";
import { useRoute } from "vue-router";
import { isAmdYn } from "@/assets/js/common.js";

const route = useRoute();

const props = defineProps({
	countryCode: {
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
	dataStatusList: {
		type: Array,
		required: false,
	},
});

const emits = defineEmits(["modifyCountryCodeInfo", "cancelModifyDialog"]);

const ruleFormRef = ref(null);

const rules = ref({
	cntryCd: [
		{
			required: true,
			message: "내용을 입력하세요.",
			trigger: "blur",
		},
		{
			max: 2,
			message: "2자 이하만 가능합니다.",
			trigger: "blur",
		}
	],
	cntryNm: [
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
	cntryDataSttusMtcd: [
		{
			required: true,
			message: "내용을 선택하세요.",
			trigger: "blur",
		}
	],
	cntryNumb: [
		{
			max: 3,
			message: "3자 이하만 가능합니다.",
			trigger: "blur",
		}
	],
	cntryAlpha3: [
		{
			max: 3,
			message: "3자 이하만 가능합니다.",
			trigger: "blur",
		}
	]	
});

const modifyCountryCodeInfo = async () => {
	emits("modifyCountryCodeInfo", { data: props.countryCode, ruleFormRef });
};

const changeCntryDataSttusMtcd = (data) => {
	props.countryCode.cntryDataSttusMtcd = data;
};

const cancelDialog = () => {
	emits("cancelModifyDialog");
};

</script>
<style lang="scss"></style>