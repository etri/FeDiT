<template>
<!-- 메타데이터 관리 -->
	<div class="cntSec flex-container">
		<div class="container-items-left">
			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 모델</h3>
					<div class="btnSec taR">
						<el-button type="primary" v-if="isWriteYn(route.meta.auth)" @click="initMetadataEditInfo">메타데이터 셋 등록</el-button>
					</div>
				</div>
				<div class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">

						<el-dialog v-model="dialogVisibleEditDt" title="디지털트윈 등록">
							<DigitalTwinDialogEdit :model="state.selectedModel" @cancelDialog="cancelDialogDt"
								@editMetadataSetInfo="editMetadataSetInfo" :countryCodeList="countryCodeList" :idSchmDtList="idSchmDtList" />
						</el-dialog>

						<el-dialog v-model="dialogVisibleEditSet" title="메타데이터 셋 등록">
							<MetadataSetDialogEdit :model="state.selectedModel" @cancelDialog="cancelDialogSet"
								@editMetadataSetInfo="editMetadataSetInfo2" :countryCodeList="countryCodeList" :idSchmObjectList="idSchmObjectList" :idSchm3dCdList="idSchm3dCdList" />
						</el-dialog>

						<!-- tree list -->
						<MetadataModelList :metadataModelItemList="state.metadataModelItems"
							@chooseMetadataModel="chooseMetadataModel" />
					</div>
				</div>
			</div>
		</div>

		<div class="container-items-right">

			<div class="boxSectionTit" style="margin-top: 0">
				<div v-if="!state.selectedModel.modelNm">
					<h3>메타데이터 모델을 선택하세요.</h3>
				</div>
				<div v-else>
					<h3>[{{ state.selectedModel.modelNm }}] &nbsp; {{ state.selectedModel.modelLogicNm }} </h3>
				</div>
			</div>

			<MetadataSetSearchForm 
				ref="searchInfo" :dataStatusList="dataStatusList" :typeModelList="typeModelList"
				:modelId="state.pageInfo.modelId" :typeModelId="state.pageInfo.typeModelId"
				@searchMetadataSetList="searchMetadataSetList"
				@refreshModelId="refreshModelId" />
				
			<div class="boxLayout">
				<div class="boxTit">
					<h3>검색 결과</h3>
				</div>
				<div class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<MetadataSetList :metadataSetList="state.metadataSetList" :totalPage="state.pageInfo.totalListSize"
							:curPage="state.pageInfo.curPage" @detailMetadataSet="detailMetadataSet" @pageMove="pageMove" />
					</div>
				</div>
			</div>
		</div>

	</div>
</template>
<script setup>
import MetadataSetList from '@/components/meta/dataset/MetadataSetList.vue';
import DigitalTwinDialogEdit from '@/components/meta/dt/DigitalTwinDialogEdit.vue';
import MetadataSetDialogEdit from "@/components/meta/dataset/MetadataSetDialogEdit.vue";

import MetadataModelList from '@/components/meta/dataset/MetadataModelList.vue';
import MetadataSetSearchForm from '@/components/meta/dataset/MetadataSetSearchForm.vue';

import { onMounted, reactive, ref, getCurrentInstance, computed } from "vue";
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

const dialogVisibleEditDt = ref(false);
const dialogVisibleEditSet = ref(false);

const countryCodeList = ref([]);
const idSchmDtList = ref([]);
const idSchmObjectList = ref([]);
const typeModelList = ref([]);
const user = getUser();

const state = reactive({
	metadataSetList: [],
	metadataModelItems: [],
	pageInfo: {
		curPage: 1,
		srchStartDd: "",
		srchEndDd: "",
		ctgryId: "",
		ctgryNm: "",
		agntId: "",
		agntNm: "",
		keyword: "",
		typeModelId: "",
		modelId: "",
		medataSetSttusMtcd: "",
		medataSetRegrId: "",
		medataSetId: "",
		srchText: "",
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	},
	selectedModel: {}
});

onMounted(() => {
	getMetaCodeList();
	getCountryCodeList();
	getIdSchmDtList();
	getIdSchmObjectList();
	getMetadataSetList();
	getMetadataModelItemList();
	getTypeModelList();
});

const getMetaCodeList = async () => {
	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00001", "MCG00030"],
		},
	});
};
const dataStatusList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00001")
);
const idSchm3dCdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00030")
);

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

const getIdSchmObjectList = async () => {

	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00029"],
		},
	});

	const List = store.getters["MetaStore/getStoreMetaCodeList"]("MCG00029");
	idSchmObjectList.value = [];
	for(var i=0; i < List.length; i++) {
		if(List[i].upMtcd === "id_schm_object") {
			idSchmObjectList.value.push(List[i]);
		}
	}
};

