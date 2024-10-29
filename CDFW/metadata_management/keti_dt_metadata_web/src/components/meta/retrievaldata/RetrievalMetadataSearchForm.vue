<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>메타데이터 검색</h3>
			<div class="btnSec taR">
				<el-button type="default" @click="refresh">초기화</el-button>
				<el-button type="primary" @click="getRetrievalMetadataList(1)">검색</el-button>
			</div>
		</div>

		<div class="boxCnt">
			<el-form :inline="true" :model="pageInfo" class="demo-form-inline search-form" label-width="150px" label-position="left">
				<el-row :gutter="20">
					<el-col :span="12">
						<ComnFormItemInput2Btns label="메타데이터 셋" v-model="pageInfo.medataSetNm"
							@click-search="dialogVisibleSearchMetadataSet = true" @click-refresh="refreshMetadataSetInfo" />
						<el-dialog v-model="dialogVisibleSearchMetadataSet" title="메타데이터 셋 검색">
							<MetadataSetDialogSearch :searchSttusCd="searchSttusCdForDt" :searchMode="searchModeForDt"
								@selectedRow="selectedMetaDataSet" />
						</el-dialog>
					</el-col>

					<el-col :span="12">
						<el-form-item label="메타데이터 유형">
							<el-select v-model="pageInfo.typeModelId" @change="changeTypeModelId" placeholder="선택">
								<el-option label="전체" value="" />
								<el-option v-for="item in typeModelList" :key="item.modelId"
									:label="`${item.modelNm} ${item.modelLogicNm}`" :value="item.modelId" />
							</el-select>
						</el-form-item>
					</el-col>
				</el-row>

				<el-row :gutter="20">
					<el-col :span="12">
						<ComnFormItemInput2Btns label="메타데이터 모델" v-model="pageInfo.modelNm"
							@click-search="dialogVisibleModelSearch = true" @click-refresh="refreshModelInfo" />
						<el-dialog v-model="dialogVisibleModelSearch" title="메타데이터 모델 검색">
							<MetaDataModelSearchPage :searchSttusCd="searchSttusCd" :searchMode="searchMode"
								:typeModelId="searchTypeModelId" @selectedRow="selectedMetaDataModel" />
						</el-dialog>
					</el-col>

					<el-col :span="12">
						<!-- 2023-07-27 정형모델 사용안함 
						<ComnFormItemInput2Btns label="제공자 (대리인)" v-model="pageInfo.agntNm"
							@click-search="dialogVisibleSearchAgent = true" @click-refresh="refreshAgent" />
						<el-dialog v-model="dialogVisibleSearchAgent" title="대리인 검색">
							<AgentDialogSearch @selectAgent="selectedAgent" />
						</el-dialog>
						-->
						<ComnFormItemInput2Btns label="제공자 (대리인)" v-model="pageInfo.agntNm"
							@click-search="dialogVisibleSearchAgent = true" @click-refresh="refreshAgent" />
						<el-dialog v-model="dialogVisibleSearchAgent" title="제공자 (대리인) 메타데이터 셋 검색">
							<MetadataSetDialogSearch 
							  searchSttusCd="use" searchMode="type"
							  typeModelId="Agent" typeModelNm="제공자 (대리인)"
								:searchMetaTypeFix='true' :searchMetaTypeId="'Agent'" 
							  @selectedRow="selectedAgent" />
						</el-dialog>						
					</el-col>
				</el-row>

				<el-row :gutter="20">
					<el-col :span="12">
						<ComnFormItemInput2Btns label="프라퍼티" v-model="pageInfo.prptyNm"
							@click-search="dialogVisiblePropertySearch = true" @click-refresh="refreshProperty" />
						<el-dialog v-model="dialogVisiblePropertySearch" title="프라퍼티 검색">
							<PropertyDialogSearch @selectedRow="selectedProperty" />
						</el-dialog>
					</el-col>

					<el-col :span="12">
						<el-form-item label="검색어">
							<el-input class="" v-model="pageInfo.srchVal" placeholder="값" style=""
								@keydown.enter.prevent="getRetrievalMetadataList(1)" />
						</el-form-item>
					</el-col>
				</el-row>

			</el-form>


		</div>

	</div>
</template>
<script setup>
import ComnFormItemInput2Btns from "@/components/common/ComnFormItemInput2Btns.vue";

