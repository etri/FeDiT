<template>
	<div class="dialog-area" id="codePopup">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>식별체계 - 객체 - 물품 코드 정보</h3>
			</div>
			
			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="state.productCode" :rules="rules" label-width="200px"
					class="demo-ruleForm" label-position="right">

					<el-form-item label="식별체계 코드" prop="idSchmCd">
						<el-input v-model="state.productCode.idSchmCd" disabled />
					</el-form-item>

					<el-form-item label="원본 외부 코드 (최대 5자리)" prop="originExtrCd">
						<el-input v-model="state.productCode.originExtrCd" maxlength="5" disabled/>
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

					<el-form-item label="등록정보">
						<el-input v-model="state.idSchmCdRegrInfo" disabled/>
					</el-form-item>

					<el-form-item label="수정정보">
						<el-input v-model="state.idSchmCdAmdrInfo" disabled/>
					</el-form-item>

				</el-form>
			</div>
		</div>

		<div class="btnSec taR mt20">
			<el-button type="primary" v-if="isAmdYn(route.meta.auth)" 
				@click="modifyProductCodeInfo">저장</el-button>
			<el-button type="default" @click="cancelDialog">취소</el-button>
		</div>

	</div>
</template>
<script setup>
import { ref, defineProps, defineEmits, reactive, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { isAmdYn } from "@/assets/js/common.js";

const route = useRoute();

const props = defineProps({
	productCode: {
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

const state = reactive({
	productCode: {
		idSchmCd: "",
		originExtrCd: "",
		idSchmCdNm: "",
		idSchmCdEngNm: "",
		idSchmCdDesc: "",
		useYn: "",
		idfyUseYn: "",
	},
	idSchmCdRegrInfo: "",
	idSchmCdAmdrInfo: ""
});

onMounted(() => {
	state.productCode = JSON.parse(JSON.stringify(props.productCode));
	state.idSchmCdRegrInfo = props.productCode.idSchmCdRegrId + " / " + props.productCode.idSchmCdRegDt;
	state.idSchmCdAmdrInfo = props.productCode.idSchmCdAmdrId + " / " + props.productCode.idSchmCdAmdDt;
});

watch(() => props.productCode, () => {
	state.productCode = JSON.parse(JSON.stringify(props.productCode));
	state.idSchmCdRegrInfo = props.productCode.idSchmCdRegrId + " / " + props.productCode.idSchmCdRegDt;
	state.idSchmCdAmdrInfo = props.productCode.idSchmCdAmdrId + " / " + props.productCode.idSchmCdAmdDt;
});

const emits = defineEmits(["modifyProductCodeInfo", "cancelModifyDialog"]);

const ruleFormRef = ref(null);

const rules = ref({
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
	]
});

const modifyProductCodeInfo = async () => {
	emits("modifyProductCodeInfo", { data: state.productCode, ruleFormRef });
};

const cancelDialog = () => {
	emits("cancelModifyDialog");
};

</script>
<style lang="scss"></style>