<template>
	<div class="cntSec">

		<div class="boxSectionTit" style="margin-top: 0">
			<h3>{{ route.query.medataSetNm }} - {{ state.medata.prptyNm }}</h3>
		</div>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 셋 기본 정보</h3>
				<div class="btnSec taR">
					<el-button type="default" @click="gotoList">목록</el-button>
				</div>
			</div>
			<div class="boxCnt">
				<div class="ly-table">
					<MetadataSetBasicInfoForRetrievalMetadata :medataId="route.query.medataId"
						:medataSetId="route.query.medataSetId" />
				</div>
			</div>
		</div>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 프라퍼티 정보</h3>
			</div>
			<div class="boxCnt">
				<div class="ly-table">
					<el-form label-width="160px" label-position="right">
						<el-row>
							<el-col :span="12">
								<el-form-item label="프라퍼티">
									{{ state.medata.prptyNm }} &nbsp; {{ state.medata.prptyLogicNm }}
								</el-form-item>
							</el-col>
							<el-col :span="12">
								<el-form-item label="값 모델">
									{{ state.medata.valModelNm }} &nbsp; {{ state.medata.valModelLogicNm }}
								</el-form-item>
							</el-col>
						</el-row>
					</el-form>
				</div>
			</div>
		</div>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 값 정보 </h3>
			</div>
			<div class="boxCnt">
				<RetrievalCurrentGeneralProperty :generalProperty="state.currentPropertyInfo"
					:medataSetId="route.query.medataSetId" :propertyListCnt="state.propertyListCnt"
					:backPageName="'RetrievalMetadataPage'" />
			</div>
		</div>

		<div>
			<el-dialog v-model="dialogVisibleRdfSearch" title="메타데이터 RDF 확인">
				<RdfViewPopupPage
					:searchParam="state.medataSet"
					:emptyPrptyShowYn="emptyPrptyShowYn"
					:refreshKey="refreshKey"
				/> 
			</el-dialog>
		</div>

	</div>
</template>
<script setup>
import MetadataNameValueList from "@/components/meta/retrievaldt/MetadataNameValueList.vue";
import RetrievalGeneralProperty from "@/components/meta/retrievaldt/RetrievalGeneralProperty.vue";
import RetrievalCurrentGeneralProperty from "@/components/meta/retrievaldata/RetrievalCurrentGeneralProperty.vue";
import MetadataSetBasicInfoForRetrievalMetadata from "@/components/meta/retrievaldata/MetadataSetBasicInfoForRetrievalMetadata.vue";
import RdfViewPopupPage from "@/views/feature/meta/setting/rdfmapping/RdfViewPopupPage.vue";

import { reactive, onMounted, getCurrentInstance, ref } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties, isReadYn, isEmpty, getCookie, routerPush } from "@/assets/js/common.js";
import { useStore } from "vuex";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;
const store = useStore();
const route = useRoute();

const dialogVisibleRdfSearch = ref(false);
const emptyPrptyShowYn = ref("N");
const refreshKey = ref({
  nowDate:  Date.now()
});

const state = reactive({
	medataSet: {},
	medata: {},
	propertyListCnt: 0,
	currentPropertyInfo: {},
	propertyMap: {},
});

onMounted(() => {
	init();
});

const getRdfStr = () => {
	refreshKey.value.nowDate = Date.now();
	dialogVisibleRdfSearch.value = true;
};

async function init() {
	getMetadataSetBasicInfo();

	await getMetadataBasicInfo();
	await getModelInfoBySetId();
}

const getMetadataSetBasicInfo = () => {
	let medataSetId = route.query.medataSetId;
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataSet, medataSetId))
		.then((res) => {
			state.medataSet = res.data;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getMetadataBasicInfo = () => {

	return new Promise((resolve, reject) => {
		let medataId = route.query.medataId;
		$axios
			.get(util.format($apiUrls.meta.resource.metadatasets.getMetadata, medataId))
			.then((res) => {
				state.medata = res.data;
				resolve();
			})
			.catch((err) => {
				console.log(err);
			});
	});
};

const getModelInfoBySetId = () => {

	return new Promise((resolve, reject) => {
		let medataSetId = route.query.medataSetId;
		$axios
			.get(util.format($apiUrls.meta.resource.metadatasets.getModelInfoBySetId, medataSetId))
			.then((res) => {
				state.propertyMap = res.data.propertyMap;
				currentPropertySet(medataSetId, state.medata.prptyId, state.propertyMap);
				resolve();
			}).catch((err) => {
				console.log(err);
			});
	});
};

const currentPropertySet = (medataSetId, prptyId, propertyMap) => {
	for (let property in propertyMap) {
		if (property === propertyMap[prptyId].prptyId) {

			let currentProperty = {
				...propertyMap[prptyId],
				propertyList: [],
				propertyListCnt: 0
			};
			currentPropertyListSetByPrptId(medataSetId, prptyId, currentProperty)
		}
	}
};

const currentPropertyListSetByPrptId = (medataSetId, prptyId, currentProperty) => {
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataListBySetPropertyNm, medataSetId, prptyId))
		.then((res) => {
			currentProperty.propertyList = res.data.list;
			currentProperty.propertyListCnt = res.data.page.totalListSize;

			state.currentPropertyInfo = JSON.parse(JSON.stringify(currentProperty));
			state.propertyListCnt = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const gotoList = () => {
	let platform = getCookie("pltfrmId");
	let query = null;
	routerPush(platform, "RetrievalMetadataListPage", query);
};

</script>
<style lang="scss"></style>