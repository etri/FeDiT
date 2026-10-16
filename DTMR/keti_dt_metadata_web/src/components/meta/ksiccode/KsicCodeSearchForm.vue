<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>표준산업분류 코드 검색</h3>
			<div class="btnSec taR">
				<el-button type="default" @click="refresh">초기화</el-button>
				<el-button type="primary" @click="getKsicCodeList(1)">검색</el-button>
			</div>
		</div>
		<div class="boxCnt">
			<el-form :inline="true" :model="pageInfo" class="demo-form-inline search-form" label-width="150px" label-position="left">

				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="대분류">
							<el-select v-model="pageInfo.lctgExtrCd" placeholder="선택">
								<el-option label="전체" value="" />
								<el-option
								v-for="item in ksicCodeLctgCodeList"
								:key="item.lctgExtrCd"
								:label="`[${item.lctgExtrCd}] ${item.idSchmCdNm}`"
								:value="item.lctgExtrCd"
								/>
							</el-select>
						</el-form-item>
					</el-col>
				</el-row>

				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="식별체계 코드">
							<el-input class="" v-model="pageInfo.idSchmCd" placeholder="식별체계 코드"
								@keydown.enter.prevent="getKsicCodeList(1)" style="" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="식별체계 코드 명">
							<el-input class="" v-model="pageInfo.idSchmCdNm" placeholder="식별체계 코드 명"
								@keydown.enter.prevent="getKsicCodeList(1)" style="" />
						</el-form-item>
					</el-col>
				</el-row>

				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="식별 사용여부">
							<el-select v-model="pageInfo.idfyUseYn" placeholder="선택" class="w40">
								<el-option label="전체" value="" />
								<el-option label="Y" value="Y" />
								<el-option label="N" value="N" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="사용여부">
							<el-select v-model="pageInfo.useYn" placeholder="선택" class="w40">
								<el-option label="전체" value="" />
								<el-option label="Y" value="Y" />
								<el-option label="N" value="N" />
							</el-select>
						</el-form-item>
					</el-col>
				</el-row>

			</el-form>

		</div>
	</div>
</template>
<script setup>
import { reactive, defineEmits, defineProps, watch } from "vue";

const emits = defineEmits(["searchKsicCodeList"]);

const props = defineProps({
	ksicCodeLctgCodeList: {
		type: Array,
		required: false,
	},
	lctgExtrCd: {
		type: Object,
    	required: false,
	}
});

const pageInfo = reactive({
	lctgExtrCd: "",
	idSchmCd: "",
	idSchmCdNm: "",
	idfyUseYn: "",
	useYn: "",
});

watch(() => props.ksicCodeLctgCodeList, () => {
	if(pageInfo.lctgExtrCd === "") {
		pageInfo.lctgExtrCd = props.lctgExtrCd;
	}
});

const getKsicCodeList = (data) => {
	emits("searchKsicCodeList", { curPage: data, pageInfo });
};

const refresh = () => {
	// pageInfo.lctgExtrCd = props.ksicCodeLctgCodeList[0].lctgExtrCd;
	pageInfo.lctgExtrCd = "";
	pageInfo.idSchmCd = "";
	pageInfo.idSchmCdNm = "";
	pageInfo.idfyUseYn = "";
	pageInfo.useYn = "";
};

</script>
<style lang="scss"></style>