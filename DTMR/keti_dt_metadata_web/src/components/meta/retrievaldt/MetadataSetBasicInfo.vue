<template>
	<div>
		<el-form label-width="240px" label-position="right">
			<el-row>
				<el-col :span="12">
					<el-form-item :label="`${medataSet.typeModelId == 'DigitalTwin' ? '디지털트윈' : '메타데이터 셋'} ID`">
						{{ medataSet.medataSetId }}
					</el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="메타데이터 상태">
						{{ medataSet.medataSetSttusMtcdNm }}
						<span v-if="medataSet.medataSetSttusWhy">
							(사유: {{ medataSet.medataSetSttusWhy }})
						</span>
					</el-form-item>
				</el-col>
			</el-row>

			<el-row>
				<el-col :span="12">
					<el-form-item label="메타데이터 유형">{{ medataSet.typeModelNm }} {{ medataSet.typeModelLogicNm }}</el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="메타데이터 모델">{{ medataSet.modelNm }} {{ medataSet.modelLogicNm }}</el-form-item>
				</el-col>
			</el-row>

			<el-row>
				<el-col :span="24">
					<el-form-item :label="`${medataSet.typeModelId == 'DigitalTwin' ? '디지털트윈' : '메타데이터 셋'}  명`">
						{{ medataSet.medataSetNm }}
					</el-form-item>
				</el-col>
			</el-row>

			<el-row>
				<el-col :span="24">
					<el-form-item :label="`${medataSet.typeModelId == 'DigitalTwin' ? '디지털트윈' : '메타데이터 셋'}  논리명`">
						{{ medataSet.medataSetLogicNm }}
					</el-form-item>
				</el-col>
			</el-row>

			<el-row>
				<el-col :span="24">
					<el-form-item :label="`${medataSet.typeModelId == 'DigitalTwin' ? '디지털트윈' : '메타데이터 셋'}  설명`">
						{{ medataSet.medataSetDesc }}
					</el-form-item>
				</el-col>
			</el-row>

			<el-row>
				<el-col :span="12">
					<el-form-item label="등록정보">{{ medataSet.medataSetRegrId }} / {{ medataSet.medataSetRegDt }}</el-form-item>
				</el-col>
				<el-col :span="12">
					<el-form-item label="수정정보">{{ medataSet.medataSetAmdrId }} / {{ medataSet.medataSetAmdDt }}</el-form-item>
				</el-col>
			</el-row>
		</el-form>
	</div>
</template>
<script setup>
import { defineProps } from "vue";

const props = defineProps({
	medataSet: {
		type: Object,
		required: true,
	}
});

</script>
<style lang="scss"></style>