<template>
	<div class="dialog-area">
				<!-- <MetadataSetDialogSearchForm 
					:searchSttusCd="searchSttusCd"
					:searchMode="searchMode"
					:searchMetaTypeFix="searchMetaTypeFix"
					:searchMetaTypeId="searchMetaTypeId"
					:modelId="modelId"
					:typeModelId="typeModelId"
					:dataStatusCdList="dataStatusCdList"
					:typeModelList="state.typeModelList"
					:srchModelNm="modelNm"
					@searchMetadataSetList="searchMetadataSetList"
				/> -->

		<div class="boxLayout">
			<div class="boxTit">
				<h3>{{ title }}</h3>
				<div class="btnSec taR">
					<el-button type="primary" @click="searchMetadataSetList(1)">검색</el-button>
				</div>
			</div>

			<div class="boxCnt">
				<el-form label-position="left"
					:inline="true"
					class="demo-form-inline search-form"
					label-width="130px"
				>
					<el-row :gutter="20">
						<el-col :span="12">
							<el-form-item label="메타데이터 상태">
								<el-select
									v-model="state.pageInfo.medataSetSttusMtcd"
									v-bind:disabled="searchSttusCd == 'use'"
									@change="changeCd"
									placeholder="전체"
								>
									<el-option label="전체" value="" />
									<el-option
										v-for="item in dataStatusCdList"
										:key="item.mtcd"
										:label="item.mtcdNm"
										:value="item.mtcd"
									/>
								</el-select>
							</el-form-item>
						</el-col>
						<el-col :span="12">
							<el-form-item label="메타데이터 유형">
								<el-select
									v-model="state.pageInfo.typeModelId"
									v-if="!searchMetaTypeFix"
									@change="changeTypeModelId"
									placeholder="전체"
								>
									<el-option label="전체" value="" />
									<el-option
										v-for="item in state.typeModelList"
										:key="item.modelId"
										:label="`${item.modelNm} ${item.modelLogicNm}`"
										:value="item.modelId"
									/>
								</el-select>
								<el-select
									v-model="state.pageInfo.typeModelId"
									v-else
									disabled
									@change="changeTypeModelId"
									placeholder="전체"
								>
									<el-option label="전체" value="" />
									<el-option
										v-for="item in state.typeModelList"
										:key="item.modelId"
										:label="`${item.modelNm} ${item.modelLogicNm}`"
										:value="item.modelId"
									/>
								</el-select>
							</el-form-item>
						</el-col>
					</el-row>
					<el-row :gutter="20">
						<el-col :span="12">
							<el-form-item label="메타데이터 셋 명">
								<el-input
									class="w-auto m-2"
									v-model="state.pageInfo.srchText"
									placeholder=""
									@keydown.enter.prevent="searchMetadataSetList(1)"
								/>
							</el-form-item>
						</el-col>
						<el-col :span="12">
							<el-form-item label="메타데이터 모델명">
								<el-input
									class="w-auto m-2"
									v-model="state.pageInfo.srchModelNm"
									placeholder=""
									@keydown.enter.prevent="searchMetadataSetList(1)"
								/>
							</el-form-item>
						</el-col>
					</el-row>
				</el-form>
			</div>
		</div>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 셋 검색 결과</h3>
			</div>
			<div class="boxCnt">
				<div style="overflow-x: hidden; overflow-y: auto">
					<MetadataSetDialogSearchList
						:metadataSetList="state.metadataSetList"
						:totalPage="state.pageInfo.totalListSize"
						:curPage="state.pageInfo.curPage"
						@selectedRow="selectedRow"
						@pageMove="pageMove"
					/>
				</div>
			</div>		
		</div>

	</div>
</template>
<script setup>
// import MetadataSetDialogSearchForm from "@/components/meta/dt/MetadataSetDialogSearchForm.vue";
import MetadataSetDialogSearchList from "@/components/meta/dt/MetadataSetDialogSearchList.vue";

