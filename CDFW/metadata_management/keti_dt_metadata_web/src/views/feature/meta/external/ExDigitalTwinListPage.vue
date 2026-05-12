<template>
	<div>

		<div class="cntSec">
			<DigitalTwinSearchForm :dataStatusList="dataStatusList" :user="user" @searchMetadataSet="searchMetadataSet" />

			<div class="btnSec taR mt10">
				<el-button type="primary" size="large" 
					@click="dialogVisibleEdit = true">등록</el-button>
			</div>
				<el-dialog v-model="dialogVisibleEdit" title="디지털트윈 등록">
					<DigitalTwinDialogEdit @cancelDialog="cancelDialog" @editMetadataSetInfo="editMetadataSetInfo" 
						:countryCodeList="countryCodeList" :idSchmDtList="idSchmDtList"/>
				</el-dialog>

			<div class="boxLayout">
				<div class="boxTit">
					<h3>디지털트윈 목록</h3>
				</div>
				<div class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<DigitalTwinList :metadataSetList="state.metadataSetList" :totalPage="state.pageInfo.totalListSize"
							:curPage="state.pageInfo.curPage" @detailMetadataSet="detailMetadataSet" @pageMove="pageMove" />
					</div>
				</div>
			</div>
		</div>

	</div>
</template>
<script setup>
import DigitalTwinSearchForm from '@/components/meta/dt/DigitalTwinSearchForm.vue';
import DigitalTwinList from '@/components/meta/dt/DigitalTwinList.vue';
import DigitalTwinDialogEdit from '@/components/meta/dt/DigitalTwinDialogEdit.vue';

import { onMounted, reactive, ref, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import {
	getGlobalProperties,
	isWriteYn,
	isReadYn,
	routerPush,
	getCookie
} from "@/assets/js/common.js";
import dayjs from 'dayjs';
import { getUser } from "@/assets/js/auth.js";

const store = useStore();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;

const dialogVisibleEdit = ref(false);
const dataStatusList = ref([]);
const countryCodeList = ref([]);
const idSchmDtList = ref([]);
const user = getUser(); //login user

const state = reactive({
	metadataSetList: [],
	pageInfo: {
		curPage: 1,
		srchStartDd: "",
		srchEndDd: "",
		ctgryId: "",
		ctgryNm: "",
		agntId: "",
		agntNm: "",
		keyword: "",
		modelId: "",
		medataSetSttusMtcd: "",
		medataSetRegrId: "",
		srchText: "",
		typeModelId: "DigitalTwin",

		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	}
});

onMounted(() => {
	getMetaCodeList();
	getCountryCodeList();
	getIdSchmDtList();
	getMetadataSetList();
});

const getMetaCodeList = async () => {

	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00001"],
		},
	});

	const List = store.getters["MetaStore/getStoreMetaCodeList"]("MCG00001");
	dataStatusList.value = List;
};

const getCountryCodeList = async () => {
  await store.dispatch("MetaStore/getCountryCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
  });

  const CountryCodeList = store.getters["MetaStore/getStoreCountryCodeList"];
  countryCodeList.value = CountryCodeList;
};

const getIdSchmDtList = async () => {

	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00029"],
		},
	});

	const List = store.getters["MetaStore/getStoreMetaCodeList"]("MCG00029");
	idSchmDtList.value = [];
	for(var i=0; i < List.length; i++) {
		if(List[i].upMtcd === "id_schm_dt") {
			idSchmDtList.value.push(List[i]);
		}
	}
};

const getMetadataSetList = () => {
	$axios
		.get($apiUrls.meta.resource.metadatasets.getMetadataSetList, {
			params: {
				curPage: state.pageInfo.curPage,
				srchStartDd: state.pageInfo.srchStartDd,
				srchEndDd: state.pageInfo.srchEndDd,
				keyword: state.pageInfo.keyword,
				ctgryId: state.pageInfo.ctgryId,
				agntId: state.pageInfo.agntId,
				medataSetRegrId: state.pageInfo.medataSetRegrId,
				medataSetSttusMtcd: state.pageInfo.medataSetSttusMtcd,
				modelId: state.pageInfo.modelId,
				srchText: state.pageInfo.srchText,
				typeModelId: state.pageInfo.typeModelId,
			},
		})
		.then((res) => {
			state.metadataSetList = res.data.list.map((x) => {
				x.medataSetAmdDt = dayjs(x.medataSetAmdDt).format('YYYY-MM-DD');
				return x;
			});
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const searchMetadataSet = (payload) => {
	state.pageInfo.curPage = payload.curPage;
	state.pageInfo.srchStartDd = payload.pageInfo.srchStartDd;
	state.pageInfo.srchEndDd = payload.pageInfo.srchEndDd;
	state.pageInfo.ctgryId = payload.pageInfo.ctgryId;
	state.pageInfo.agntId = payload.pageInfo.agntId;
	state.pageInfo.keyword = payload.pageInfo.keyword;
	state.pageInfo.modelId = payload.pageInfo.modelId;
	state.pageInfo.medataSetSttusMtcd = payload.pageInfo.medataSetSttusMtcd;
	state.pageInfo.medataSetRegrId = payload.pageInfo.medataSetRegrId;
	state.pageInfo.srchText = payload.pageInfo.srchText;
	getMetadataSetList();
};

const editMetadataSetInfo = (payload) => {
	dialogVisibleEdit.value = false;

	let platform = 'meta'; // getCookie("pltfrmId");
	let query = { medataSetId: payload, backPageName: 'ExDigitalTwinListPage' };
	routerPush(platform, "ExDigitalTwinDetailManagePage", query);

	// router.push({
	// 	path: '/loginpass',
	// 	query: {
	// 		to: `/meta/exmanage/dt/detail?medataSetId=${payload}`,
	// 	}
	// });
};

const cancelDialog = () => {
	dialogVisibleEdit.value = false;
};

const detailMetadataSet = (payload) => {
	if (!route.meta?.auth || isReadYn(route.meta.auth)) {
		let platform = 'meta'; // getCookie("pltfrmId");
		let query = { medataSetId: payload.medataSetId, backPageName: 'ExDigitalTwinListPage' };
		if (payload.typeModelId === 'DigitalTwin') {
			routerPush(platform, "ExDigitalTwinDetailManagePage", query);
		} else {
			routerPush(platform, "ExDigitalTwinDetailManagePage", query);
		}
	} else {
		alert("읽기 권한이 없습니다.");
	}
};

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getMetadataSetList();
};

</script>
<style lang="scss"></style>
