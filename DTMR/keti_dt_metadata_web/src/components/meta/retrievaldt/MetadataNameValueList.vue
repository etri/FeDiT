<template>
	<div>
		<el-form label-width="240px" label-position="right">
			<template v-for="metadata of metadataInfoList" :key="metadata">
				<el-row v-if="metadata.prptyScrnIndcYn == 'Y'">
					<el-col :span="24">
						<el-form-item v-if="metadata.medataValNm && metadata.medataSetId != metadata.medataVal" :label="metadata.prptyLogicNm">{{ metadata.medataValNm }}  
							<span @click="goToMetadataManagePage1(metadata)" class="ml30 link-text">
								{{ metadata.medataVal }}
							</span>
						</el-form-item>
						<el-form-item v-else :label="metadata.prptyLogicNm">{{ metadata.medataVal }}</el-form-item>
					</el-col>
				</el-row>
			</template>
		</el-form>
	</div>
</template>
<script setup>
import { defineProps } from "vue";
import metaCommon from "@/assets/js/metaCommon.js";

const props = defineProps({
	metadataInfoList: {
		type: Array,
		required: true,
	},
	backPageName: {
		type: String,
		required: false,
		default: 'RetrievalMetadataSetPage'
	}	
});

const goToMetadataManagePage1 = (payload) => {
	metaCommon.goToMetadataManagePage({
		medataSetId: payload.medataVal,
		typeModelId: payload.valModelId,
		backPageName: props.backPageName
	});
}

</script>
<style lang="scss" scoped></style>