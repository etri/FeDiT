<template>
	<div>
		<ComnList :tableHeader="tableHeader" :tableData="metaCodeList" :minHeight="245">
			<template v-slot:btn="slotData" v-if="isAmdYn(route.meta.auth)">
				<el-button type="primary" size="small" @click="goToDetailDialog(slotData)">수정</el-button>
			</template>
			<template v-slot:btn="slotData" v-else-if="!isAmdYn(route.meta.auth) && isReadYn(route.meta.auth)">
				<el-button type="default" size="small" @click="goToDetailDialog(slotData)">조회</el-button>
			</template>
		</ComnList>

		<el-dialog v-model="dialogVisibleModify" v-bind:title="curTitle">
			<MetaCodeDialogModify :metaCode="state.metaCode" :curPage="curPage" :curTitle="curTitle"
				:upperMetaCodeList="upperMetaCodeList" @cancelModifyDialog="cancelModifyDialog"
				@modifyMetaCodeInfo="modifyMetaCodeInfo" />
		</el-dialog>

		<ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
	</div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import MetaCodeDialogModify from "@/components/meta/code/MetaCodeDialogModify.vue";

import { ref, defineProps, defineEmits, getCurrentInstance, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getUser, getLoginUserId } from "@/assets/js/auth.js";
import {
	getGlobalProperties,
	isAmdYn,
	isReadYn
} from "@/assets/js/common.js";
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

const emits = defineEmits(["subPageMove"]);
const props = defineProps({
	metaCodeList: {
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
	upperMetaCodeList: {
		type: Array,
		required: false,
	}
});

const state = reactive({
	metaCodeList: [], //메타데이터 코드 목록
	metaCode: {}, //메타데이터 코드 객체
	pageInfo: {
		curPage: 1,
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	}
});

const tableHeader = ref([
	{
		prop: "mtcd",
		label: "코드",
		width: 200,
	},
	{
		prop: "mtcdNm",
		label: "코드명",
		width: 250,
	},
	{
		prop: "mtcdDesc",
		label: "설명",
		width: 250,
	},
	{
		prop: "mtcdUseYn",
		label: "사용여부",
		width: 100,
	},
	{
		prop: "upMtcd",
		label: "상위코드",
		width: 180,
	},
	{
		prop: "btn",
		label: "",
		width: 80,
		columnType: "custom",
	}
]);

const pagemove = (payload) => {
	emits("subPageMove", payload);
};

const goToDetailDialog = (node) => {

	if (isReadYn(route.meta.auth)) {

		const index = node.$index;
		state.metaCode.index = index;

		state.metaCode.mtcdGrpId = node.row.mtcdGrpId;
		state.metaCode.mtcd = node.row.mtcd;
		state.metaCode.mtcdNm = node.row.mtcdNm;
		state.metaCode.mtcdDesc = node.row.mtcdDesc;
		state.metaCode.mtcdUseYn = node.row.mtcdUseYn;
		state.metaCode.upMtcd = node.row.upMtcd;
		state.metaCode.mtcdSortOdrg = node.row.mtcdSortOdrg;

		if (!isAmdYn(route.meta.auth)) {
			curPage.value = "detail";
			curTitle.value = "코드 상세조회";
		} else {
			curPage.value = "modify";
			curTitle.value = "코드 편집"
		}
		dialogVisibleModify.value = true;

	} else {
		dialogVisibleModify.value = false;
		alert("읽기 권한이 없습니다.");
	}
};

const modifyMetaCodeInfo = async (payload) => {

	let ruleForm = payload.ruleFormRef.value;
	if (!ruleForm) return;
	await ruleForm.validate((valid, fields) => {
		if (valid) {
			let result = confirm("수정 하시겠습니까?");
			if (result) {

				let mtcdGrpId = state.metaCode.mtcdGrpId;
				let mtcd = payload.data.mtcd;

				let metaCodeInfo = {
					...payload.data,
				};

				$axios
					.put(
						util.format($apiUrls.meta.portal.code.modifyCode, mtcdGrpId, mtcd),
						metaCodeInfo
					)
					.then(() => {
						alert("수정이 완료되었습니다.");
						dialogVisibleModify.value = false;
						$emitter.emit("initMetaCodeList"); // mitt 전송
					})
					.catch((err) => {

						console.log(err);
						if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
							alert(err.response.data.message);
						} else {
							alert("메타코드그룹 수정에 실패하였습니다.");
						}
					});
			}
		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
};

const cancelModifyDialog = () => {
	dialogVisibleModify.value = false;
};

</script>
<style lang="scss"></style>