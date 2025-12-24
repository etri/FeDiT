<template>
	<div class="dialog-area">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>식별체계 - 객체 - 물품 코드 정보</h3>
			</div>

			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="state.productCode" :rules="state.rules" label-width="200px"
					class="demo-ruleForm" label-position="right">

					<el-form-item label="식별체계 코드" prop="idSchmCd">
						<div class="inline-area">
							<el-input v-model="state.productCode.idSchmCd" disabled />
							<el-button type="primary" plain class="ml15" @click="duplicateChk()">중복 확인</el-button>
						</div>
					</el-form-item>

					<el-form-item label="원본 외부 코드 (최대 5자리)" prop="originExtrCd">
						<el-input v-model="state.productCode.originExtrCd" maxlength="5" @keyup="chgExtrCd()"/>
					</el-form-item>

					<el-form-item label="식별체계 코드 명" prop="idSchmCdNm">
						<el-input v-model="state.productCode.idSchmCdNm" />
					</el-form-item>

					<el-form-item label="식별체계 코드 영문 명" prop="idSchmCdEngNm">
						<el-input v-model="state.productCode.idSchmCdEngNm" />
					</el-form-item>

					<el-form-item label="식별체계 코드 설명" prop="idSchmCdDesc">
						<el-input v-model="state.productCode.idSchmCdDesc" />
					</el-form-item>

					<el-form-item label="사용 여부" prop="useYn">
						<el-select 
							v-model="state.productCode.useYn"
							placeholder="선택">
							<el-option key="Y" label="Y" value="Y"/>
							<el-option key="N" label="N" value="N"/>
						</el-select>
					</el-form-item>

					<el-form-item label="식별 사용 여부" prop="idfyUseYn">
						<el-select 
							class="w30"
							v-model="state.productCode.idfyUseYn"
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
			<el-button type="primary" @click="editProductCodeInfo">저장</el-button>
			<el-button type="default" @click="resetProductCode">취소</el-button>
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

const emits = defineEmits(["editProductCodeInfo", "cancelDialog"]);

const props = defineProps({
	dataStatusList: { //데이터 상태코드리스트
		type: Array,
		required: false,
	}
});

const state = reactive({
	duplYn: false,
	productCode: {
		idSchmCd: "",
		cdSizeDivMtcd: "",
		lctgExtrCd: "",
		originExtrCd: "",
		idSchmCdNm: "",
		idSchmCdEngNm: "",
		idSchmCdDesc: "",
		useYn: "Y",
		idfyUseYn: "Y"
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

const editProductCodeInfo = async () => {
	if(!state.duplYn){
		alert("식별체계 코드 중복 확인을 진행해주세요.");
		return;
	}
	let ruleForm = ruleFormRef.value;
	if (!ruleForm) return;
	await ruleForm.validate((valid, fields) => {
		if (valid) {

			let productCode = { ...state.productCode };

			$axios
				.post($apiUrls.meta.schema.idschemecode.createProductCode, productCode)
				.then(() => {
					alert("물품 코드 등록이 완료되었습니다.");
					resetProductCode();
					emits("editProductCodeInfo");
				})
				.catch((err) => {

					console.log(err);
					if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
						alert(err.response.data.message);
					} else {
						alert("물품 코드 등록에 실패하였습니다.");
					}
				});
		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
};

const duplicateChk = () => {
	if(state.productCode.idSchmCd === "") {
		alert("외부 코드를 입력하여 식별체계 코드를 생성해주세요.");
		return;
	}
	$axios
		.get($apiUrls.meta.schema.idschemecode.getIdSchemeProductCodeList, {
			params: {
				curPage: 1,
				idSchmCd: state.productCode.idSchmCd
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

	state.productCode.idSchmCd = state.productCode.originExtrCd;
};

const cancelDialog = () => {
	emits("cancelDialog");
};

const resetProductCode = () => {
	state.duplYn = false;
	state.productCode.idSchmCd = "";
	state.productCode.originExtrCd = "";
	state.productCode.idSchmCdNm = "";
	state.productCode.idSchmCdEngNm = "";
	state.productCode.idSchmCdDesc = "";
	state.productCode.useYn = "Y";
	state.productCode.idfyUseYn = "N";
	cancelDialog();
};

</script>
<style lang="scss"></style>