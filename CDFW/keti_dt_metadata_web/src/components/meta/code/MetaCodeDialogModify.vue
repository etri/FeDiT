<template>
	<div class="dialog-area" id="codePopup">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>{{ curTitle }}</h3>
			</div>
			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="metaCode" :rules="rules" label-width="200px" class="demo-ruleForm" label-position="right">
					<el-form-item label="코드" prop="mtcd">
						<el-input v-model="metaCode.mtcd" disabled></el-input>
					</el-form-item>

					<el-form-item label="코드 명" prop="mtcdNm">
						<el-input v-bind:disabled="curPage != 'modify'" v-model="metaCode.mtcdNm"></el-input>
					</el-form-item>

					<el-form-item label="코드 설명" prop="mtcdDesc">
						<el-input v-bind:disabled="curPage != 'modify'" v-model="metaCode.mtcdDesc"></el-input>
					</el-form-item>

          			<el-form-item label="정렬 순서" prop="mtcdSortOdrg">
						<el-input v-bind:disabled="curPage != 'modify'" v-model="metaCode.mtcdSortOdrg" type="number" maxlength="5"></el-input>
					</el-form-item>					

					<el-form-item label="사용 여부" prop="mtcdUseYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-bind:disabled="curPage != 'modify'" v-model="metaCode.mtcdUseYn">
									<el-option label="선택" value="" />
									<el-option label="Y" value="Y" />
									<el-option label="N" value="N" />
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>

					<el-form-item label="상위 코드">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-bind:disabled="curPage != 'modify'" 
									v-model="metaCode.upMtcd"
									@change="changeupMtcdCd" placeholder="선택">
									<el-option label="최상위" value="" />
									<el-option v-for="item in upperMetaCodeList" 
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
			<el-button type="primary" v-if="isAmdYn(route.meta.auth) && curPage == 'modify'" 
				@click="modifyMetaCodeInfo">저장</el-button>
			<el-button type="default" @click="cancelDialog">취소</el-button>
		</div>
	</div>
</template>
<script setup>
import { ref, defineProps, defineEmits, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { isAmdYn, isDelYn } from "@/assets/js/common.js";

const route = useRoute();

const props = defineProps({
	metaCode: {
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
	upperMetaCodeList: {
		type: Array,
		required: false,
	}
});

const emits = defineEmits([
	"cancelModifyDialog",
	"modifyMetaCodeInfo",
]);

const ruleFormRef = ref(null);

const rules = ref({
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
});

onMounted(() => {
	upMtcdInit();
});

watch(() => props.metaCode.upMtcd, () => {
	if (!props.metaCode.upMtcd?.trim()) { //문자열 미존재
		props.metaCode.upMtcd = ""; // backend에서 "" 입력 시, null로 setting될 수 있도록 함.
	}
});

const upMtcdInit = () => {
	if (!props.metaCode.upMtcd?.trim()) { //문자열 미존재
		props.metaCode.upMtcd = ""; // backend에서 "" 입력 시, null로 setting될 수 있도록 함.
	}	
};

const changeupMtcdCd = (data) => {
	props.metaCode.upMtcd = data;
};

const cancelDialog = () => {
	emits("cancelModifyDialog");
};

const modifyMetaCodeInfo = async () => {
	emits("modifyMetaCodeInfo", { data: props.metaCode, ruleFormRef });
};

</script>
<style lang="scss"></style>
