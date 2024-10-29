<template>
	<div class="dialog-area">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>식별체계 - 표준산업분류 코드 정보</h3>
			</div>

			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="state.ksicCode" :rules="state.rules" label-width="200px"
					class="demo-ruleForm" label-position="right">

					<el-form-item label="식별체계 코드" prop="idSchmCd">
						<div class="inline-area">
							<el-input v-model="state.ksicCode.idSchmCd" disabled />
							<el-button type="primary" plain class="ml15" @click="duplicateChk()">중복 확인</el-button>
						</div>
					</el-form-item>

					<el-form-item label="코드 크기 구분" prop="cdSizeDivMtcd">
						<el-select 
							v-model="state.ksicCode.cdSizeDivMtcd"
							placeholder="선택"
							@change="chgExtrCd()">
							<el-option
								v-for="item in dataStatusList"
								:key="item.mtcd"
								:label="item.mtcdNm"
								:value="item.mtcd"
							/>
						</el-select>
					</el-form-item>

					<el-form-item label="대분류 외부 코드 (1자리)" prop="lctgExtrCd">
						<el-input v-model="state.ksicCode.lctgExtrCd" maxlength="1" @keyup="chgExtrCd()"/>
					</el-form-item>

					<el-form-item label="원본 외부 코드 (최대 5자리)" prop="originExtrCd" :required="state.ksicCode.cdSizeDivMtcd !== 'l'">
						<el-input v-model="state.ksicCode.originExtrCd" maxlength="5" @keyup="chgExtrCd()" :disabled="state.ksicCode.cdSizeDivMtcd === 'l'"/>
					</el-form-item>

					<el-form-item label="식별체계 코드 명" prop="idSchmCdNm">
						<el-input v-model="state.ksicCode.idSchmCdNm" />
					</el-form-item>

					<el-form-item label="식별체계 코드 영문 명" prop="idSchmCdEngNm">
						<el-input v-model="state.ksicCode.idSchmCdEngNm" />
					</el-form-item>

					<el-form-item label="식별체계 코드 설명" prop="idSchmCdDesc">
						<el-input v-model="state.ksicCode.idSchmCdDesc" />
					</el-form-item>

					<el-form-item label="사용 여부" prop="useYn">
						<el-select 
							v-model="state.ksicCode.useYn"
							placeholder="선택">
							<el-option key="Y" label="Y" value="Y"/>
							<el-option key="N" label="N" value="N"/>
						</el-select>
					</el-form-item>

					<el-form-item label="식별 사용 여부" prop="idfyUseYn">
						<el-select 
							class="w30"
							v-model="state.ksicCode.idfyUseYn"
							placeholder="선택"
							disabled>
							<el-option key="Y" label="Y (ID 생성에 사용됨)" value="Y"/>
							<el-option key="N" label="N (ID 생성에 사용되지 않음)" value="N"/>
						</el-select>
					</el-form-item>

				</el-form>
			</div>
		</div>

		<div class="btnSec taR mt20">
			<el-button type="primary" @click="editKsicCodeInfo">저장</el-button>
			<el-button type="default" @click="resetKsicCode">취소</el-button>
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

const emits = defineEmits(["editKsicCodeInfo", "cancelDialog"]);

const props = defineProps({
	dataStatusList: { //데이터 상태코드리스트
		type: Array,
		required: false,
	}
});

const state = reactive({
	duplYn: false,
	ksicCode: {
		idSchmCd: "",
		cdSizeDivMtcd: "",
		lctgExtrCd: "",
		originExtrCd: "",
		idSchmCdNm: "",
		idSchmCdEngNm: "",
		idSchmCdDesc: "",
		useYn: "Y",
		idfyUseYn: "N"
	},
	rules: {
		idSchmCd: [
			{
				required: true,
				// message: "외부 코드를 입력하여 생성해주세요.",
				message: "",
				trigger: "blur",
			}
		],
		cdSizeDivMtcd: [
			{
				required: true,
				// message: "내용을 선택하세요.",
				message: "",
				trigger: "blur",
			}
		],
		lctgExtrCd: [
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			},
			{
				max: 1,
				message: "1글자만 가능합니다.",
				trigger: "blur",
			}
		],
		originExtrCd: [
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			},
			{
				max: 5,
				message: "5글자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		idSchmCdNm: [
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			}
		],
		useYn: [
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			}
		],
		idfyUseYn: [
			{
				required: true,
				// message: "내용을 선택하세요.",
				message: "",
				trigger: "blur",
			}
		],
	}
});

const editKsicCodeInfo = async () => {
	if(!state.duplYn){
		alert("식별체계 코드 중복 확인을 진행해주세요.");
		return;
	}
	let ruleForm = ruleFormRef.value;
	if (!ruleForm) return;
	await ruleForm.validate((valid, fields) => {
		if (valid) {

			let ksicCode = { ...state.ksicCode };

			$axios
				.post($apiUrls.meta.schema.idschemecode.createKsicCode, ksicCode)
				.then(() => {
					alert("표준산업분류 코드 등록이 완료되었습니다.");
					resetKsicCode();
					emits("editKsicCodeInfo");
				})
				.catch((err) => {

					console.log(err);
					if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
						alert(err.response.data.message);
					} else {
						alert("표준산업분류 코드 등록에 실패하였습니다.");
					}
				});
		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
};

const duplicateChk = () => {
	if(state.ksicCode.idSchmCd === "" || state.ksicCode.lctgExtrCd === "") {
		alert("외부 코드를 입력하여 식별체계 코드를 생성해주세요.");
		return;
	}
	$axios
		.get($apiUrls.meta.schema.idschemecode.getIdSchemeStdIndCodeList, {
			params: {
				curPage: 1,
				idSchmCd: state.ksicCode.idSchmCd
			},
		})
		.then((res) => {
			if(res.data.page.totalListSize === 0) {
				alert("사용 가능한 식별체계 코드입니다.");
				state.duplYn = true;
			}
			else {
				alert("이미 사용 중인 식별체계 코드입니다.");
				state.duplYn = false;
			}
		})
		.catch((err) => {
			console.log(err);
		});
};

const chgExtrCd = () => {
	state.duplYn = false;

	if(state.ksicCode.lctgExtrCd !== "") {
		if(state.ksicCode.cdSizeDivMtcd === "l") { // 대분류
			state.ksicCode.idSchmCd = state.ksicCode.lctgExtrCd;
			state.ksicCode.originExtrCd = "";
		}
		else{
			state.ksicCode.idSchmCd = state.ksicCode.lctgExtrCd + state.ksicCode.originExtrCd;
		}
	}
	else {
		state.ksicCode.idSchmCd = "";
	}

	if(state.ksicCode.cdSizeDivMtcd === "dd") {
		state.ksicCode.idfyUseYn = "Y";
	}
	else {
		state.ksicCode.idfyUseYn = "N";
	}
};

const cancelDialog = () => {
	emits("cancelDialog");
};

const resetKsicCode = () => {
	state.duplYn = false;
	state.ksicCode.idSchmCd = "";
	state.ksicCode.cdSizeDivMtcd = "";
	state.ksicCode.lctgExtrCd = "";
	state.ksicCode.originExtrCd = "";
	state.ksicCode.idSchmCdNm = "";
	state.ksicCode.idSchmCdEngNm = "";
	state.ksicCode.idSchmCdDesc = "";
	state.ksicCode.useYn = "Y";
	state.ksicCode.idfyUseYn = "N";
	cancelDialog();
};

</script>
<style lang="scss"></style>