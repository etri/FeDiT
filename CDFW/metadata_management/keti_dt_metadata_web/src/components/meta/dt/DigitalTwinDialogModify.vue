<template>
	<div class="dialog-area">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>디지털트윈 편집</h3>
			</div>
			<div class="boxCnt">
				<el-form ref="ruleFormRef" :model="state.metadataSet" :rules="state.rules" 
					label-width="200px" class="demo-ruleForm" label-position="right">

					<el-form-item label="디지털트윈 ID" prop="medataSetId">
						<el-input v-model="state.metadataSet.medataSetId" disabled></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 유형" prop="typeModelNm">
						<el-input v-model="state.metadataSet.typeModelNm" disabled></el-input>
					</el-form-item>						

					<el-form-item label="메타데이터 모델" prop="modelNm">
						<el-input v-model="state.metadataSet.modelNm" disabled></el-input>
					</el-form-item>

					<el-form-item label="식별체계 - 국가코드" prop="idSchmCntryCd" v-show="IdSchmUseYn === 'Y'">
						<div class="inline-area">
							<el-input v-model="state.metadataSet.idSchmCntryCd" disabled style="width: 100px"></el-input>
							<el-input v-model="state.metadataSet.idSchmCntryNm" disabled style="width: 250px; margin-left: 5px;"></el-input>
						</div>
					</el-form-item>

					<el-form-item label="식별체계 - 분류코드 종류" prop="idSchmType" v-show="IdSchmUseYn === 'Y'">
						<el-input v-model="state.metadataSet.idSchmType" disabled style="width: 100px"></el-input>
						<el-input v-model="state.metadataSet.idSchmTypeNm" disabled style="width: 250px; margin-left: 5px;"></el-input>
					</el-form-item>

					<el-form-item label="식별체계 - 코드" prop="idSchmCd" v-show="IdSchmUseYn === 'Y'">
						<div class="inline-area">
							<el-input v-model="state.metadataSet.idSchmCd" disabled style="width: 100px"></el-input>
							<el-input v-model="state.metadataSet.idSchmCdNm" disabled style="width: 250px; margin-left: 5px;"></el-input>
						</div>
					</el-form-item>

					<el-form-item label="디지털트윈 명" prop="medataSetNm"><!-- 디지털트윈 명 (언어무관) -->
						<el-input v-model="state.metadataSet.medataSetNm"></el-input>
					</el-form-item>

					<el-form-item label="디지털트윈 논리명" prop="medataSetLogicNm">
						<el-input v-model="state.metadataSet.medataSetLogicNm"></el-input>
					</el-form-item>

					<el-form-item label="디지털트윈 설명" prop="medataSetDesc">
						<el-input v-model="state.metadataSet.medataSetDesc"></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 상태" prop="medataSetSttusMtcd">
						<el-input v-model="state.metadataSet.medataSetSttusMtcdNm" disabled></el-input>
					</el-form-item>
				</el-form>
			</div>

		</div>

		<div class="btnSec taR mt20">
			<el-button type="primary" v-if="isAmdYn(route.meta.auth)" @click="modifyMetadataSetInfo">저장</el-button>
			<el-button type="default" @click="cancelDialog">취소</el-button>
		</div>		

	</div>
</template>
<script setup>
import { ref, defineProps, defineEmits, reactive, onMounted, getCurrentInstance  } from "vue";
import { useRoute } from "vue-router";
import { isAmdYn, isDelYn, getGlobalProperties, isEmpty } from "@/assets/js/common.js";
import util from 'util';

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
  getCurrentInstance().appContext.config.globalProperties.$emitter;

const ruleFormRef = ref(null);
const IdSchmUseYn = ref(process.env.VUE_APP_METADATA_ID_SCHM_USE_YN);

const emits = defineEmits([
	"cancelModifyDialog",
	"modifyMetadataSetInfo",
]);

const props = defineProps({
	medataSetId: { // 디지털관리 화면에서만 사용되므로 따로 watch 하지 않는다.
		type: String,
		required: true,
	},
});

const state = reactive({
	metadataSet: {}, //메타데이터 셋 정보 (단일)
	rules: {
		medataSetNm: [
			{
				required: true,
        message: "디지털트윈 명을 입력하세요.",
        trigger: "blur",				
			},
			{
				max: 128,
				message: "128자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		medataSetLogicNm: [
			{
				max: 128,
				message: "128자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		medataSetDesc: [
			{
				required: true,
				message: "디지털트윈 설명을 입력하세요.",
				trigger: "blur",				
			},
			{
				max: 1000,
				message: "1000자 이하만 가능합니다.",
				trigger: "blur",
			}
		]
	}
});

onMounted(() => {
	// 디지털관리 화면에서만 사용되므로 따로 watch 하지 않는다.
	getMetadataSetDetail();
});

const getMetadataSetDetail = () => {
	let medataSetId = props.medataSetId;
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataSet, medataSetId))
		.then((res) => {
			state.metadataSet = res.data;
			if(IdSchmUseYn.value === 'Y') {
				if(res.data.idSchmType === "01") {
					getIdSchemeStdIndCode(res.data.idSchmCd);
				}
				if(res.data.idSchmType === "02") {
					getIdSchemePubRiCode(res.data.idSchmCd);
				}
			}
		})
		.catch((err) => {
			console.log(err);
		});
};

const getIdSchemeStdIndCode = (idSchmCd) => {
	$axios
		.get(util.format($apiUrls.meta.schema.idschemecode.getIdSchemeStdIndCode, idSchmCd))
		.then((res) => {
			state.metadataSet.idSchmCdNm = res.data.idSchmCdNm;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getIdSchemePubRiCode = (idSchmCd) => {
	$axios
		.get(util.format($apiUrls.meta.schema.idschemecode.getIdSchemePubRiCode, idSchmCd))
		.then((res) => {
			state.metadataSet.idSchmCdNm = res.data.idSchmCdNm;
		})
		.catch((err) => {
			console.log(err);
		});
}

const modifyMetadataSetInfo = async () => {

	let ruleForm = ruleFormRef.value;
	if (!ruleForm) return;

	await ruleForm.validate((valid, fields) => {
		if (!valid) { 
			alert("입력 정보를 다시 한번 확인해주세요."); 
			return;
		}

		if (!confirm("저장하시겠습니까?")) return;

		let medataSetId = state.metadataSet.medataSetId;
		let medataSetInfo = {
			...state.metadataSet
		}

		$axios
			.put(
				util.format($apiUrls.meta.resource.metadatasets.modifyMetadataSet, medataSetId),
				medataSetInfo
			)
			.then(() => {
				alert("저장되었습니다.");
				emits("modifyMetadataSetInfo");
			})
			.catch((err) => {

				console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("저장에 실패하였습니다.");
				}
			});

	});
};

const cancelDialog = () => {
	emits("cancelModifyDialog");
};

</script>
<style lang="scss"></style>