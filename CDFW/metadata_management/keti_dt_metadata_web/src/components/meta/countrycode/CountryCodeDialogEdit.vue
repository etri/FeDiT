<template>
	<div class="dialog-area">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>국가코드 등록</h3>
			</div>

			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="state.countryCode" :rules="state.rules" label-width="200px"
					class="demo-ruleForm" label-position="right">

					<el-form-item label="국가코드" prop="cntryCd">
						<el-input v-model="state.countryCode.cntryCd" placeholder="대문자 2자리 입력" />
					</el-form-item>

					<el-form-item label="국가명" prop="cntryNm">
						<el-input v-model="state.countryCode.cntryNm" />
					</el-form-item>

					<el-form-item label="국가 영문명" prop="cntryEngNm">
						<el-input v-model="state.countryCode.cntryEngNm" />
					</el-form-item>

					<el-form-item label="국가 숫자" prop="cntryNumb">
						<el-input v-model="state.countryCode.cntryNumb" placeholder="3자리 입력"/>
					</el-form-item>

					<el-form-item label="국가 알파3" prop="cntryAlpha3">
						<el-input v-model="state.countryCode.cntryAlpha3" placeholder="3자리 입력"/>
					</el-form-item>

					<el-form-item label="데이터 상태" prop="cntryDataSttusMtcd">
						<el-select v-model="state.countryCode.cntryDataSttusMtcd" @change="changeCntryDataSttusMtcd" placeholder="선택">
							<el-option v-for="item in dataStatusList" :key="item.mtcd" :label="item.mtcdNm" :value="item.mtcd" />
						</el-select>
					</el-form-item>

				</el-form>
			</div>
		</div>

		<div class="btnSec taR mt20">
			<el-button type="primary" @click="editCountryCodeInfo">저장</el-button>
			<el-button type="default" @click="cancelDialog">취소</el-button>
		</div>
	</div>
</template>
<script setup>
import { ref, reactive, defineEmits, defineProps } from "vue";
import { useRoute } from "vue-router";
import { getLoginUserId } from "@/assets/js/auth.js";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);

const emits = defineEmits(["editCountryCodeInfo", "cancelDialog"]);

const props = defineProps({
	dataStatusList: { //데이터 상태코드리스트
		type: Array,
		required: false,
	}
});

const state = reactive({
	countryCode: {
		cntryCd: "",
		cntryNm: "",
		cntryEngNm: "",
		cntryNumb: "",
		cntryAlpha3: "",
		cntryAlpha2: "",
		cntryDataSttusMtcd: "use",
	},
	rules: {
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
	}
});

const editCountryCodeInfo = async () => {
	let ruleForm = ruleFormRef.value;
	if (!ruleForm) return;
	await ruleForm.validate((valid, fields) => {
		if (valid) {

			state.countryCode.cntryAlpha2 = state.countryCode.cntryCd;
			let countryCodeInfo = { ...state.countryCode };

			$axios
				.post($apiUrls.meta.portal.countrycode.createCountryCode, countryCodeInfo)
				.then(() => {
					alert("국가코드 등록이 완료되었습니다.");
					resetCountryCode();
					emits("editCountryCodeInfo");
				})
				.catch((err) => {

					console.log(err);
					if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
						alert(err.response.data.message);
					} else {
						alert("국가코드 등록에 실패하였습니다.");
					}
				});
		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
};

const changeCntryDataSttusMtcd = (data) => {
	state.countryCode.cntryDataSttusMtcd = data;
};

const resetCountryCode = () => {
	state.countryCode.cntryCd = "";
	state.countryCode.cntryNm = "";
	state.countryCode.cntryEngNm = "";
	state.countryCode.cntryNumb = "";
	state.countryCode.cntryAlpha3 = "";
	state.countryCode.cntryAlpha2 = "";
	state.countryCode.cntryDataSttusMtcd = "use";
};

const cancelDialog = () => {
	emits("cancelDialog");
};

</script>
<style lang="scss"></style>