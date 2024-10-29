<template>
	<div class="cntSec">

		<PbrcCodeSearchForm @searchPbrcCodeList="searchPbrcCodeList" :pbrcCodeLctgCodeList="state.pbrcCodeLctgCodeList" :lctgExtrCd = "state.pageInfo.lctgExtrCd" />

		<div class="btnSec taR mt10">
			<el-button type="primary" size="large" v-if="isWriteYn(route.meta.auth)" 
				@click="dialogVisibleEdit = true">등록</el-button>
		</div>

			
		<el-dialog v-model="dialogVisibleEdit" title="식별체계 - 공공자원분류 코드 등록">
			<PbrcCodeDialogEdit @cancelDialog="cancelDialog" @editPbrcCodeInfo="editPbrcCodeInfo" :dataStatusList="dataStatusList"/>
		</el-dialog> 
	

		<div class="boxLayout">
			<div class="boxTit">
				<h3>공공자원분류 코드 목록</h3>
			</div>
			<div class="boxCnt">
				<div style="overflow-x: hidden; overflow-y: auto">
					<PbrcCodeList :pbrcCodeList="state.pbrcCodeList" :dataStatusList="dataStatusList" :totalPage="state.pageInfo.totalListSize" 
								  :curPage="state.pageInfo.curPage" @pageMove="pageMove" @editPbrcCodeInfo="editPbrcCodeInfo" />
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import PbrcCodeDialogEdit from '@/components/meta/pbrccode/PbrcCodeDialogEdit.vue';
import PbrcCodeSearchForm from '@/components/meta/pbrccode/PbrcCodeSearchForm.vue';
import PbrcCodeList from '@/components/meta/pbrccode/PbrcCodeList.vue';

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
	pbrcCodeList: [],
	pbrcCodeLctgCodeList: [],
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
	getIdSchemePubRiLctgCodeList();
	getMetaCodeList();
});

const editPbrcCodeInfo = () => {
	getIdSchemePubRiLctgCodeList();
	getMetaCodeList();
};

const getPbrcCodeList = () => {
	$axios
		.get($apiUrls.meta.schema.idschemecode.getIdSchemePubRiCodeList, {
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
			state.pbrcCodeList = res.data.list;
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getIdSchemePubRiLctgCodeList = () => {
	$axios
		.get($apiUrls.meta.schema.idschemecode.getIdSchemePubRiLctgCodeList)
		.then((res) => {
			state.pbrcCodeLctgCodeList = res.data;
			// if(state.pageInfo.lctgExtrCd === "") {
			// 	state.pageInfo.lctgExtrCd = res.data[0].lctgExtrCd;
			// }
			getPbrcCodeList();
		})
		.catch((err) => {
			console.log(err);
		});
};

const searchPbrcCodeList = (payload) => {
	state.pageInfo.curPage = payload.curPage;
	state.pageInfo.lctgExtrCd = payload.pageInfo.lctgExtrCd;
	state.pageInfo.idSchmCd = payload.pageInfo.idSchmCd;
	state.pageInfo.idSchmCdNm = payload.pageInfo.idSchmCdNm;
	state.pageInfo.idfyUseYn = payload.pageInfo.idfyUseYn;
	state.pageInfo.useYn = payload.pageInfo.useYn;
	getPbrcCodeList();
};

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getPbrcCodeList();
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
	dataStatusList.value = [];
	for(var i=0; i<2; i++) { // 중분류 까지만
		dataStatusList.value.push(List[i]);
	}
};

const cancelDialog = () => {
	dialogVisibleEdit.value = false;
}

</script>
<style lang="scss"></style>