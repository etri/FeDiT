<template>
	<div>
		<ComnList :tableHeader="tableHeader" :tableData="countryCodeList">
			<template v-slot:btn="slotData" v-if="isAmdYn(route.meta.auth)">
				<el-button type="primary" size="small" @click="goToDetailDialog(slotData)">수정</el-button>
			</template>
			<template v-slot:btn="slotData" v-else-if="!isAmdYn(route.meta.auth) && isReadYn(route.meta.auth)">
				<el-button type="default" size="small" @click="goToDetailDialog(slotData)">조회</el-button>
			</template>
		</ComnList>

		<el-dialog v-model="dialogVisibleModify" v-bind:title="curTitle">
			<CountryCodeDialogModify :countryCode="state.countryCode" :curPage="curPage" :curTitle="curTitle"
				:dataStatusList="dataStatusList" @cancelModifyDialog="cancelModifyDialog"
				@modifyCountryCodeInfo="modifyCountryCodeInfo" />
		</el-dialog>

		<ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
	</div>
</template>
<script setup>
import CountryCodeDialogModify from '@/components/meta/countrycode/CountryCodeDialogModify.vue';
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, reactive, defineProps, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getUser, getLoginUserId } from "@/assets/js/auth.js";
import { getGlobalProperties, isAmdYn, isReadYn } from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;
const user = getUser();

const curPage = ref("");
const curTitle = ref("");
const dialogVisibleModify = ref(false);

const emits = defineEmits(["pageMove"]);

const props = defineProps({
	countryCodeList: {
		type: Array,
		required: false,
	},
	totalPage: {
		type: Number,
		required: true,
	},
	curPage: {
		type: Number,
		required: true,
	},
	dataStatusList: {
		type: Array,
		required: false,
	}
});

const state = reactive({
	countryCodeList: [],
	countryCode: {},
	pageInfo: {
		curPage: 1,
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	}
});

const tableHeader = ref([
	{
		prop: "cntryCd",
		label: "국가코드",
		width: 130,
	},
	{
		prop: "cntryNm",
		label: "국가 명",
		width: 130,
	},
	{
		prop: "cntryEngNm",
		label: "국가 영문명",
		width: 120,
	},
	{
		prop: "cntryDataSttusMtcdNm",
		label: "상태",
		width: 70,
	},
	{
		prop: "btn",
		label: "",
		width: 50,
		columnType: "custom",
	}
]);

const goToDetailDialog = (node) => {
	if (isReadYn(route.meta.auth)) {
		const index = node.$index;
		state.countryCode.index = index;

		state.countryCode.cntryCd = node.row.cntryCd;
		state.countryCode.cntryNm = node.row.cntryNm;
		state.countryCode.cntryEngNm = node.row.cntryEngNm;
		state.countryCode.cntryNumb = node.row.cntryNumb;
		state.countryCode.cntryAlpha3 = node.row.cntryAlpha3;
		state.countryCode.cntryAlpha2 = node.row.cntryAlpha2;
		state.countryCode.cntryDataSttusMtcd = node.row.cntryDataSttusMtcd;

		if (!isAmdYn(route.meta.auth)) {
			curPage.value = "detail";
			curTitle.value = "국가코드 상세조회";
		} else {
			curPage.value = "modify";
			curTitle.value = "국가코드 편집"
		}
		dialogVisibleModify.value = true;

	} else {
		dialogVisibleModify.value = false;
		alert("읽기 권한이 없습니다.");
	}
};

const modifyCountryCodeInfo = async (payload) => {
	let ruleForm = payload.ruleFormRef.value;
	if (!ruleForm) return;
	await ruleForm.validate((valid, fields) => {
		if (valid) {
			let result = confirm("수정 하시겠습니까?");
			if (result) {
				let cntryCd = payload.data.cntryCd;
				let countryCodeInfo = { ...payload.data };
				$axios
					.put(
						util.format($apiUrls.meta.portal.countrycode.modifyCountryCode, cntryCd),
						countryCodeInfo
					)
					.then(() => {
						alert("수정이 완료되었습니다.");
						dialogVisibleModify.value = false;
						$emitter.emit("initCountryCodeList");
					})
					.catch((err) => {

						console.log(err);
						if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
							alert(err.response.data.message);
						} else {
							alert("국가코드 수정에 실패하였습니다.");
						}
					});
			}

		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
};

const pagemove = (payload) => {
	emits("pageMove", payload);
};

const cancelModifyDialog = () => {
	dialogVisibleModify.value = false;
};

</script>
<style lang="scss"></style>