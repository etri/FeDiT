<template>
	<div class="dialog-area">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>코드 등록</h3>
			</div>
			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="state.metaCode" :rules="state.rules" label-width="200px"
					class="demo-ruleForm" label-position="right">

					<el-form-item label="코드" prop="mtcd">
						<el-input v-model="state.metaCode.mtcd"></el-input>
					</el-form-item>

					<el-form-item label="코드 명" prop="mtcdNm">
						<el-input v-model="state.metaCode.mtcdNm"></el-input>
					</el-form-item>

					<el-form-item label="코드 설명" prop="mtcdDesc">
						<el-input v-model="state.metaCode.mtcdDesc"></el-input>
					</el-form-item>

          			<el-form-item label="정렬 순서" prop="mtcdSortOdrg">
						<el-input v-model="state.metaCode.mtcdSortOdrg" type="number" maxlength="5"></el-input>
					</el-form-item>

					<el-form-item label="사용 여부" prop="mtcdUseYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-model="state.metaCode.mtcdUseYn" placeholder="선택">
									<el-option label="선택" value="" />
									<el-option label="Y" value="Y" />
									<el-option label="N" value="N" />
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>

					<el-form-item label="상위 코드" prop="upMtcd">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-model="state.metaCode.upMtcd" 
								@change="changeupMtcdCd" 
								placeholder="선택">
									<el-option label="최상위" value="" />
									<el-option 
										v-for="item in upperMetaCodeList" 
										:key="item.mtcd" 
										:label="item.mtcdNm"
										:value="item.mtcd" />
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>          

				</el-form>
			</div>
		</div>
		<div class="btnSec taR mt20">
			<el-button type="primary" @click="editMetaCodeInfo">저장</el-button>
			<el-button type="default" @click="cancelSubDialog">취소</el-button>
		</div>
	</div>

</template>
<script setup>
import { ref, reactive, defineEmits, defineProps, watch } from "vue";
import { useRoute } from "vue-router";
import { getLoginUserId } from "@/assets/js/auth.js";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const emits = defineEmits(["editMetaCodeInfo", "cancelSubDialog"]);

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);

const props = defineProps({
	selectedMtcdGrpId: { //상위 목록(코드그룹)에서 선택한 메타코드그룹ID
		type: String,
		required: false,
	},
	upperMetaCodeList: {
		type: Array,
		required: false
	}
});

const state = reactive({
	metaCode: {
		mtcdGrpId: props.selectedMtcdGrpId,
		mtcd: "",
		mtcdNm: "",
		mtcdUseYn: "Y",
		mtcdSortOdrg: 0,
		mtcdDesc: "",
		upMtcd: "",
	},
	rules: {
		mtcdGrpId: [
			{
				max: 32,
				message: "32자 이하만 가능합니다.",
				trigger: "blur",
			}			
		],
		mtcd: [ //test (배열 안에 여러 객체 담아서 검증 가능한지 test)
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			},			
			{
				max: 64,
				message: "64자 이하만 가능합니다.",
				trigger: "blur",			
			}
		],
		mtcdNm: [
			{
				max: 128,
				message: "128자 이하만 가능합니다.",
				trigger: "blur",						
			}
		],
		mtcdUseYn: [
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			}			
		],
		mtcdSortOdrg: [
			{
			required: true,
			message: "내용을 입력하세요.",
			trigger: "blur",
			},
			{
			validator: (rule, value) => {
				const parsedValue = parseInt(value, 10);
				if (value && value.length > 5) {
				return Promise.reject("5자 이하만 가능합니다.");
				} else if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 99999) {
				return Promise.reject("0 ~ 99999 사이의 값만 입력할 수 있습니다.");
				} else {
				return Promise.resolve();
				}
			},
			trigger: "blur",
			}
		],
		mtcdDesc: [
			{
				max: 1000,
				message: "1000자 이하만 가능합니다.",
				trigger: "blur",						
			}
		],
		upMtcd: [
			{
				max: 64,
				message: "64자 이하만 가능합니다.",
				trigger: "blur",					
			}
		]
	}
});

const editMetaCodeInfo = async () => {
	let ruleForm = ruleFormRef.value;
	if (!ruleForm) return;

	let mtcdGrpId = props.selectedMtcdGrpId; // !!mtcdGrpId?.trim() => true -> 문자열 존재
	if (!mtcdGrpId?.trim()) {
		alert("등록하려는 메타코드의 메타코드그룹 ID가 존재하지 않습니다.");
		return;
	}

	await ruleForm.validate((valid, fields) => {
		if (valid) {

			let metaCodeInfo = {
				...state.metaCode,
			};

			$axios
				.post(util.format($apiUrls.meta.portal.code.createCode, mtcdGrpId), metaCodeInfo)
				.then(() => {
					alert("메타코드 등록이 완료되었습니다.");
					resetMetaCodeData();
					emits("editMetaCodeInfo");
				})
				.catch((err) => {

					console.log(err);
					if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
						alert(err.response.data.message);
					} else {
						alert("메타코드 등록에 실패하였습니다.");
					}
				});
		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
};

const resetMetaCodeData = () => {	
	state.metaCode.mtcdGrpId = "";
	state.metaCode.mtcd = "";
	state.metaCode.mtcdNm = "";
	state.metaCode.mtcdUseYn = "Y";
	state.metaCode.mtcdSortOdrg = 0;
	state.metaCode.mtcdDesc = "";
	state.metaCode.upMtcd = "";
};

const changeupMtcdCd = (data) => {
	state.metaCode.upMtcd = data;
};

const cancelSubDialog = () => {
	resetMetaCodeData();
	emits("cancelSubDialog");
};

</script>
<style lang="scss"></style>