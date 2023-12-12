<template>
	<div class="cntSec">
		<!-- 메타데이터 코드 관리 -->
		<MetaCodeGroupSearchForm @searchMetaCodeGroup="searchMetaCodeGroup" />

		<div class="btnSec taR mt10">
			<el-button type="primary" size="large" v-if="isWriteYn(route.meta.auth)" @click="dialogVisibleEdit = true">코드그룹	등록</el-button>
		</div>
		<el-dialog v-model="dialogVisibleEdit" title="코드그룹 등록">
			<MetaCodeGroupDialogEdit 
				:upperMetaCodeGroupList="upperMetaCodeGroupList" 
				@cancelDialog="cancelDialog"
				@editMetaCodeGroupInfo="editMetaCodeGroupInfo" />
		</el-dialog>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>코드그룹 목록</h3>
			</div>
			<div class="boxCnt">
				<div style="overflow-x: hidden; overflow-y: auto">
					<MetaCodeGroupList 
						:metaCodeGroupList="state.metaCodeGroupList" 
						:upperMetaCodeGroupList="upperMetaCodeGroupList"
						:totalPage="state.pageInfo.totalListSize"
						:curPage="state.pageInfo.curPage"
						@pageMove="pageMove" 
						@searchMetaCode="searchMetaCode" />
				</div>
			</div>
		</div>

		<div class="boxSectionTit" v-if="state.selectedMtcdGrpId !== ''">
			<h3>[{{ state.selectedMtcdGrpId }}] &nbsp; {{ state.selectedMtcdGrpNm }} </h3>
		</div>

		<div class="boxLayout" v-if="state.selectedMtcdGrpId !== ''">
			<div class="boxTit">
				<h3>코드 목록</h3>

				<div class="btnSec taR">
					<el-button type="primary" v-if="isWriteYn(route.meta.auth)" @click="subDialogVisibleEdit = true">코드	등록</el-button>
				</div>
			</div>

			<el-dialog v-model="subDialogVisibleEdit" title="코드 등록">
				<MetaCodeDialogEdit 
					:selectedMtcdGrpId="state.selectedMtcdGrpId" 
					:upperMetaCodeList="upperMetaCodeList"
					@cancelSubDialog="cancelSubDialog" 
					@editMetaCodeInfo="editMetaCodeInfo" />
			</el-dialog>

			<div class="boxCnt">
				<div style="overflow-x: hidden; overflow-y: auto">
					<MetaCodeList 
						:upperMetaCodeList="upperMetaCodeList" 
						:metaCodeList="state.metaCodeList"
						:totalPage="state.subPageInfo.totalListSize"
						:curPage="state.subPageInfo.curPage"
						@subPageMove="subPageMove" />
				</div>
			</div>
		</div>

	</div>
</template>
<script setup>
import MetaCodeGroupSearchForm from "@/components/meta/code/MetaCodeGroupSearchForm.vue";
import MetaCodeGroupList from "@/components/meta/code/MetaCodeGroupList.vue";
import MetaCodeList from "@/components/meta/code/MetaCodeList.vue";
import MetaCodeGroupDialogEdit from "@/components/meta/code/MetaCodeGroupDialogEdit.vue";
import MetaCodeDialogEdit from "@/components/meta/code/MetaCodeDialogEdit.vue";

import {
	getGlobalProperties,
	isWriteYn,
	isReadYn,
} from "@/assets/js/common.js";
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";
import dayjs from 'dayjs';

const store = useStore();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;

const dialogVisibleEdit = ref(false);
const subDialogVisibleEdit = ref(false);

const upperMetaCodeGroupList = ref([]);
const upperMetaCodeList = ref([]);

const state = reactive({
	metaCodeGroupList: [],
	metaCodeList: [],
	pageInfo: {
		mtcdGrpId: "",
		mtcdGrpNm: "",
		mtcdGrpUseYn: "",
		upMtcdGrpId: "",
		mtcd: "",
		mtcdNm: "",	
		curPage: 1,
		totalListSize: 0,
		pageListSize: 5,
		blockSize: 5,
	},
	subPageInfo: {
		mtcdGrpId: "",
		mtcd: "",
		mtcdNm: "",

		curPage: 1,
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	},
	selectedMtcdGrpId: "",
	selectedMtcdGrpNm: "",
	selectedRowUpMtcdGrpId: "",
});

onMounted(() => {

	initMetaCodeGroup();

	$emitter.on("initMetaCodeGroupList", () => {
		initMetaCodeGroup();
	});

	$emitter.on("initMetaCodeList", () => {
		initMetaCode();
	});
});

const initMetaCodeGroup = () => {
	getMetaCodeGroupList();
	getUpperMetaCodeGroupList();
};