import { getGlobalProperties,	isWriteYn } from "@/assets/js/common.js";
import { defineEmits, ref, reactive, onMounted, getCurrentInstance, computed, toRefs, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";

const store = useStore();
const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const title = ref("메타데이터 셋 검색");

const emits = defineEmits(["selectedRow"]);

const props = defineProps({
	searchSttusCd: { //메타데이터 셋의 사용 상태
		type: String,
		required: false		
	},
	searchMode: { // all, dt, type, model
		type: String,
		required: false,
		default: ''
	},
	typeModelId: { // searchMode === 'type' 의 경우, typeModelId를 같이 props로 전송받아야 함.
		type: String,
		required: false
	},
	typeModelNm: { // searchMode === 'type' 의 경우, typeModelNm를 같이 props로 전송받아야 함.
		type: String,
		required: false
	},		
	modelId: { // searchMode === 'model' 의 경우, modelId를 같이 props로 전송받아야 함.
		type: String,
		required: false
	},
	modelNm: { // searchMode === 'model' 의 경우, modelNm를 같이 props로 전송받아야 함.
		type: String,
		required: false
	},
	searchMetaTypeFix: {
		type: Boolean,
		required: false
	},
	searchMetaTypeId: {
		type: String,
		required: false
	},
});

const state = reactive({
	pageInfo: {
		totalListSize: 0,
		curPage: 1,
		typeModelId: "",
		modelId: "",
		medataSetSttusMtcd: "",
		srchModelNm: "",
		srchText: "",
	},
	metadataSetList: [],
	typeModelList: []
});

const propsRefs = toRefs(props);
watch([propsRefs.searchSttusCd, propsRefs.searchMode, propsRefs.modelId, propsRefs.typeModelId],
	() => {
		init();
	}
)

onMounted(() => {
	init();
});

const dataStatusCdList = computed(()=> store.getters["MetaStore/getStoreMetaCodeList"]("MCG00001")); //데이터 상태코드리스트 (MCG00001)

const getTypeModelList = () => {
   $axios
      .get($apiUrls.meta.data.type.getTypeModelList , {
         params: {
            isPaging: false,
            searchMode: "type",
						modelDataSttusMtcd: "use"
         },
      })
      .then((res) => {
         state.typeModelList = res.data.list;
      })
      .catch((err) => {
         console.log(err);
      });
};

const init = async () => {

	getTypeModelList();

	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00001"],
		},
	});

	if (props.searchMode === 'model') {
		title.value = `메타데이터 셋 검색 - ${props.modelNm} 모델`;
		state.pageInfo.modelId = props.modelId;
	} else if (props.searchMode === 'type') {
		title.value = `메타데이터 셋 검색 - ${props.typeModelNm} 유형`;
		state.pageInfo.typeModelId = props.typeModelId;
		if (props.typeModelNm != props.modelNm) {
			state.pageInfo.srchModelNm = props.modelNm;
		}
	}

	state.pageInfo.curPage = 1;
	state.pageInfo.searchMode = props.searchMode;
	state.pageInfo.medataSetSttusMtcd = props.searchSttusCd;
	
	getMetadataSetList();
};

const getMetadataSetList = () => {
	$axios
    .get($apiUrls.meta.resource.metadatasets.getMetadataSetList, {
      params: {
        curPage: state.pageInfo.curPage,

				medataSetSttusMtcd: state.pageInfo.medataSetSttusMtcd,
				srchText: state.pageInfo.srchText,				
				modelId: state.pageInfo.modelId,
				typeModelId: state.pageInfo.typeModelId, 
				srchModelNm: state.pageInfo.srchModelNm, 
      },
    })
    .then((res) => {
			state.metadataSetList = res.data.list;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });	
};

const searchMetadataSetList = (curPage) => {
	state.pageInfo.curPage = curPage;
	getMetadataSetList();
};

const selectedRow = (payload) => {
	emits("selectedRow", payload);
};

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getMetadataSetList();
};

const changeCd = (data) => {
  state.pageInfo.medataSetSttusMtcd = data;
};

const changeTypeModelId = (data) => {
  state.pageInfo.typeModelId = data;
};

</script>
<style lang="scss" scoped>
.medata-val-text {
	border: solid 2px #f3f6f8;
	border-radius: 5px;
	width: 100%;
	height: 100px;
	resize: vertical;
}
</style>