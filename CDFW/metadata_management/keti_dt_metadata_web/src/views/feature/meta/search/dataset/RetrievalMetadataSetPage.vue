<template>
	<div class="cntSec">

		<div class="boxSectionTit" style="margin-top: 0">
			<h3>{{ medataSet.medataSetNm }}</h3>
		</div>

		<div v-if="medataSet.typeModelId !== 'DigitalTwin'" class="boxLayout">
			<div class="boxTit">
				<h3>디지털트윈</h3>
			</div>
			<div class="boxCnt">
				<div style="overflow-x: hidden; overflow-y: auto">
					<UpperDigitalTwinList :upperMetadataSetDtwListBySubSetId="state.upperMetadataSetDtwListBySubSetId"
						:backPageName="'RetrievalMetadataSetPage'" />
				</div>
			</div>
		</div>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>기본 정보</h3>
				<div class="btnSec taR">
					<MetadataPopover :medataSet="medataSet" />
					<el-button type="primary" plain @click="metaCommon.Buttons.metadataResourcePage.click(medataSet.medataSetId)" >{{ metaCommon.Buttons.metadataResourcePage.label }}</el-button>

					<el-button type="primary" plain v-show="isReadYn(route.meta.auth)" @click="getRdfStr">RDF 확인</el-button>
					<el-button type="default" @click="gotoList">목록</el-button>
				</div>
			</div>
			<div class="boxCnt">
				<div class="ly-table">
					<MetadataSetBasicInfo :medataSet="medataSet" />
				</div>
			</div>
		</div>

		<div class="boxLayout" v-show="state.metadataInfoList.length > 0">
			<div class="boxTit">
				<h3>메타데이터 정보</h3>
			</div>
			<div class="boxCnt">
				<div class="ly-table">
					<MetadataNameValueList :metadataInfoList="state.metadataInfoList" />
				</div>
			</div>
		</div>

		<div>
			<el-dialog v-model="dialogVisibleRdfSearch" title="메타데이터 RDF 확인">
				<RdfViewPopupPage
					:searchParam="medataSet"
					:emptyPrptyShowYn="emptyPrptyShowYn"
					:refreshKey="refreshKey"
				/> 
			</el-dialog>
		</div>

		<div class="boxLayout" v-for="prptyNm of state.geoJsonPropertyNmList" :key="prptyNm">
			<RetrievalGeneralProperty :generalProperty="state.arrayPropertyMap[prptyNm]" :medataSet="medataSet" />
		</div>

		<div class="boxLayout" v-for="prptyNm of state.jsonEtcPropertyNmList" :key="prptyNm">
			<RetrievalGeneralProperty :generalProperty="state.arrayPropertyMap[prptyNm]" :medataSetId="medataSet.medataSetId"
				:medataSet="medataSet" @selectedProperty="selectedProperty" />
		</div>

		<div class="boxLayout" v-for="prptyNm of state.arrayPropertyNmList" :key="prptyNm">
			<RetrievalGeneralProperty :generalProperty="state.arrayPropertyMap[prptyNm]" :medataSet="medataSet"
				:backPageName="'RetrievalMetadataSetPage'" />
		</div>

	</div>



	<el-dialog v-model="dialogLogInfo" title="프라퍼티 정보">
		<div class="dialog-area">
			<JsonEditorVue class="dialog_jsonEditor_setting" v-model="selectedInfo" v-bind="{
				readOnly: true,
				mode: 'text',
				theme: 'light',
				mainMenuBar: false,
				navigationBar: false,
				parser: undefined,
			}" />
		</div>
	</el-dialog>


</template>
<script setup>
import UpperDigitalTwinList from "@/components/meta/dataset/UpperDigitalTwinList.vue";
import MetadataSetBasicInfo from "@/components/meta/retrievaldt/MetadataSetBasicInfo.vue";
import MetadataNameValueList from "@/components/meta/retrievaldt/MetadataNameValueList.vue";
import RetrievalGeneralProperty from "@/components/meta/retrievaldt/RetrievalGeneralProperty.vue";
import RdfViewPopupPage from "@/views/feature/meta/setting/rdfmapping/RdfViewPopupPage.vue";
import MetadataPopover from "@/components/meta/dataset//MetadataPopover.vue";

