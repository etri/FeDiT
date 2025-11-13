<template>
	<div class="cntSec">

		<KsicCodeSearchForm @searchKsicCodeList="searchKsicCodeList" :ksicCodeLctgCodeList="state.ksicCodeLctgCodeList" :lctgExtrCd = "state.pageInfo.lctgExtrCd" />

		<div class="btnSec taR mt10">
			<el-button type="primary" size="large" v-if="isWriteYn(route.meta.auth)" 
				@click="dialogVisibleEdit = true">등록</el-button>
		</div>

		<el-dialog v-model="dialogVisibleEdit" title="식별체계 - 표준산업분류 코드 등록">
			<KsicCodeDialogEdit @cancelDialog="cancelDialog" @editKsicCodeInfo="editKsicCodeInfo" :dataStatusList="dataStatusList"/>
		</el-dialog>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>표준산업분류 코드 목록</h3>
			</div>
			<div class="boxCnt">
				<div style="overflow-x: hidden; overflow-y: auto">
					<KsicCodeList :ksicCodeList="state.ksicCodeList" :dataStatusList="dataStatusList" :totalPage="state.pageInfo.totalListSize" 
								  :curPage="state.pageInfo.curPage" @pageMove="pageMove" @editKsicCodeInfo="editKsicCodeInfo" />
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import KsicCodeDialogEdit from '@/components/meta/ksiccode/KsicCodeDialogEdit.vue';
import KsicCodeSearchForm from '@/components/meta/ksiccode/KsicCodeSearchForm.vue';
import KsicCodeList from '@/components/meta/ksiccode/KsicCodeList.vue';

import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { getGlobalProperties, isWriteYn, isReadYn } from "@/assets/js/common.js";

const store = useStore();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;

const dialogVisibleEdit = ref(false);
const dataStatusList = ref([]);

const state = reactive({
	ksicCodeList: [],
	ksicCodeLctgCodeList: [],
	pageInfo: {
		curPage: 1,
		lctgExtrCd: "",
		idSchmCd: "",
		idSchmCdNm: "",
		idfyUseYn: "",
		useYn: "",
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	},
});

onMounted(() => {
	getIdSchemeStdIndLctgCodeList();
	getMetaCodeList();
});

const editKsicCodeInfo = () => {
	getIdSchemeStdIndLctgCodeList();
	getMetaCodeList();
};

const getKsicCodeList = () => {
	$axios
		.get($apiUrls.meta.schema.idschemecode.getIdSchemeStdIndCodeList, {
			params: {
				curPage: state.pageInfo.curPage,
				lctgExtrCd: state.pageInfo.lctgExtrCd,
				idSchmCd: state.pageInfo.idSchmCd,
				idSchmCdNm: state.pageInfo.idSchmCdNm,
				idfyUseYn: state.pageInfo.idfyUseYn,
				useYn: state.pageInfo.useYn,
			},
		})
		.then((res) => {
			state.ksicCodeList = res.data.list;
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getIdSchemeStdIndLctgCodeList = () => {
	$axios
		.get($apiUrls.meta.schema.idschemecode.getIdSchemeStdIndLctgCodeList)
		.then((res) => {
			state.ksicCodeLctgCodeList = res.data;
			// if(state.pageInfo.lctgExtrCd === "") {
			// 	state.pageInfo.lctgExtrCd = res.data[0].lctgExtrCd;
			// }
			getKsicCodeList();
		})
		.catch((err) => {
			console.log(err);
		});
};

const searchKsicCodeList = (payload) => {
	state.pageInfo.curPage = payload.curPage;
	state.pageInfo.lctgExtrCd = payload.pageInfo.lctgExtrCd;
	state.pageInfo.idSchmCd = payload.pageInfo.idSchmCd;
	state.pageInfo.idSchmCdNm = payload.pageInfo.idSchmCdNm;
	state.pageInfo.idfyUseYn = payload.pageInfo.idfyUseYn;
	state.pageInfo.useYn = payload.pageInfo.useYn;
	getKsicCodeList();
};

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getKsicCodeList();
}

const getMetaCodeList = async () => {
	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00027"],
		},
	});

	const List = store.getters["MetaStore/getStoreMetaCodeList"]("MCG00027");
	dataStatusList.value = List;
};

const cancelDialog = () => {
	dialogVisibleEdit.value = false;
}

</script>
<style lang="scss"></style>