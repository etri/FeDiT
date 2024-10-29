<template>
	<div class="boxLayout">

		<div class="boxTit">
			<h3>메타데이터 셋 검색</h3>
			<div class="btnSec taR">
				<el-button type="default" @click="refresh">초기화</el-button>
				<el-button type="primary" @click="getRetrievalMetadataSetList(1)">검색</el-button>
			</div>
		</div>

		<div class="boxCnt">
			<el-form :inline="true" :model="pageInfo" class="demo-form-inline search-form" label-width="150px" label-position="left">
				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="수정일">
							<div class="inline-area">
								<div class="demo-date-picker">
									<div class="block">
										<el-date-picker v-model="pageInfo.srchStartDd" type="date" placeholder="시작일" format="YYYY-MM-DD"
											value-format="YYYY-MM-DD" :disabled-date="disabledDate1" style="" />
									</div>
								</div>
								<div class="date-picker-tilde">~</div>
								<div class="demo-date-picker">
									<div class="block">
										<el-date-picker v-model="pageInfo.srchEndDd" type="date" placeholder="종료일" format="YYYY-MM-DD"
											value-format="YYYY-MM-DD" :disabled-date="disabledDate2" style="" @change="changeDate" />
									</div>
								</div>
							</div>
						</el-form-item>
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
								:searchMetaTypeFix='true' searchMetaTypeId="Agent" 
							  @selectedRow="selectedAgent" />
						</el-dialog>					
					</el-col>
				</el-row>

				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="메타데이터 유형">
							<el-select v-model="pageInfo.typeModelId" @change="changeTypeModelId" placeholder="선택">
								<el-option label="전체" value="" />
								<el-option v-for="item in typeModelList" :key="item.modelId"
									:label="`${item.modelNm} ${item.modelLogicNm}`" :value="item.modelId" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<ComnFormItemInput2Btns label="메타데이터 모델" v-model="pageInfo.modelNm"
							@click-search="dialogVisibleModelSearch = true" @click-refresh="refreshModelInfo" />
						<el-dialog v-model="dialogVisibleModelSearch" title="메타데이터 모델 검색">
							<MetaDataModelSearchPage :searchSttusCd="searchSttusCd" :searchMode="searchMode"
								:typeModelId="searchTypeModelId" @selectedRow="selectedMetaDataModel" />
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
						<el-form-item label="메타데이터 셋 명">
							<el-input class="" v-model="pageInfo.srchText" placeholder="메타데이터 셋 명" style=""
								@keydown.enter.prevent="getRetrievalMetadataSetList(1)" />
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>

		</div>

	</div>
</template>
<script setup>
import ComnFormItemInput2Btns from "@/components/common/ComnFormItemInput2Btns.vue";

import CategoryDialogSearch from "@/components/meta/category/CategoryDialogSearch.vue";
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";
import MetadataSetDialogSearch from "@/components/meta/dt/MetadataSetDialogSearch.vue";
import PropertyDialogSearch from "@/components/meta/datamodel/PropertyDialogSearch.vue";

import { ref, reactive, defineEmits, defineProps, onMounted } from "vue";
import { useStore } from "vuex";
import { getGlobalProperties } from "@/assets/js/common.js";

const emits = defineEmits(["searchRetrievalMetadataSetList"]);

const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const dialogVisibleModelSearch = ref(false); //모델 검색 modal
const dialogVisibleSearchAgent = ref(false); //대리인 검색 modal
const dialogVisibleSearchMetadataSet = ref(false); //디지털트윈(메타데이터 셋) 검색 modal
const dialogVisiblePropertySearch = ref(false); //프라퍼티 검색 modal

//메타데이터 모델 dialog 검색 조건
const searchSttusCd = "use"; // (모델 검색 시 사용 상태만 select)
const searchMode = "objectType"; //06.08 메타데이터 검색 조건절 확인
const searchTypeModelId = ""; //06.08 조건절 확인

const typeModelList = ref([]);

const pageInfo = reactive({
	typeModelId: "", //유형모델 ID
	srchStartDd: "",
	srchEndDd: "",
	ctgryId: "", //카테고리 ID
	ctgryNm: "", //카테고리 이름
	agntId: "", //대리인 ID
	agntNm: "", //대리인 이름
	keyword: "", //키워드
	modelId: "", //모델 ID
	modelNm: "", //모델 명	
	medataSetSttusMtcd: "use", //메타데이터 셋 상태
	srchText: "", //디지털트윈 명
	medataSetId: "", //디지털트윈 ID (메타데이터 셋 ID)
	medataSetNm: "", //디지털트윈 명 (메타데이터 셋 명)
	prptyId: "", //프라퍼티 ID
	prptyNm: "", //프라퍼티 명
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

const getRetrievalMetadataSetList = (data) => {
	emits("searchRetrievalMetadataSetList", {
		curPage: data,
		pageInfo,
	})
};

const changeDate = () => {
	if (pageInfo.srchStartDd == null) {
		pageInfo.srchStartDd = "";
	}
	if (pageInfo.srchEndDd == null) {
		pageInfo.srchEndDd = "";
	}
};

const disabledDate1 = (time) => {
	if (pageInfo.srchEndDd == null || pageInfo.srchEndDd == "")
		return (pageInfo.srchEndDd = "");
	else return time.getTime() > new Date(pageInfo.srchEndDd);
};
const disabledDate2 = (time) => {
	//시작일과 동일 날짜도 종료 검색일로 지정할 수 있게끔 설정 (meta 관련 검색)
	let srchStartDd = new Date(pageInfo.srchStartDd);
	new Date(srchStartDd.setDate(srchStartDd.getDate() - 1)); //지정날짜에서 - 1 day
	return time.getTime() < new Date(srchStartDd.setDate(srchStartDd.getDate()));
};

const selectedMetaDataModel = (payload) => {
	console.log(payload);
	let { modelId, modelNm } = payload.rowData;
	pageInfo.modelId = modelId;
	pageInfo.modelNm = modelNm;
	dialogVisibleModelSearch.value = false;
};

const selectedMetaDataSet = (payload) => {
	let { medataSetId, medataSetNm } = payload.rowData;
	pageInfo.medataSetId = medataSetId;
	pageInfo.medataSetNm = medataSetNm;
	dialogVisibleSearchMetadataSet.value = false;
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

/*  2023-07-27 정형모델 사용안함 
const selectedAgent = (payload) => {
	let { agntId, agntNm } = payload.data;
	pageInfo.agntId = agntId;
	pageInfo.agntNm = agntNm;
	dialogVisibleSearchAgent.value = false;
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

const changeTypeModelId = (data) => {
	pageInfo.typeModelId = data;
};

const refreshModelInfo = () => {
	pageInfo.modelId = "";
	pageInfo.modelNm = "";
};

const refreshMetadataSetInfo = () => {
	pageInfo.medataSetId = "";
	pageInfo.medataSetNm = "";
};

const refresh = () => {
	pageInfo.srchStartDd = "";
	pageInfo.srchEndDd = "";
	pageInfo.typeModelId = "";
	pageInfo.ctgryId = "";
	pageInfo.ctgryNm = "";
	pageInfo.agntId = "";
	pageInfo.agntNm = "";
	pageInfo.keyword = "";
	pageInfo.modelId = "";
	pageInfo.modelNm = "";
	pageInfo.medataSetSttusMtcd = "use";
	pageInfo.srchText = "";
	pageInfo.medataSetId = "";
	pageInfo.medataSetNm = "";
	pageInfo.prptyId = "";
	pageInfo.prptyNm = "";
};

</script>
<style lang="scss"></style>