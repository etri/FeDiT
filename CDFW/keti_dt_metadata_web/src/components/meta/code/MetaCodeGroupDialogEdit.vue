<template>
	<div class="dialog-area">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>코드그룹 등록</h3>
			</div>
			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="state.metaCodeGroup" :rules="state.rules" label-width="240px"
					class="demo-ruleForm" label-position="right">

					<el-form-item label="코드그룹ID 자동생성"> <!-- style="margin-right: 150px;" -->
						<el-checkbox v-model="state.autoCreateKey"></el-checkbox>
					</el-form-item>
					<el-form-item label="코드그룹 ID" prop="mtcdGrpId">
						<el-input v-if="state.autoCreateKey" v-model="state.metaCodeGroup.mtcdGrpId" placeholder="자동생성"
							disabled></el-input>
						<el-input v-else v-model="state.metaCodeGroup.mtcdGrpId"></el-input>
					</el-form-item>

					<el-form-item label="코드그룹 명" prop="mtcdGrpNm">
						<el-input v-model="state.metaCodeGroup.mtcdGrpNm"></el-input>
					</el-form-item>

					<el-form-item label="코드그룹설명" prop="mtcdGrpDesc">
						<el-input v-model="state.metaCodeGroup.mtcdGrpDesc"></el-input>
					</el-form-item>

          			<el-form-item label="사용 여부" prop="mtcdGrpUseYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-model="state.metaCodeGroup.mtcdGrpUseYn">
									<el-option label="Y" value="Y" />
									<el-option label="N" value="N" />
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>

					<el-form-item label="시스템용 여부" prop="mtcdGrpSysUsgYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-model="state.metaCodeGroup.mtcdGrpSysUsgYn">
									<el-option label="Y" value="Y" />
									<el-option label="N" value="N" />
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>
          
					<el-form-item label="상위 코드그룹 ID" prop="upMtcdGrpId">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-model="state.metaCodeGroup.upMtcdGrpId" 
								@change="changeupMtcdGrpCd" 
								placeholder="선택">
									<el-option label="최상위" value="" />
									<el-option 
										v-for="item in upperMetaCodeGroupList" 
										:key="item.mtcdGrpId" 
										:label="item.mtcdGrpNm"
										:value="item.mtcdGrpId" />
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>          

				</el-form>
			</div>
		</div>
		<div class="btnSec taR mt20">
			<el-button type="primary" @click="editMetaCodeGroupInfo">저장</el-button>
			<el-button type="default" @click="cancelDialog">취소</el-button>
		</div>
	</div>
</template>
<script setup>
import { ref, reactive, defineEmits, defineProps, watch } from "vue";
import { useRoute } from "vue-router";
import { getLoginUserId } from "@/assets/js/auth.js";
import { getGlobalProperties } from "@/assets/js/common.js";

const emits = defineEmits(["editMetaCodeGroupInfo", "cancelDialog"]);

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);

const props = defineProps({
	upperMetaCodeGroupList: { //상위 메타그룹코드리스트
		type: Array,
		required: false,
	}
});

const state = reactive({
	autoCreateKey: true, //코드그룹 key 자동생성 check 변수
	metaCodeGroup: {
		mtcdGrpId: "",
		mtcdGrpNm: "",
		mtcdGrpUseYn: "Y",
		mtcdGrpDesc: "",
		upMtcdGrpId: "",
		mtcdGrpSysUsgYn: "N",
	},
	rules: {
		mtcdGrpId: [
			{
				max: 32,
				message: "32자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		mtcdGrpNm: [
			{
				max: 128,
				message: "128자 이하만 가능합니다.",
				trigger: "blur",
			},
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			}
		],
		mtcdGrpUseYn: [
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			}
		],
		mtcdGrpDesc: [
			{
				max: 1000,
				message: "1000자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		upMtcdGrpId: [
			{
				max: 32,
				message: "32자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		mtcdGrpSysUsgYn: [
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			}
		]
	},
});

watch(() => state.autoCreateKey, () => {

	if (state.autoCreateKey) {
		state.metaCodeGroup.mtcdGrpId = "";
	}
});

const editMetaCodeGroupInfo = async () => {
	let ruleForm = ruleFormRef.value;
	if (!ruleForm) return;

	let mtcdGrpId = state.metaCodeGroup.mtcdGrpId; // !!mtcdGrpId?.trim() => true -> 문자열 존재
	if (!state.autoCreateKey && !mtcdGrpId?.trim()) {
		alert("자동생성이 아닌 경우 코드그룹ID는 필수 입력값입니다.");
		return;
	}

	await ruleForm.validate((valid, fields) => {
		if (valid) {

			let metaCodeGroupInfo = {
				...state.metaCodeGroup,
				regr: getLoginUserId(),
			};

			$axios
				.post($apiUrls.meta.portal.code.createCodegroup, metaCodeGroupInfo)
				.then(() => {
					alert("메타코드그룹 등록이 완료되었습니다.");
					resetMetaCodeGroupData();
					emits("editMetaCodeGroupInfo");
				})
				.catch((err) => {

					console.log(err);
					if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
						alert(err.response.data.message);
					} else {
						alert("메타코드그룹 등록에 실패하였습니다.");
					}
				});
		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
};

const changeupMtcdGrpCd = (data) => {
	state.metaCodeGroup.upMtcdGrpId = data;
};

const resetMetaCodeGroupData = () => {
	state.metaCodeGroup.mtcdGrpId = "";
	state.metaCodeGroup.mtcdGrpNm = "";
	state.metaCodeGroup.mtcdGrpUseYn = "Y";
	state.metaCodeGroup.mtcdGrpDesc = "";
	state.metaCodeGroup.upMtcdGrpId = "";
	state.metaCodeGroup.mtcdGrpSysUsgYn = "N";
};

const cancelDialog = () => {
	emits("cancelDialog");
};

</script>
<style lang="scss"></style>