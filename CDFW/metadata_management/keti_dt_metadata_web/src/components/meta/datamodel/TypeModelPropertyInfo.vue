<template>
  <div>
    <el-form label-width="160px" label-position="right">
			<el-row>
				<el-col :span="12" >
					<el-form-item label="유형 명(물리명)">{{ typeModelInfo.modelNm }}</el-form-item>
				</el-col>
        <el-col :span="12" >
					<el-form-item label="유형 논리명">{{ typeModelInfo.modelLogicNm }}</el-form-item>
				</el-col>
			</el-row>

			<el-row>
				<el-col :span="12" >
					<el-form-item label="모델 데이터 URI">{{ typeModelInfo.modelDataUri }}</el-form-item>
				</el-col>
				<!-- 2023-07-27 정형모델 사용안함
        <el-col :span="12" >
					<el-form-item label="정형 모델 여부">{{ typeModelInfo.structdModelYn }}</el-form-item>
				</el-col>
			  -->
			</el-row>

			<el-row>
				<el-col :span="24" >
					<el-form-item label="설명">{{ typeModelInfo.modelDesc }}</el-form-item>
				</el-col>
			</el-row>

		</el-form>
  </div>   
</template>

<script setup>
import {getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const props = defineProps({
	typeModelInfo: {
		type: Object,
		required: true
	},
});
</script>
<style lang="scss"></style>