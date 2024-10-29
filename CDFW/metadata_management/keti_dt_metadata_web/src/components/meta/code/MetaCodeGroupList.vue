<template>
	<div>
		<ComnList 
		:tableHeader="tableHeader" 
		:tableData="metaCodeGroupList" 
		:minHeight="245"
		@row-click="rowClick">
			<!-- slot -->
			<template v-slot:btn="slotData" v-if="isAmdYn(route.meta.auth)">
				<el-button type="primary" size="small" @click="goToDetailDialog(slotData)" >수정</el-button>
			</template>
			<template v-slot:btn="slotData" v-else-if="!isAmdYn(route.meta.auth) && isReadYn(route.meta.auth)">
				<el-button type="default" size="small" @click="goToDetailDialog(slotData)">조회</el-button>
			</template>
		</ComnList>

    <el-dialog v-model="dialogVisibleModify" v-bind:title="curTitle">
      <MetaCodeGroupDialogModify
        :metaCodeGroup="state.metaCodeGroup"
        :curPage="curPage"
        :curTitle="curTitle"
				:upperMetaCodeGroupList="upperMetaCodeGroupList"
        @cancelModifyDialog="cancelModifyDialog"
        @modifyMetaCodeGroupInfo="modifyMetaCodeGroupInfo"
      />
    </el-dialog>		

		<ComnPagination :totalPage="totalPage" :curPage="props.curPage" :page-size="state.pageInfo.pageListSize" @pagemove="pagemove" />
	</div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import MetaCodeGroupDialogModify from "@/components/meta/code/MetaCodeGroupDialogModify.vue";

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

const emits = defineEmits(["pageMove"], ["searchMetaCode"]);
const props = defineProps({
	metaCodeGroupList: {
		type: Array,
		required: true,
	},
	totalPage: {
		type: Number,
		required: true,
	},
  curPage: {
    type: Number,
    required: true,
  },
	upperMetaCodeGroupList: { //상위 메타그룹코드리스트
		type: Array,
		required: false,
	}
});

const state = reactive({

	metaCodeGroupList: [], //메타데이터 코드그룹 목록
	metaCodeGroup: {}, //메타데이터 코드그룹 객체
	pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 5, //상단 목록 페이징 단위를 5로 설정하기로 함 (23.05.17)
    blockSize: 5,
	}
});

const tableHeader = ref([
	{
		prop: "mtcdGrpId",
		label: "코드그룹ID",
		width: 100,
	},
	{
		prop: "mtcdGrpNm",
		label: "코드그룹 명",
		width: 250,
	},
	{
		prop: "mtcdGrpDesc",
		label: "설명",
		width: 250,
	},
	{
		prop: "mtcdGrpUseYn",
		label: "사용여부",
		width: 100,
	},
	{
		prop: "upMtcdGrpId",
		label: "상위코드그룹 ID",
		width: 180,
	},
	{
		prop: "btn",
		label: "",
		width: 80,
		columnType: "custom",
	}
]);

const rowClick = (selectedRow) => {
	emits("searchMetaCode", { selectedRow });
};

const pagemove = (payload) => {
	emits("pageMove", payload);
};

const goToDetailDialog = (node) => {

	if (isReadYn(route.meta.auth)) {

		const index = node.$index;
		state.metaCodeGroup.index = index;

		state.metaCodeGroup.mtcdGrpId = node.row.mtcdGrpId;
		state.metaCodeGroup.mtcdGrpNm = node.row.mtcdGrpNm;
		state.metaCodeGroup.mtcdGrpDesc = node.row.mtcdGrpDesc;
		state.metaCodeGroup.mtcdGrpUseYn = node.row.mtcdGrpUseYn;
		state.metaCodeGroup.upMtcdGrpId = node.row.upMtcdGrpId;
		state.metaCodeGroup.mtcdGrpSysUsgYn = node.row.mtcdGrpSysUsgYn;

    if (!isAmdYn(route.meta.auth)) {
      curPage.value = "detail";
      curTitle.value = "코드그룹 상세조회";
    } else {
      curPage.value = "modify";
      curTitle.value = "코드그룹 편집"      
    }
    dialogVisibleModify.value = true;

	} else {
    dialogVisibleModify.value = false;
    alert("읽기 권한이 없습니다.");		
	}
};

const modifyMetaCodeGroupInfo = async (payload) => {

	let ruleForm = payload.ruleFormRef.value;
	if (!ruleForm) return;
	await ruleForm.validate((valid, fields) => {
		if (valid) {
			let result = confirm("수정 하시겠습니까?");
			if (result) {

				let mtcdGrpId = payload.data.mtcdGrpId;

				let metaCodeGroupInfo = {
					...payload.data,
				};

				$axios
					.put(
						util.format($apiUrls.meta.portal.code.modifyCodegroup, mtcdGrpId),
						metaCodeGroupInfo
					)
					.then(() => {
						alert("수정이 완료되었습니다.");
						dialogVisibleModify.value = false;
						$emitter.emit("initMetaCodeGroupList"); // mitt 전송
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