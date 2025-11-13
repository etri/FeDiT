<template>
	<div class="cntSec">

		<CountryCodeSearchForm @searchCountryCodeList="searchCountryCodeList" />

		<div class="btnSec taR mt10">
			<el-button type="primary" size="large" v-if="isWriteYn(route.meta.auth)" 
				@click="dialogVisibleEdit = true">등록</el-button>
		</div>

		<el-dialog v-model="dialogVisibleEdit" title="카테고리 등록">
			<CountryCodeDialogEdit :dataStatusList="dataStatusList" @cancelDialog="cancelDialog"
				@editCountryCodeInfo="editCountryCodeInfo" />
		</el-dialog>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>국가코드 목록</h3>
			</div>
			<div class="boxCnt">
				<div style="overflow-x: hidden; overflow-y: auto">
					<CountryCodeList :countryCodeList="state.countryCodeList" :totalPage="state.pageInfo.totalListSize"
						:dataStatusList="dataStatusList" :curPage="state.pageInfo.curPage" @pageMove="pageMove" />
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import CountryCodeDialogEdit from '@/components/meta/countrycode/CountryCodeDialogEdit.vue';
import CountryCodeSearchForm from '@/components/meta/countrycode/CountryCodeSearchForm.vue';
import CountryCodeList from '@/components/meta/countrycode/CountryCodeList.vue';

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
	countryCodeList: [],
	pageInfo: {
		curPage: 1,
		cntryCd: "",
		cntryNm: "",
		cntryDataSttusMtcd: "",
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	},
});

onMounted(() => {
	getMetaCodeList();
	getCountryCodeList();

	$emitter.on("initCountryCodeList", () => {
		getCountryCodeList();
	});
});

const getMetaCodeList = async () => {

	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00002"],
		},
	});

	const List = store.getters["MetaStore/getStoreMetaCodeList"]("MCG00002");
	dataStatusList.value = List;
};

const getCountryCodeList = () => {
	$axios
		.get($apiUrls.meta.portal.countrycode.getCountryCodeList, {
			params: {
				curPage: state.pageInfo.curPage,
				cntryCd: state.pageInfo.cntryCd,
				cntryNm: state.pageInfo.cntryNm,
			},
		})
		.then((res) => {
			state.countryCodeList = res.data.list;
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const searchCountryCodeList = (payload) => {
	state.pageInfo.curPage = payload.curPage;
	state.pageInfo.cntryCd = payload.pageInfo.cntryCd;
	state.pageInfo.cntryNm = payload.pageInfo.cntryNm;
	getCountryCodeList();
};

const editCountryCodeInfo = () => {
	getCountryCodeList();
	dialogVisibleEdit.value = false;
};

const cancelDialog = () => {
	dialogVisibleEdit.value = false;
}

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getCountryCodeList();
}

</script>
<style lang="scss"></style>