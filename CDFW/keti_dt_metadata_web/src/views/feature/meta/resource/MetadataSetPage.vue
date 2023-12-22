<template>
	<div class="cntSec meta-resource-detail-page">

		<div class="boxSectionTit" style="margin-top: 0">
			<h3>{{ state.medataSet.medataSetNm }}</h3>
		</div>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 정보</h3>
				<div class="btnSec taR">
					<el-button type="primary" plain @click="goToBackPage">뒤로</el-button>
				</div>
			</div>
			<div class="boxCnt">
				<div class="ly-table" v-if="!isNotFound">					

					<el-form label-width="240px" label-position="right">
						<template v-for="generalProperty of state.generalPropertyObj" :key="prptyNm">
							<el-row v-if="generalProperty.prptyScrnIndcYn == 'Y'">
								<el-col :span="24">
									<el-form-item :label="generalProperty.prptyLogicNm">
										<div class="inline-area">
											<div class="sub-label">{{ generalProperty.prptyNm }}</div>
											<div class="sub-cont">
												<MetadataSetProperty :generalProperty="generalProperty" :medataSet="state.medataSet" :dataMap="state.dataMap[generalProperty.prptyNm]" @goToResourcePage="goToResourcePage" />
											</div>
										</div>
									</el-form-item>
								</el-col>
							</el-row>
						</template>
					</el-form>

				</div>
			</div>
		</div>

	</div>
</template>
<script setup>
import MetadataSetProperty from "@/components/meta/resource/MetadataSetProperty.vue";

import { reactive, ref, onMounted, getCurrentInstance, watch, onBeforeMount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getGlobalProperties, isReadYn, isEmpty, getCookie, routerPush } from "@/assets/js/common.js";
import { useStore } from "vuex";
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
			const { medataSet, dataList, modelInfo } = res.data;

			if (medataSet == null) {
				isNotFound.value = true;
				return;
			}
			isNotFound.value = false;
			
			state.medataSet = medataSet;
			state.modelInfo = modelInfo;			
			state.metadataInfoList = dataList;

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
};

const goToResourcePage = (medataSetId) => {
	if (medataSetId) router.push(medataSetId);
};

const goToBackPage = () => {
	router.back();
};

</script>
<style lang="css">
.meta-resource-detail-page .ly-table .el-form-item__content { margin-left: 0; }
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
}
</style>