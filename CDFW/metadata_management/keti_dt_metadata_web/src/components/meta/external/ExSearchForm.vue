<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>메타데이터 검색</h3>
			<div class="btnSec taR">
				<el-button type="default" @click="refresh()">초기화</el-button>
				<el-button type="primary" @click="getExSearchList(1)">검색</el-button>
			</div>
		</div>

		<div class="boxCnt">
			<el-form :inline="true" :model="pageInfo" class="demo-form-inline search-form" label-width="150px" label-position="left">
				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="디지털트윈">
							<el-select v-model="pageInfo.digitalTwinId" @change="" placeholder="선택">
								<el-option label="전체" value="" />
								<el-option v-for="item in digitalTwinList" :key="item.medataSetId"
									:label="`${item.medataSetNm}`" :value="item.medataSetId" />
							</el-select>
						</el-form-item>
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
						<el-form-item label="메타데이터 셋 명">
							<el-input class="" v-model="pageInfo.srchText" placeholder="메타데이터 셋 물리명/논리명" style=""
								@keydown.enter.prevent="getExSearchList(1)" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="키워드">
							<el-select v-model="pageInfo.keywordType" placeholder="선택" style="width: 150px;">
								<el-option label="일치검색" value="match" />
								<el-option label="포함검색" value="include" />
							</el-select>
							<el-input class="ml10" v-model="pageInfo.keyword" placeholder="키워드 입력" style=""
								@keydown.enter.prevent="getExSearchList(1)" />
						</el-form-item>
					</el-col>
				</el-row>

				<el-row :gutter="20">
					<el-col :span="24">
						<el-form-item label="공간">
							<div class="spaceInner">
								<el-button type="default" @click="clickMapSearchBtn" class="btn-label-color"><el-icon class="icon icon-search" /></el-button>
								<el-button type="default" class="el-button--delete btn-label-color" @click="clickRefreshBtn" ><el-icon class="icon icon-refresh" /></el-button>
								<el-input placeholder="" v-model="pageInfo.polygon" style="max-width:100%" disabled/>
							</div>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
 

		</div>

	</div>

	<div>
		<el-dialog v-model="dialogVisibleMapSearch" title="지도 범위 검색">
			<ExMapSearchPopupPage :dialogCnt="dialogCnt" @wktPolygon="selectedWktPolygon"/> 
		</el-dialog>
	</div>
</template>
<script setup>

import { ref, reactive, defineEmits, defineProps, onMounted } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import ExMapSearchPopupPage from "@/views/feature/meta/external/ExMapSearchPopupPage.vue";

const emits = defineEmits(["ExSearchList"]);

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const typeModelList = ref([]);
const digitalTwinList = ref([]);
const polygonSearch = ref(false);
const polygonSearchIcon = ref('icon-down');
const dialogVisibleMapSearch = ref(false);
const dialogCnt = ref(1);

const pageInfo = reactive({
	curPage: 1,
	digitalTwinId: "",
	typeModelId: "DigitalTwin",
	srchText: "",
	keyword: "",
	keywordType: "match",
	polygon: "",
	totalListSize: 0,
	pageListSize: 10,
	blockSize: 5,
});

const props = defineProps({
	pageInfo: {
		type: Object,
		required: false,
	}
});

onMounted(() => {
	getTypeModelList();
	getMetadataList();
	Object.assign(pageInfo, JSON.parse(JSON.stringify(props.pageInfo)));
});

const getTypeModelList = () => {
	$axios
		.get($apiUrls.publicpage.meta.data.type.getTypeModelList, {
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

const getMetadataList = () => {
	$axios
		.get($apiUrls.publicpage.meta.search.metadata.getMetadataList, {
			params: {
				isPaging: false,
				typeModelId: "DigitalTwin"
			},
		})
		.then((res) => {
			digitalTwinList.value = res.data.list;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getExSearchList = (data) => {
	if(pageInfo.typeModelId == "") {
		if(pageInfo.keyword != "" || pageInfo.polygon) {
			alert("메타데이터 유형을 선택해주세요.");
			return;
		}
	}
	emits("ExSearchList", { curPage: data, pageInfo });
};

const changeTypeModelId = (data) => {
	pageInfo.typeModelId = data;
};

const clickRefreshBtn = () => {
	pageInfo.polygon = "";
	pageInfo.geoData = "";
};

const refresh = () => {
	pageInfo.digitalTwinId = "";
	pageInfo.typeModelId = "DigitalTwin";
	pageInfo.srchText = "";
	pageInfo.keyword = "";
	pageInfo.keywordType = "match";
	pageInfo.polygon = "";
	pageInfo.geoData = "";
	polygonSearch.value = false;
};

const clickMapSearchBtn = () => {
	dialogVisibleMapSearch.value = true;
	dialogCnt.value = dialogCnt.value + 1;
};

const selectedWktPolygon = (wktPolygon) => {
	dialogVisibleMapSearch.value = false;
    pageInfo.polygon = wktPolygon;
};


</script>
<style lang="scss" scoped>
.spaceInner{
	display:flex;
	flex-wrap:wrap;
	align-items: center;
	width:100%;
	> button.el-button{
		flex:1;
		max-width:35px;
	}
	> div.el-input{
		flex:1;
		margin-left:10px;
		max-width:100% !important;
	}
	.spaceChk{
		width:100%;
		display:flex;
		flex-wrap:wrap;
		align-items: center;
		margin-top:15px;
		p{width:100%;}
		button{
			margin-right:10px;
		}
		textarea{
			max-width:500px;
		}
	}
}

</style>