const initMetaCode = () => {
	getMetaCodeList();
	getUpperMetaCodeList();
	getUpperMetaCodeGroupList();
};

const getMetaCodeGroupList = () => {

	$axios
		.get($apiUrls.meta.portal.code.getCodegroupList, {
			params: {
				curPage: state.pageInfo.curPage,
				pageListSize: state.pageInfo.pageListSize,
				mtcdGrpId: state.pageInfo.mtcdGrpId,
				mtcdGrpNm: state.pageInfo.mtcdGrpNm,
				mtcdGrpUseYn: state.pageInfo.mtcdGrpUseYn,
				upMtcdGrpId: state.pageInfo.upMtcdGrpId,
				mtcd: state.pageInfo.mtcd,
				mtcdNm: state.pageInfo.mtcdNm,
			},
		})
		.then((res) => {
			state.metaCodeGroupList = res.data.list;
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getMetaCodeList = () => {

	$axios
		.get(util.format($apiUrls.meta.portal.code.getCodeList, state.selectedMtcdGrpId), {
			params: {
				curPage: state.subPageInfo.curPage,
				mtcd: state.subPageInfo.mtcd,
				mtcdNm: state.subPageInfo.mtcdNm
			},
		})
		.then((res) => {
			state.metaCodeList = res.data.list;
			state.subPageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			initSubPageInfo(0);
			console.log(err);
		});
};

const getUpperMetaCodeGroupList = async () => {

	await store.dispatch("MetaStore/getAllMetaCodeGroupList", {
		axios: $axios,
		apiUrls: $apiUrls
	});

	const UpperMetaCodeGroupList = store.getters["MetaStore/getSotreAllMetaCodeGroupList"]; //no parameter
	upperMetaCodeGroupList.value = UpperMetaCodeGroupList;
};

const getUpperMetaCodeList = async () => {
	if (!state.selectedRowUpMtcdGrpId?.trim()) {
		return;
	}

	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: [state.selectedRowUpMtcdGrpId],
		},
	});

	let UpperMetaCodeList = store.getters["MetaStore/getStoreMetaCodeList"](state.selectedRowUpMtcdGrpId);
	upperMetaCodeList.value = UpperMetaCodeList;
};

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	initSubPageInfo(payload);
	getMetaCodeGroupList();
};

const subPageMove = (payload) => {
	state.subPageInfo.curPage = payload;
	getMetaCodeList();
};

const searchMetaCodeGroup = (payload) => {
	state.pageInfo.curPage = payload.curPage;
	state.pageInfo.mtcdGrpId = payload.pageInfo.mtcdGrpId;
	state.pageInfo.mtcd = payload.pageInfo.mtcd;
	state.pageInfo.mtcdGrpNm = payload.pageInfo.mtcdGrpNm;
	state.pageInfo.mtcdNm = payload.pageInfo.mtcdNm;

	initSubPageInfo(payload);
	getMetaCodeGroupList();
};

const searchMetaCode = (payload) => {
	initSubPageInfo(payload);
	getMetaCodeList();
	getUpperMetaCodeList();
};

const initSubPageInfo = (payload) => {

	if (!payload.selectedRow) {
		state.selectedMtcdGrpId = "";
		state.selectedMtcdGrpNm = "";
		state.selectedRowUpMtcdGrpId = "";

		state.subPageInfo.mtcdGrpId = "";
		state.subPageInfo.mtcd = "";
		state.subPageInfo.mtcdNm = "";

		state.subPageInfo.curPage = 1;
		state.subPageInfo.totalListSize = 0;
		state.subPageInfo.pageListSize = 10;
		state.subPageInfo.blockSize = 5;
	} else {
		state.selectedMtcdGrpId = payload.selectedRow.mtcdGrpId;
		state.selectedMtcdGrpNm = payload.selectedRow.mtcdGrpNm;
		state.selectedRowUpMtcdGrpId = payload.selectedRow.upMtcdGrpId;

		state.subPageInfo.curPage = 1;
		state.subPageInfo.mtcdGrpId = payload.selectedRow.mtcdGrpId;
		state.subPageInfo.mtcdNm = payload.selectedRow.mtcdNm;
		state.subPageInfo.mtcd = payload.selectedRow.mtcd;

		getUpperMetaCodeGroupList();
		getUpperMetaCodeList();
	}
};

const editMetaCodeGroupInfo = () => {
	initMetaCodeGroup();
	dialogVisibleEdit.value = false;
};

const editMetaCodeInfo = () => {
	initMetaCode();
	subDialogVisibleEdit.value = false;
};

const cancelDialog = () => {
	dialogVisibleEdit.value = false;
};

const cancelSubDialog = () => {
	subDialogVisibleEdit.value = false;
};

</script>
<style lang="scss"></style>
