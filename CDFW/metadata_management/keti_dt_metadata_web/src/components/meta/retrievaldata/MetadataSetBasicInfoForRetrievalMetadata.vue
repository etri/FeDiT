<template>
	<div>
		<el-form label-width="160px" label-position="right">
			<el-row>
				<el-col :span="12">
					<el-form-item label="메타데이터 셋 ID">
						<span @click="goToMetadataDetailPage" class="link-text">{{ state.medataSet.medataSetId }}</span>
					</el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="메타데이터 상태">
						{{ state.medataSet.medataSetSttusMtcdNm }}
						<span v-if="state.medataSet.medataSetSttusWhy">
							(사유: {{ state.medataSet.medataSetSttusWhy }})
						</span>
					</el-form-item>
				</el-col>
			</el-row>

			<el-row>
				<el-col :span="12">
					<el-form-item label="메타데이터 유형">
						{{ state.medataSet.typeModelNm }} {{ state.medataSet.typeModelLogicNm }}
					</el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="메타데이터 모델">
						{{ state.medataSet.modelNm }} {{ state.medataSet.modelLogicNm }}
					</el-form-item>
				</el-col>
			</el-row>

			<el-row>
				<el-col :span="24">
					<el-form-item label="메타데이터 셋 명">{{ state.medataSet.medataSetNm }}</el-form-item>
				</el-col>
			</el-row>

			<el-row>
				<el-col :span="24">
					<el-form-item label="메타데이터 셋 논리명">{{ state.medataSet.medataSetLogicNm }}</el-form-item>
				</el-col>
			</el-row>

			<el-row>
				<el-col :span="24">
					<el-form-item label="메타데이터 설명">{{ state.medataSet.medataSetDesc }}</el-form-item>
				</el-col>
			</el-row>

			<el-row>
				<el-col :span="12">
					<el-form-item label="등록정보">
						{{ state.medataSet.medataSetRegrId }} / {{ state.medataSet.medataSetRegDt }}
					</el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="수정정보">
						{{ state.medataSet.medataSetAmdrId }} / {{ state.medataSet.medataSetAmdDt }}
					</el-form-item>
				</el-col>
			</el-row>
		</el-form>
	</div>
</template>
<script setup>
import { useRoute } from "vue-router";
import { defineProps, reactive, onMounted } from "vue";
import { isAmdYn, isReadYn, getCookie, routerPush, getGlobalProperties, isEmpty } from "@/assets/js/common.js";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const route = useRoute();

const props = defineProps({
	medataId: {
		type: String,
		required: true,
	},
	medataSetId: {
		type: String,
		required: true,
	}
});

const state = reactive({
	medataSet: {},
})

onMounted(() => {
	getMetadataSetBasicInfo();
});

const getMetadataSetBasicInfo = () => {
	let medataSetId = route.query.medataSetId;
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataSet, medataSetId))
		.then((res) => {
			state.medataSet = res.data;
		})
		.catch((err) => {
			console.log(err);
		});
};

const goToMetadataDetailPage = () => {
	let medataSetId = props.medataSetId;
	if (isEmpty(medataSetId)) return;

	let platform = getCookie("pltfrmId");
	let query = { medataSetId };

	let typeModelId = state.medataSet.typeModelId; //model table내의 type_model_id 로 분기 처리
	if ('DigitalTwin' === typeModelId) { //누른 메타데이터값 -> 메타데이터 셋 ID
		//디지털트윈 조회 page로 이동
		routerPush(platform, "RetrievalDigitalTwinDatasetPage", query);
	} else {
		//메타데이터 조회 page로 이동
		routerPush(platform, "RetrievalMetadataSetPage", query);
	}
};

</script>
<style lang="scss"></style>