import { reactive, ref, onMounted, getCurrentInstance, watch, onBeforeMount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getGlobalProperties, isReadYn, isEmpty, getCookie, routerPush } from "@/assets/js/common.js";
import util from "util";
import metaCommon from "@/assets/js/metaCommon.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;
const route = useRoute();
const router = useRouter();

const selectedInfo = ref({});
const dialogLogInfo = ref(false);
const medataSet = ref({});
const dialogVisibleRdfSearch = ref(false);
const emptyPrptyShowYn = ref("N");
const publicMedataSetInfo = ref({});
const refreshKey = ref({
  nowDate:  Date.now()
});

const state = reactive({
	upperMetadataSetDtwListBySubSetId: [],
	metadataInfoList: [],
	arrayPropertyNmList: [],
	arrayPropertyMap: {},
	geoJsonPropertyNmList: [],
	jsonEtcPropertyNmList: [],
});

watch(
	() => route.query.medataSetId,
	(cur, prev) => {
		if (!isEmpty(route.query.medataSetId)) initInfo();
	},
	{ deep: true }
)

onBeforeMount(async () => {
	await router.isReady();
	let medataSetId = route.query.medataSetId;

});

onMounted(() => {
	initInfo();
});

const getRdfStr = () => {
	refreshKey.value.nowDate = Date.now();
	dialogVisibleRdfSearch.value = true;
};

const initInfo = () => {
	getMetadataSetDtwListBySubSetId();
	getMetadataSetBasicInfo();
	getMetadataList();
	getModelInfoBySetId();
};

const getMetadataSetDtwListBySubSetId = () => {
	let medataSetId = route.query.medataSetId;
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataSetDtwListBySubSetId, medataSetId))
		.then((res) => {
			state.upperMetadataSetDtwListBySubSetId = res.data.list;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getMetadataSetBasicInfo = () => {
	let medataSetId = route.query.medataSetId;
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataSet, medataSetId))
		.then((res) => {
			medataSet.value = res.data;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getMetadataList = () => {
	let medataSetId = route.query.medataSetId;
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadatasetListForSave, medataSetId), {
			params: {
				cntPrptyYn: "N"
			}
		})
		.then((res) => {
			state.metadataInfoList = res.data;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getModelInfoBySetId = async () => {
	let medataSetId = route.query.medataSetId;
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getModelInfoBySetId, medataSetId))
		.then((res) => {

			state.arrayPropertyNmList = res.data.arrayPropertyNmList;
			state.geoJsonPropertyNmList = res.data.geoJsonPropertyNmList;
			state.jsonEtcPropertyNmList = res.data.jsonEtcPropertyNmList;
			state.generalPropertyMap = res.data.propertyMap;

			propertySet(state.geoJsonPropertyNmList, state.generalPropertyMap);
			propertySet(state.arrayPropertyNmList, state.generalPropertyMap);
			propertySet(state.jsonEtcPropertyNmList, state.generalPropertyMap);
		}).catch((err) => {
			console.log(err);
		});
};

const propertySet = (arrayPropertyNmList, generalPropertyMap) => {

	let medataSetId = route.query.medataSetId;
	for (let propertyNm of arrayPropertyNmList) {

		for (let property in generalPropertyMap) {

			if (propertyNm === generalPropertyMap[property].prptyNm) {

				let arrTypeProperty = { ...generalPropertyMap[property], propertyList: [], propertyListCnt: 0 };
				propertyListSetByPrptNm(medataSetId, propertyNm, arrTypeProperty);
			}
		}
	}
};

const propertyListSetByPrptNm = (medataSetId, propertyNm, arrTypeProperty) => {

	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataListBySetPropertyNm, medataSetId, propertyNm))
		.then((res) => {

			state.arrayPropertyMap[propertyNm].propertyList = res.data.list;
			state.arrayPropertyMap[propertyNm].propertyListCnt = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});

	state.arrayPropertyMap[propertyNm] = { ...arrTypeProperty }; 
};

const gotoList = () => {
	let platform = getCookie("pltfrmId");
	let query = null;
	routerPush(platform, "RetrievalMetadataSetListPage", query);
};

const selectedProperty = (payload) => {
	dialogLogInfo.value = true;
	selectedInfo.value = payload;
};

</script>
<style lang="scss"></style>