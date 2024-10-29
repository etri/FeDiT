<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>국가코드 검색</h3>
			<div class="btnSec taR">
				<el-button type="default" @click="refresh">초기화</el-button>
				<el-button type="primary" @click="getCountryCodeList(1)">검색</el-button>
			</div>
		</div>
		<div class="boxCnt">
			<el-form :inline="true" :model="pageInfo" class="demo-form-inline search-form" label-width="150px" label-position="left">

				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="국가코드">
							<el-input class="" v-model="pageInfo.cntryCd" placeholder="국가코드"
								@keydown.enter.prevent="getCountryCodeList(1)" style="" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="국가코드명">
							<el-input class="" v-model="pageInfo.cntryNm" placeholder="국가코드명"
								@keydown.enter.prevent="getCountryCodeList(1)" style="" />
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>

		</div>
	</div>
</template>
<script setup>
import { reactive, defineEmits, defineProps } from "vue";

const emits = defineEmits(["searchCountryCodeList"]);

const props = defineProps({
	countryCodeList: {
		type: Array,
		required: false,
	}
});

const pageInfo = reactive({
	cntryCd: "",
	cntryNm: "",
});

const getCountryCodeList = (data) => {
	emits("searchCountryCodeList", { curPage: data, pageInfo });
};

const refresh = () => {
	pageInfo.cntryCd = "";
	pageInfo.cntryNm = "";
};

</script>
<style lang="scss"></style>