<template>
	<div>

		<!-- 단건 property 조회 (data_type) -->
		<div v-if="'data_type' === props.generalProperty.rangeModelTypeMtcd
			&& 'geoJson' !== props.generalProperty.rangeDataTypeMtcd
			&& 'json' !== props.generalProperty.rangeDataTypeMtcd" class="ly-table">
			<el-form label-width="160px" label-position="right">
				<el-row>
					<el-col :span="24">
						<el-form-item label="언어">{{ props.generalProperty.propertyList[0].langMtcd }}</el-form-item>
					</el-col>
				</el-row>
				<el-row>
					<el-col :span="24">
						<el-form-item label="메타데이터 값">{{ state.medataVal }}</el-form-item>
					</el-col>
				</el-row>
			</el-form>
		</div>

		<!-- 단건 property 조회 (data_type) geoJson -->
		<div v-if="'data_type' === props.generalProperty.rangeModelTypeMtcd
			&& 'geoJson' == props.generalProperty.rangeDataTypeMtcd">
			<el-form label-position="right">
				<el-row>
					<el-col :span="24">
						<el-form-item label="">
							<el-input type="textarea" v-model="props.generalProperty.propertyList[0].geodataVal" disabled></el-input>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
		</div>

		<!-- 단건 property 조회 (data_type) EtcJson -->
		<div v-if="'data_type' === props.generalProperty.rangeModelTypeMtcd
			&& 'json' == props.generalProperty.rangeDataTypeMtcd">
			<el-form label-position="right">
				<el-row>
					<el-col :span="24">
						<el-form-item label="">
							<el-input type="textarea" v-model="props.generalProperty.propertyList[0].medataVal" disabled></el-input>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
		</div>

		<!-- 단건 property 조회 (object_type) -->
		<div v-if="'object_type' === props.generalProperty.rangeModelTypeMtcd" class="ly-table">
			<el-form label-width="160px" label-position="right">
				<el-row>
					<el-col :span="12">
						<el-form-item label="메타데이터 셋 ID">{{ state.medataSetInfoForObjectType.medataSetId }} </el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="메타데이터 상태">{{ state.medataSetInfoForObjectType.medataSetSttusMtcdNm }}</el-form-item>
					</el-col>
				</el-row>
				<el-row>
					<el-col :span="12">
						<el-form-item label="메타데이터 셋 유형">{{ state.medataSetInfoForObjectType.typeModelNm }}</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="메타데이터 모델">{{ state.medataSetInfoForObjectType.modelNm }}</el-form-item>
					</el-col>
				</el-row>
				<el-row>
					<el-col :span="24">
						<el-form-item label="메타데이터 셋 명">{{ state.medataSetInfoForObjectType.medataSetNm }}</el-form-item>
					</el-col>
				</el-row>
				<el-row>
					<el-col :span="24">
						<el-form-item label="메타데이터 셋 논리명">{{ state.medataSetInfoForObjectType.medataSetLogicNm }}</el-form-item>
					</el-col>
				</el-row>
				<el-row>
					<el-col :span="24">
						<el-form-item label="메타데이터 설명">{{ state.medataSetInfoForObjectType.medataSetDesc }}</el-form-item>
					</el-col>
				</el-row>
			</el-form>
		</div>

	</div>
</template>
<script setup>
import { reactive, defineProps, watch, onMounted } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const props = defineProps({
	medataSetId: {
		type: String,
		required: true,
	},
	generalProperty: {
		type: Object,
		reqruied: true
	},
	propertyList: {
		type: Array,
		reqruied: false
	}
});

watch(
	() => [props.propertyList, props.generalProperty],
	() => {
		init();
	},
	{ deep: true }
)

const state = reactive({
	medataVal: "",
	medataSetInfoForObjectType: {}
});

onMounted(() => {
	init();
});

const init = () => {
	if (props.propertyList && props.propertyList.length > 0) {
		state.medataVal = props.propertyList[0].medataVal;
		if (props.generalProperty.rangeDataTypeMtcd == 'geoJson') {
			state.medataVal = props.propertyList[0].geodataVal;
		}
		if (props.generalProperty.rangeModelTypeMtcd == 'object_type') {
			getMetadataSetInfoForObjectType();
		}
	} else {
		state.medataVal = "";
		state.medataSetInfoForObjectType = {};
	}
}

const getMetadataSetInfoForObjectType = () => {
	let medataSetId = state.medataVal;
	if (!medataSetId?.trim()) return;

	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataSet, medataSetId))
		.then((res) => {
			state.medataSetInfoForObjectType = res.data;
		})
		.catch((err) => {
			console.log(err);
		});
};

</script>
<style lang="scss"></style>