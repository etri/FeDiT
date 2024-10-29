<template>
	<div class="boxLayout">

		<div class="boxTit">
			<h3>디지털트윈 검색</h3>
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
							<AgentDialogSearch @selectAgent="selectAgent" />
						</el-dialog>
					  -->
						<ComnFormItemInput2Btns label="제공자 (대리인)" v-model="pageInfo.agntNm"
							@click-search="dialogVisibleSearchAgent = true" @click-refresh="refreshAgent" />
						<el-dialog v-model="dialogVisibleSearchAgent" title="제공자 (대리인) 메타데이터 셋 검색">
							<MetadataSetDialogSearch 
							  searchSttusCd="use" searchMode="type"
							  typeModelId="Agent" typeModelNm="제공자 (대리인)"
								:searchMetaTypeFix='true' searchMetaTypeId="Agent" 
							  @selectedRow="selectAgent" />
						</el-dialog>						
					</el-col>
				</el-row>

				<el-row :gutter="20">
					<el-col :span="12">
						<ComnFormItemInput2Btns label="카테고리" v-model="pageInfo.ctgryNm"
							@click-search="dialogVisibleSearchCategory = true" @click-refresh="refreshCategory" />
						<el-dialog v-model="dialogVisibleSearchCategory" title="카테고리 검색">
							<CategoryDialogSearch @selectCategory="selectCategory" />
						</el-dialog>
					</el-col>
					<el-col :span="12">
						<ComnFormItemInput2Btns label="메타데이터 모델" v-model="pageInfo.modelNm"
							@click-search="dialogVisibleModelSearch = true" @click-refresh="refreshModelInfo" />
						<el-dialog v-model="dialogVisibleModelSearch" title="메타데이터 모델 검색">
							<MetaDataModelSearchPage 
								:searchSttusCd="searchSttusCd" 
								:searchMode="searchMode"
								:typeModelId="searchTypeModelId" 
								@selectedRow="selectedMetaDataModel" />
						</el-dialog>
					</el-col>
				</el-row>

				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="디지털트윈 명">
							<el-input
								class=""
								v-model="pageInfo.srchText"
								placeholder="검색어 (물리명 또는 논리명)"
								style=""
								@keydown.enter.prevent="getRetrievalMetadataSetList(1)"
								/>					
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="키워드">
							<el-input
								class=""
								v-model="pageInfo.keyword"
								placeholder="키워드"
								style=""
								@keydown.enter.prevent="getRetrievalMetadataSetList(1)"
								/>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>

		</div>
	</div>
</template>
<script setup>
import CategoryDialogSearch from "@/components/meta/category/CategoryDialogSearch.vue";
//import AgentDialogSearch from "@/components/meta/agent/AgentDialogSearch.vue";
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";
import ComnFormItemInput2Btns from "@/components/common/ComnFormItemInput2Btns.vue";
import MetadataSetDialogSearch from "@/components/meta/dt/MetadataSetDialogSearch.vue";

import { ref, reactive, defineEmits, defineProps } from "vue";
import { useStore } from "vuex";
import { getGlobalProperties } from "@/assets/js/common.js";

const emits = defineEmits(["searchRetrievalMetadataSet"]);
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const dialogVisibleSearchCategory = ref(false); //카테고리 검색 modal 
const dialogVisibleSearchAgent = ref(false); //대리인 검색 modal
const dialogVisibleModelSearch = ref(false); //모델 검색 modal

const searchSttusCd = "use"; // (모델 검색 시 사용 상태만 select)
const searchMode = ""; //"objectType"; //props.rangeModelTypeMtcd; 
const searchTypeModelId = "DigitalTwin"; //"DigitalTwin";

const pageInfo = reactive({
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
});

const getRetrievalMetadataSetList = (data) => {
	emits("searchRetrievalMetadataSet", {
		curPage: data,
		pageInfo,
	})
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

const changeDate = () => {
	if (pageInfo.srchStartDd == null) {
		pageInfo.srchStartDd = "";
	}
	if (pageInfo.srchEndDd == null) {
		pageInfo.srchEndDd = "";
	}
};

const selectedMetaDataModel = (payload) => {
	console.log(payload);
	let { modelId, modelNm } = payload.rowData;
	pageInfo.modelId = modelId;
	pageInfo.modelNm = modelNm;
	dialogVisibleModelSearch.value = false;
};

const refreshModelInfo = () => {
	pageInfo.modelId = "";
	pageInfo.modelNm = "";
};

const selectCategory = (payload) => {
	dialogVisibleSearchCategory.value = false;
	pageInfo.ctgryId = payload.data.ctgryId;
	pageInfo.ctgryNm = payload.data.ctgryNm;
};

const refreshCategory = () => {
	pageInfo.ctgryId = "";
	pageInfo.ctgryNm = "";
};

/*  2023-07-27 정형모델 사용안함
const selectAgent = (payload) => {
	dialogVisibleSearchAgent.value = false;
	pageInfo.agntId = payload.data.agntId;
	pageInfo.agntNm = payload.data.agntNm;
}; */
const selectAgent = (payload) => {
	dialogVisibleSearchAgent.value = false;
	pageInfo.agntId = payload.rowData.medataSetId;
	pageInfo.agntNm = payload.rowData.medataSetNm;
};

const refreshAgent = () => {
	pageInfo.agntId = "";
	pageInfo.agntNm = "";
};

const refresh = () => {
	pageInfo.srchStartDd = "";
	pageInfo.srchEndDd = "";
	pageInfo.ctgryId = "";
	pageInfo.ctgryNm = "";
	pageInfo.agntId = "";
	pageInfo.agntNm = "";
	pageInfo.keyword = "";
	pageInfo.modelId = "";
	pageInfo.medataSetSttusMtcd = "use";
	pageInfo.medataSetRegrId = "";
	pageInfo.srchText = "";
};

</script>
<style lang="scss"></style>