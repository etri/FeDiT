<template>
	<div class="cntSec meta-external-detail-page">

		<div class="boxSectionTit" style="margin-top: 0">
			<h3>{{ state.medataSet.medataSetNm }}</h3>
		</div>

		<div v-if="state.medataSet.typeModelId !== 'DigitalTwin'" class="boxLayout">
			<div class="boxTit">
				<h3>디지털트윈</h3>
			</div>
			<div class="boxCnt">
				<div> <!-- style="overflow-x: hidden; overflow-y: auto" -->
					<UpperDigitalTwinList :upperMetadataSetDtwListBySubSetId="state.upperMetadataSetDtwListBySubSetId" backPageName="ExMetadataPage" />
				</div>
			</div>
		</div>
		
		<!-- 여기서는 보여주지 말자 
		<div class="boxLayout">
			<div class="boxTit">
				<h3>기본 정보</h3>
				<div class="btnSec taR">
					<el-button type="primary" plain @click="goListPage">목록</el-button>
				</div>
			</div>
			<div class="boxCnt">
				<div class="ly-table" v-if="!isNotFound">
					<MetadataSetBasicInfo :medataSet="state.medataSet" />
				</div>
			</div>
		</div>		
		-->

		<div class="boxLayout" v-if="!isNotFound">
			<div class="boxTit">
				<h3>메타데이터 정보</h3>
				<div class="btnSec taR">
					<el-button type="primary" plain @click="goListPage">목록</el-button>
				</div>
			</div>
			<div class="boxCnt">
				<div class="ly-table">					
					<MetadataNameValueList :metadataInfoList="state.metadataInfoList" backPageName="ExMetadataPage" />
				</div>
			</div>
		</div>

		<template v-if="!isNotFound" v-for="prptyNm of state.geoJsonPropertyNmList" :key="prptyNm">
			<div class="boxLayout" v-if="state.dataMap[prptyNm].prptyScrnIndcYn == 'Y'">
				<RetrievalGeneralProperty :generalProperty="state.dataMap[prptyNm]" 
					:medataSetId="state.medataSetId" 
					:medataSet="state.medataSet" 
					backPageName="ExMetadataPage"
					:isPublicApi="true"
					:minCntToDisplayButton="1" />
			</div>
		</template>

		<template v-if="!isNotFound" v-for="prptyNm of state.jsonEtcPropertyNmList" :key="prptyNm">
			<div class="boxLayout" v-if="state.dataMap[prptyNm].prptyScrnIndcYn == 'Y'">
				<RetrievalGeneralProperty :generalProperty="state.dataMap[prptyNm]" 
					:medataSetId="state.medataSetId" 
					:medataSet="state.medataSet" 
					backPageName="ExMetadataPage"
					:isPublicApi="true"
					:minCntToDisplayButton="1" />
			</div>
		</template>

		<template v-if="!isNotFound" v-for="prptyNm of state.arrayPropertyNmList" :key="prptyNm">
			<div class="boxLayout" v-if="state.dataMap[prptyNm].prptyScrnIndcYn == 'Y'">
				<RetrievalGeneralProperty :generalProperty="state.dataMap[prptyNm]" 
					:medataSetId="state.medataSetId" 
					:medataSet="state.medataSet" 
					backPageName="ExMetadataPage"
					:isPublicApi="true"
					:minCntToDisplayButton="1" />
			</div>
		</template>		

	</div>
</template>
<script setup>
import UpperDigitalTwinList from "@/components/meta/dataset/UpperDigitalTwinList.vue";
import MetadataSetBasicInfo from "@/components/meta/retrievaldt/MetadataSetBasicInfo.vue";
import MetadataNameValueList from "@/components/meta/retrievaldt/MetadataNameValueList.vue";
import RetrievalGeneralProperty from "@/components/meta/retrievaldt/RetrievalGeneralProperty.vue";