import MetadataSetDialogSearch from "@/components/meta/dt/MetadataSetDialogSearch.vue";
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";
import PropertyDialogSearch from "@/components/meta/datamodel/PropertyDialogSearch.vue";

import { ref, reactive, defineEmits, defineProps, onMounted } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";

const emits = defineEmits(["searchRetrievalMetadataList"]);

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const dialogVisibleSearchMetadataSet = ref(false); //디지털트윈(메타데이터 셋) 검색 modal
const dialogVisibleModelSearch = ref(false); //모델 검색 modal
const dialogVisibleSearchAgent = ref(false); //대리인 검색 modal
const dialogVisiblePropertySearch = ref(false); //프라퍼티 검색 modal

//디지털트윈(메타데이터 셋) 검색 조건
const searchSttusCdForDt = "use"; //사용 상태만 select
const searchModeForDt = "all";

//모델 검색 조건
const searchSttusCd = "use"; // (모델 검색 시 사용 상태만 select)
const searchMode = "objectType"; //"objectType"; //props.rangeModelTypeMtcd; 
const searchTypeModelId = ""; //"DigitalTwin";

const typeModelList = ref([]);

const pageInfo = reactive({
	typeModelId: "", //유형모델ID
	medataSetId: "", //메타데이터 셋 ID
	medataSetNm: "", //메타데이터 셋 명
	modelId: "", //모델ID
	modelNm: "",
	agntId: "", //대리인ID
	agntNm: "",
	prptyId: "", //프라퍼티 ID
	prptyNm: "", //프라퍼티 명
	srchVal: "", //검색어 (메타데이터 검색용)
});

onMounted(() => {
	getTypeModelList();
});

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

const getRetrievalMetadataList = (data) => {
	emits("searchRetrievalMetadataList", { curPage: data, pageInfo });
};

const selectedMetaDataSet = (payload) => {
	let { medataSetId, medataSetNm } = payload.rowData;
	pageInfo.medataSetId = medataSetId;
	pageInfo.medataSetNm = medataSetNm;
	dialogVisibleSearchMetadataSet.value = false;
};

const selectedMetaDataModel = (payload) => {
	let { modelId, modelNm } = payload.rowData;
	pageInfo.modelId = modelId;
	pageInfo.modelNm = modelNm;
	dialogVisibleModelSearch.value = false;
};

/*  2023-07-27 정형모델 사용안함 
const selectedAgent = (payload) => {
	dialogVisibleSearchAgent.value = false;
	pageInfo.agntId = payload.data.agntId;
	pageInfo.agntNm = payload.data.agntNm;
}; */
const selectedAgent = (payload) => {
	dialogVisibleSearchAgent.value = false;
	pageInfo.agntId = payload.rowData.medataSetId;
	pageInfo.agntNm = payload.rowData.medataSetNm;
};

const refreshAgent = () => {
	pageInfo.agntId = "";
	pageInfo.agntNm = "";
};

const selectedProperty = (payload) => {
	let { prptyId, prptyNm } = payload.rowData;
	pageInfo.prptyId = prptyId;
	pageInfo.prptyNm = prptyNm;
	dialogVisiblePropertySearch.value = false;
};

const refreshProperty = () => {
	pageInfo.prptyId = "";
	pageInfo.prptyNm = "";
};

const changeTypeModelId = (data) => {
	pageInfo.typeModelId = data;
};

const refreshMetadataSetInfo = () => {
	pageInfo.medataSetNm = "";
	pageInfo.medataSetId = "";
};

const refreshModelInfo = () => {
	pageInfo.modelId = "";
	pageInfo.modelNm = "";
};

const refresh = () => {
	pageInfo.typeModelId = ""; //유형모델ID
	pageInfo.medataSetId = ""; //메타데이터 셋 ID
	pageInfo.medataSetNm = ""; //메타데이터 셋 명
	pageInfo.modelId = ""; //모델ID
	pageInfo.modelNm = "";
	pageInfo.agntId = ""; //대리인ID
	pageInfo.agntNm = "";
	pageInfo.prptyId = ""; //프라퍼티 ID
	pageInfo.prptyNm = ""; //프라퍼티 명
	pageInfo.srchVal = ""; //검색어
};

</script>
<style lang="scss"></style>