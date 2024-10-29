<template>
<!-- 메타데이터 유형 모델 검색 -->
	<div class="cntSec">
	
		<TypeModelSearchForm 
			:dataStatusCdList="dataStatusCdList" 
			@searchTypeModelList="searchTypeModelList" />

		<div class="btnSec taR mt10">
			<el-button type="primary" size="large" v-if="isWriteYn(route.meta.auth)" @click="dialogVisibleEdit = true">등록</el-button>
		</div>
		<el-dialog v-model="dialogVisibleEdit" title="메타데이터 유형 모델 등록">
			<TypeModelDialogEdit
				:dataStatusCdList="dataStatusCdList"
				:dataTypeCdList="dataTypeCdList"
				:structdModelSchmaList="structdModelSchmaList"
				@cancelDialog="cancelDialog"
				@editTypeInfo="editTypeInfo" 
			/> 
		</el-dialog>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 유형 모델 목록</h3>
			</div>
			<div class="boxCnt">
				<div style="overflow-x: hidden; overflow-y: auto">
					<TypeModelList 
						:typeModelList="state.typeModelList"
						:dataStatusCdList="dataStatusCdList"
						:structdModelSchmaList="structdModelSchmaList"
						:totalPage="state.pageInfo.totalListSize" 
						:curPage="state.pageInfo.curPage"
						@pageMove="pageMove" />
				</div>
			</div>
		</div>

	</div>
</template>
<script setup>
import TypeModelList from "@/components/meta/datamodel/TypeModelList.vue";
import TypeModelSearchForm from "@/components/meta/datamodel/TypeModelSearchForm.vue";
import TypeModelDialogEdit from "@/components/meta/datamodel/TypeModelDialogEdit.vue";

import { getGlobalProperties,	isWriteYn } from "@/assets/js/common.js";
import { ref, reactive, onMounted, getCurrentInstance, computed } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";

const store = useStore();
const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter = getCurrentInstance().appContext.config.globalProperties.$emitter;
const dialogVisibleEdit = ref(false);

onMounted(() => {
	getCodeList();
	getTypeModelList();
	$emitter.on("initTypeModelList", getTypeModelList);
});

const getCodeList = async () => {
	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00002", "MCG00008"]
		}
	});
};
const dataStatusCdList = computed(()=> store.getters["MetaStore/getStoreMetaCodeList"]("MCG00002"));
const structdModelSchmaList = computed(()=> store.getters["MetaStore/getStoreMetaCodeList"]("MCG00008"));


const state = reactive({
	typeModelList: [],
	pageInfo: {
		searchMode: "type",
		curPage: 1,
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5
	},
});

const searchTypeModelList = (payload) => {
    state.pageInfo.curPage = payload.curPage;
    state.pageInfo.searchAmdStDt = payload.pageInfo.searchAmdStDt;
    state.pageInfo.searchAmdEdDt = payload.pageInfo.searchAmdEdDt;
    state.pageInfo.searchMode = payload.pageInfo.searchMode;
    state.pageInfo.searchName = payload.pageInfo.searchName;
    state.pageInfo.modelDataSttusMtcd = payload.pageInfo.modelDataSttusMtcd;
		state.pageInfo.structdModelYn = payload.pageInfo.structdModelYn;
		getTypeModelList();
};
const getTypeModelList = () => {
	$axios
		.get($apiUrls.meta.data.type.getTypeModelList , {
			params: {
				curPage: state.pageInfo.curPage,
				searchAmdStDt: state.pageInfo.searchAmdStDt,
				searchAmdEdDt: state.pageInfo.searchAmdEdDt,
				searchMode: state.pageInfo.searchMode,
				searchName: state.pageInfo.searchName,
				modelDataSttusMtcd: state.pageInfo.modelDataSttusMtcd,
				structdModelYn: state.pageInfo.structdModelYn,
				sqlDateFormat: 'YYYY-MM-DD'
			},
		})
		.then((res) => {
			res.data.list.forEach((data)=>{
				data.structdModelYn =='Y' ? data.structdModelYn=data.structdModelYn+"(정형)" : data.structdModelYn=data.structdModelYn+"(비정형)";
			});
			state.typeModelList = res.data.list;
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getTypeModelList();
};

const editTypeInfo = () => {
	getTypeModelList();
	dialogVisibleEdit.value = false;
};

const cancelDialog = () => {
  dialogVisibleEdit.value = false;
};

</script>
<style lang="scss"></style>
