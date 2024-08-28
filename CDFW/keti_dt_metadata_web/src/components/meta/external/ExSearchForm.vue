<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>메타데이터 검색</h3>
			<div class="btnSec taR">
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
								<el-button type="default" @click="clickSearchBtn" class="btn-label-color"><el-icon :class="`icon ${polygonSearchIcon}`" /></el-button>
								<el-button type="delete" @click="clickRefreshBtn" class="btn-label-color"><el-icon class="icon icon-refresh" /></el-button>
								<el-input placeholder="" v-model="pageInfo.polygon" style="max-width:100%" disabled/>
								<div v-if="polygonSearch" class="spaceChk">
									<el-button type="default" @click="formatChk">형식 확인</el-button>
									<span>※ (다중)다각형의 좌표를 입력해 주세요. 경도(-180 ~ 180), 위도(-90 ~ 90)</span>
									<p>예) MULTIPOLYGON (((126.53 33.5, 126.53 33.58, 126.73 33.58, 126.73 33.5, 126.53 33.5), (126.61 33.544, 126.61 33.555, 126.73 33.555, 126.73 33.555, 126.61 33.544)), ((126.53 33.5, 126.53 33.44, 126.63 33.44, 126.53 33.5)))</p>
									<el-input type="textarea" v-model="pageInfo.geoData" placeholder="" />
								</div>
							</div>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
 

		</div>

	</div>
</template>
<script setup>

import { ref, reactive, defineEmits, defineProps, onMounted } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";

const emits = defineEmits(["ExSearchList"]);

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const typeModelList = ref([]);
const digitalTwinList = ref([]);
const polygonSearch = ref(false);
const polygonSearchIcon = ref('icon-down');

const pageInfo = reactive({
	curPage: 1,
	digitalTwinId: "",
	typeModelId: "DigitalTwin",
	srchText: "",
	keyword: "",
	keywordType: "",
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

const clickSearchBtn = () => {
	if(polygonSearch.value) {
		polygonSearch.value = false;
		polygonSearchIcon.value = 'icon-down';
	}
	else {
		polygonSearch.value = true;
		polygonSearchIcon.value = 'icon-up';
	}
};

const clickRefreshBtn = () => {
	pageInfo.polygon = "";
	pageInfo.geoData = "";
};

const formatChk = () => {
    if (!pageInfo.geoData) {
        alert('WKT(Well-Known Text) POLYGON 또는 MULTIPOLYGON 정보를 입력해주세요.');
        return;
    }

	const wktPattern = /^(POLYGON|MULTIPOLYGON)\s*\((.*)\)$/i;
    let geoData = pageInfo.geoData.replace(/\s*(\r\n|\n|\r)\s*/gm, '').replace(/\s+/g, ' ').trim();

    if (wktPattern.test(geoData)) {
		isGeom(geoData);
    } else {
        alert("WKT POLYGON 또는 MULTIPOLYGON 형식이 잘못되었습니다.");
    }
};

const isGeom = (geoData) => {
	$axios
		.get($apiUrls.publicpage.meta.search.metadata.geometryValidate, {
			params: {
				polygon: geoData
			},
		})
		.then((res) => {
			if(res.data) {
				pageInfo.polygon = geoData;
				clickSearchBtn();
			}
			else {
				alert("WKT POLYGON 또는 MULTIPOLYGON 형식이 잘못되었습니다.");
				return;
			}
		})
		.catch((err) => {
			console.log(err);
			alert('형식 확인 중 오류가 발생했습니다.');
			return;
		});
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