import { reactive, ref, onMounted, watch, onBeforeMount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const route = useRoute();
const router = useRouter();

const isNotFound = ref(false);

const state = reactive({
	medataSetId: '',
	medataSet: {},
	generalPropertyObj: {},
	metadataInfoList: [],
	arrayPropertyNmList: [],
	geoJsonPropertyNmList: [],
	jsonEtcPropertyNmList: [],
	dataMap: {},
	upperMetadataSetDtwListBySubSetId: [],
});

watch(
	() => route.path,
	(cur, prev) => {
		initInfo();
	},
	{ deep: true }
)

onBeforeMount(async () => {
	await router.isReady();
});

onMounted(() => {
	initInfo();
});

const initInfo = () => {
	state.medataSetId = route.params.medataSetId;
	getMetadataSetInfo(state.medataSetId);
};

const clearInfo = (cmd) => {
	if (cmd === 'all') {
		state.medataSetId = '';
		state.medataSet = {};
		state.generalPropertyObj = {};
	}
	state.metadataInfoList = [];
	state.arrayPropertyNmList = [];
	state.geoJsonPropertyNmList = [];
	state.jsonEtcPropertyNmList = [];	
	state.dataMap = {};	
	state.upperMetadataSetDtwListBySubSetId = [];
}

const getMetadataSetInfo = (medataSetId) => {

	for (let metadata of state.metadataInfoList) {
		state.dataMap[metadata.prptyNm] = { ...metadata };
		state.dataMap[metadata.prptyNm].propertyList = [];
		state.dataMap[metadata.prptyNm].propertyListCnt = 0;
	}

	$axios
		.get(util.format($apiUrls.publicpage.meta.resource.metadatasets.getMetadataSetInfo, medataSetId))
		.then((res) => {
			const { medataSet, dataList, modelInfo, dtwList } = res.data;

			if (medataSet == null) {
				isNotFound.value = true;
				return;
			}
			isNotFound.value = false;
			
			state.medataSet = medataSet;
			state.modelInfo = modelInfo;			
			state.metadataInfoList = dataList;
			state.upperMetadataSetDtwListBySubSetId = dtwList;

			if (state.modelInfo) {
				state.generalPropertyObj = state.modelInfo.propertyMap;	
				state.arrayPropertyNmList = state.modelInfo.arrayPropertyNmList;
				state.geoJsonPropertyNmList = state.modelInfo.geoJsonPropertyNmList;
				state.jsonEtcPropertyNmList = state.modelInfo.jsonEtcPropertyNmList;

				if (state.metadataInfoList) {
					for (let metadata of state.metadataInfoList) {
						state.dataMap[metadata.prptyNm] = { ...metadata };
						state.dataMap[metadata.prptyNm].propertyList = [];
						state.dataMap[metadata.prptyNm].propertyListCnt = 0;
					}
				}

				propertySet(medataSetId, state.geoJsonPropertyNmList, state.generalPropertyObj);
				propertySet(medataSetId, state.arrayPropertyNmList, state.generalPropertyObj);
				propertySet(medataSetId, state.jsonEtcPropertyNmList, state.generalPropertyObj);			
			} else {
				clearInfo('subdata');
			}
		})
		.catch((err) => {
			console.log(err);
		});
};

const propertySet = (medataSetId, propertyNmList, generalPropertyObj) => {
	for (let propertyNm of propertyNmList) {
		for (const prptyNm of Object.keys(generalPropertyObj)) {
			if (propertyNm === prptyNm) {
				state.dataMap[propertyNm] = {};
				state.dataMap[propertyNm].propertyList = [];
				state.dataMap[propertyNm].propertyListCnt = 0;
				propertyListSetByPrptNm(medataSetId, propertyNm, generalPropertyObj[prptyNm]);
			}
		}
	}
};

const propertyListSetByPrptNm = (medataSetId, propertyNm, generalProperty) => {

	$axios
		.get(util.format($apiUrls.publicpage.meta.resource.metadatasets.getMetadataListBySetPropertyNm, medataSetId, propertyNm), { params: { isPaging: false } })
		.then((res) => {

			state.dataMap[propertyNm].propertyList = res.data.list;
			state.dataMap[propertyNm].propertyListCnt = res.data.page.totalListSize;				
		})
		.catch((err) => {
			console.log(err);
		});

	state.dataMap[propertyNm] = { ...generalProperty }; 
};

const goListPage = () => {
	const query = route.query;
	router.push({path: '/meta/exsearch/list', query: query});
};

</script>
<style lang="css">
/* .meta-external-detail-page */


/* .meta-resource-detail-page .ly-table .el-form-item__content { margin-left: 0; }
.meta-resource-detail-page .sub-label {
	display: inline-flex;
	justify-content: flex-end;
	align-items: flex-start;
	flex: 0 0 auto;
	font-size: var(--el-form-label-font-size);
	color: var(--el-text-color-regular);
	line-height: 35px;

	width: 200px;
	padding: 0 10px;
	line-height: 35px;	
	height: auto;
	margin-left: 0;
	border-right: 1px solid #e5e5e5;
	background-color: #f8f8f8;
	box-sizing: border-box;
}
.meta-resource-detail-page .sub-cont {
	padding-left: 10px;
	width: 100%;
} */
</style>