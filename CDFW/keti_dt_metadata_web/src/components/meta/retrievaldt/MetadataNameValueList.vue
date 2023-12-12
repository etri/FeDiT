<template>
	<div>
		<el-form label-width="240px" label-position="right">
			<el-row v-for="metadata of metadataInfoList" :key="metadata">
				<el-col :span="24">
					<el-form-item :label="metadata.prptyLogicNm">{{ metadata.medataVal }}</el-form-item>
				</el-col>
			</el-row>
		</el-form>
	</div>
</template>
<script setup>
import { defineProps } from "vue";

const props = defineProps({
	metadataInfoList: {
		type: Array,
		required: true,
	}
});

</script>
<style lang="scss" scoped></style>