const getTypeModelList = () => {
	$axios
		.get($apiUrls.meta.data.type.getTypeModelList, {
			params: {
				isPaging: false,
				searchMode: "type",
				modelDataSttusMtcd: "use"
			},
		})
		.then((res) => {
			typeModelList.value = res.data.list;
		})
		.catch((err) => {
			console.log(err);
		});
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
				medataSetId: state.pageInfo.medataSetId,
				medataSetSttusMtcd: state.pageInfo.medataSetSttusMtcd,
				srchText: state.pageInfo.srchText,
				typeModelId: state.pageInfo.typeModelId,
				modelId: state.pageInfo.modelId,
			},
		})
		.then((res) => {
			state.pageInfo.totalListSize = res.data.page.totalListSize;			
			state.metadataSetList = res.data.list.map((x) => {
				x.medataSetAmdDt = dayjs(x.medataSetAmdDt).format('YYYY-MM-DD');
				return x;
			});
		})
		.catch((err) => {
			console.log(err);
		});
};

const getMetadataModelItemList = () => {
	$axios
		.get($apiUrls.meta.resource.metadatasets.getMetadataModelsTree, {
			params: {
				modelDataSttusMtcd: "use",
				modelTypeMtcd: "object_type",
			},
		})
		.then((res) => {
			state.metadataModelItems = [res.data];
		})
		.catch((err) => {
			console.log(err);
		});
}

const searchMetadataSetList = (payload) => {
	console.log(JSON.stringify(payload));
	state.pageInfo.curPage = payload.curPage;
	state.pageInfo.srchStartDd = payload.pageInfo.srchStartDd;
	state.pageInfo.srchEndDd = payload.pageInfo.srchEndDd;
	state.pageInfo.medataSetSttusMtcd = payload.pageInfo.medataSetSttusMtcd;
	state.pageInfo.medataSetId = payload.pageInfo.medataSetId;
	state.pageInfo.srchText = payload.pageInfo.srchText;
	state.pageInfo.typeModelId = payload.pageInfo.typeModelId;
	state.pageInfo.modelId = payload.pageInfo.modelId;
	getMetadataSetList();
};

const editMetadataSetInfo = (payload) => {
	dialogVisibleEditDt.value = false;

	let platform = getCookie("pltfrmId");
	let query = { medataSetId: payload };
	routerPush(platform, "DigitalTwinDetailManagePage", query);
};

const editMetadataSetInfo2 = (payload) => {
	dialogVisibleEditSet.value = false;

	let platform = getCookie("pltfrmId");
	let query = { medataSetId: payload };
	routerPush(platform, "MetadataDetailManagePage", query);
};

const cancelDialogDt = () => {
	dialogVisibleEditDt.value = false;
};

const cancelDialogSet = () => {
	dialogVisibleEditSet.value = false;
};

const detailMetadataSet = (payload) => {
	if (isReadYn(route.meta.auth)) {
		let platform = getCookie("pltfrmId");

		let query = { medataSetId: payload.medataSetId, backPageName: 'MetadataListPage' };
		if (payload.typeModelId === 'DigitalTwin') {
			routerPush(platform, "DigitalTwinDetailManagePage", query);
		} else {
			routerPush(platform, "MetadataDetailManagePage", query);
		}
	} else {
		alert("읽기 권한이 없습니다.");
	}
};

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getMetadataSetList();
};

const searchInfo = ref(null);

const chooseMetadataModel = (payload) => {
	const pageInfo = searchInfo.value.pageInfo;
	state.pageInfo = { ...pageInfo };

	if (payload.modelId == 'Class') {
		state.selectedModel = {};
		state.pageInfo.modelId = '';
	} else if (payload.upModelId == 'Class') {
		state.selectedModel = payload;
		state.pageInfo.typeModelId = payload.modelId;
		state.pageInfo.modelId = "";
	} else {
		state.selectedModel = payload;
		state.pageInfo.typeModelId = "";
		state.pageInfo.modelId = payload.modelId;
	}

	getMetadataSetList();
};

const initMetadataEditInfo = () => {
	if (state.selectedModel == null || !state.selectedModel.modelId?.trim() || state.selectedModel.modelId == 'Class') {
		alert('메타데이터를 등록할 모델을 선택해 주세요');
		return;
	}

	if (state.selectedModel.typeModelId === 'DigitalTwin') {
		dialogVisibleEditDt.value = true;
	} else {
		dialogVisibleEditSet.value = true;
	}
};

const refreshModelId = () => {
	state.selectedModel = {};
	state.pageInfo.modelId = "";
};

</script>
<style lang="scss" scoped>
.flex-container {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-around;
}

.container-items-left {
	width: 35%;
	/* 540px; */
	margin-right: 20px;
}

.container-items-right {
	width: calc(65% - 20px);
}

.container-items {
	flex-grow: 1;
	flex-shrink: 1;
	flex-basis: 300px;
}
</style>