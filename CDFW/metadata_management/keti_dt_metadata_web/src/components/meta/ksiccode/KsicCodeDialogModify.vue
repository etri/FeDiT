<template>
	<div class="dialog-area" id="codePopup">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>식별체계 - 표준산업분류 코드 정보</h3>
			</div>
			
			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="state.ksicCode" :rules="rules" label-width="200px"
					class="demo-ruleForm" label-position="right">

					<el-form-item label="식별체계 코드" prop="idSchmCd">
						<el-input v-model="state.ksicCode.idSchmCd" disabled />
					</el-form-item>

					<el-form-item label="코드 크기 구분" prop="cdSizeDivMtcd">
						<el-select 
							v-model="state.ksicCode.cdSizeDivMtcd"
							placeholder="선택"
							disabled>
							<el-option
								v-for="item in dataStatusList"
								:key="item.mtcd"
								:label="item.mtcdNm"
								:value="item.mtcd"
							/>
						</el-select>
					</el-form-item>

					<el-form-item label="대분류 외부 코드 (1자리)" prop="lctgExtrCd">
						<el-input v-model="state.ksicCode.lctgExtrCd" maxlength="1" disabled/>
					</el-form-item>

					<el-form-item label="원본 외부 코드 (최대 5자리)" prop="originExtrCd" v-show="state.ksicCode.cdSizeDivMtcd !== 'l'">
						<el-input v-model="state.ksicCode.originExtrCd" maxlength="5" disabled/>
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
				@click="modifyKsicCodeInfo">저장</el-button>
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
	ksicCode: {
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
	ksicCode: {
		idSchmCd: "",
		cdSizeDivMtcd: "",
		lctgExtrCd: "",
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
	state.ksicCode = JSON.parse(JSON.stringify(props.ksicCode));
	state.idSchmCdRegrInfo = props.ksicCode.idSchmCdRegrId + " / " + props.ksicCode.idSchmCdRegDt;
	state.idSchmCdAmdrInfo = props.ksicCode.idSchmCdAmdrId + " / " + props.ksicCode.idSchmCdAmdDt;
});

watch(() => props.ksicCode, () => {
	state.ksicCode = JSON.parse(JSON.stringify(props.ksicCode));
	state.idSchmCdRegrInfo = props.ksicCode.idSchmCdRegrId + " / " + props.ksicCode.idSchmCdRegDt;
	state.idSchmCdAmdrInfo = props.ksicCode.idSchmCdAmdrId + " / " + props.ksicCode.idSchmCdAmdDt;
});

const emits = defineEmits(["modifyKsicCodeInfo", "cancelModifyDialog"]);

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

const modifyKsicCodeInfo = async () => {
	emits("modifyKsicCodeInfo", { data: state.ksicCode, ruleFormRef });
};

const cancelDialog = () => {
	emits("cancelModifyDialog");
};

</script>
<style lang="scss"></style>