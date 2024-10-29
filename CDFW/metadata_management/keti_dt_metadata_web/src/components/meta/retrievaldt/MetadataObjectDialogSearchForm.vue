<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>메타데이터 검색</h3>
			<div class="btnSec taR">
				<el-button type="primary" @click="getSearchingMetadataObjectList(1)">검색</el-button>
			</div>			
		</div>
		<div class="boxCnt">
			<el-form :inline="true" :model="pageInfo" class="demo-form-inline" label-width="160px" label-position="left">
				<el-row :gutter="20">
					<!-- <el-col :span="24"> -->
						<el-form-item label="메타데이터 값">
							<el-input class="" v-model="pageInfo.medataVal" placeholder=""
								@keydown.enter.prevent="getSearchingMetadataObjectList(1)" />
						</el-form-item>

						<el-form-item label="값의 메타데이터 셋 명">
							<el-input class="" v-model="pageInfo.medataValNm" placeholder=""
								@keydown.enter.prevent="getSearchingMetadataObjectList(1)" />
						</el-form-item>

						<el-form-item label="정렬순서">

							<el-select v-model="pageInfo.sortField" placeholder="선택">
								<el-option label="선택" value="" />
								<el-option label="값" value="medataVal" />
								<el-option label="값의 메타데이터 셋 명" value="medataSetNm" />
							</el-select>

							<el-select v-model="pageInfo.sortOrder" placeholder="선택" class="ml15">
								<el-option label="선택" value="" />
								<el-option label="내림차순" value="descending" />
								<el-option label="오름차순" value="ascending" />
							</el-select>

						</el-form-item>
					<!-- </el-col> -->
				</el-row>

			</el-form>
		</div>
	</div>
</template>
<script setup>
import { reactive, defineEmits, defineProps } from "vue";

const emits = defineEmits(["searchMetadataObjectList"]);

const props = defineProps({
	medataSetId: {
		type: String,
		required: true,
	},
	prptyNm: {
		type: String,
		required: true,
	},
});

const pageInfo = reactive({
	medataSetId: props.medataSetId,
	prptyNm: props.prptyNm,
	sortOrder: "",
	sortField: "",
	medataVal: "",
	medataValNm: "",
});

const getSearchingMetadataObjectList = (data) => {
	emits("searchMetadataObjectList", {
		curPage: data,
		pageInfo,
	})
};

const refresh = () => {
	pageInfo.medataSetId = props.medataSetId;
	pageInfo.prptyNm = props.prptyNm;
	pageInfo.sortOrder = "";
	pageInfo.sortField = "";
	pageInfo.medataVal = "";
	pageInfo.medataValNm = "";
};

</script>
<style lang="scss"></style>