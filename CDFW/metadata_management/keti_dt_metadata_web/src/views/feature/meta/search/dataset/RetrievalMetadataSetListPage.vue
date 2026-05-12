<template>
	<div>
		<div class="cntSec">

			<RetrievalMetadataSetSearchForm 
				@searchRetrievalMetadataSetList="searchRetrievalMetadataSetList" />

			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 셋 목록</h3>
				</div>
				<div class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<RetrievalMetadataSetList
							:metadataSetList="state.metadataSetList" 
							:totalPage="state.pageInfo.totalListSize"
							:curPage="state.pageInfo.curPage"
						 	@clickMetadataSet="clickMetadataSet"
							@pageMove="pageMove"						
						/>
					</div>
				</div>
			</div>

		</div>
	</div>
</template>
<script setup>
import RetrievalMetadataSetSearchForm from '@/components/meta/retrievaldataset/RetrievalMetadataSetSearchForm.vue';
import RetrievalMetadataSetList from '@/components/meta/retrievaldataset/RetrievalMetadataSetList.vue';

import { onMounted, reactive, ref, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import {
	getGlobalProperties,
	isWriteYn,
	isReadYn,
	routerPush,
	getCookie
} from "@/assets/js/common.js";
import dayjs from 'dayjs';

const store = useStore();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;

const state = reactive({
	metadataSetList: [],
	pageInfo: {
		curPage: 1,
		srchStartDd: "",
		srchEndDd: "",
		ctgryId: "",
		ctgryNm: "",
		agntId: "",
		agntNm: "",
		keyword: "",
		modelId: "",
		medataSetSttusMtcd: "",
		medataSetRegrId: "",
		srchText: "",
		typeModelId: "",
		medataSetId: "",
		medataSetNm: "",
		prptyId: "",
		prptyNm: "",
		includeDisuseYn: "",

		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	}
});

onMounted(() => {
	getMetadataSetList();
});

const clickMetadataSet = (payload) => {
	if (isReadYn(route.meta.auth)) {
		let platform = getCookie("pltfrmId");

		let query = { medataSetId: payload.medataSetId };
		routerPush(platform, "RetrievalMetadataSetPage", query);
	} else {
		alert("읽기 권한이 없습니다.");
	}	
};

const getMetadataSetList = () => {
	$axios
		.get($apiUrls.meta.resource.metadatasets.getMetadataSetList, {
			params: {
				curPage: state.pageInfo.curPage,
				srchStartDd: state.pageInfo.srchStartDd,
				srchEndDd: state.pageInfo.srchEndDd,
				keyword: state.pageInfo.keyword,
				ctgryId: state.pageInfo.ctgryId,
				agntId: state.pageInfo.agntId,
				medataSetRegrId: state.pageInfo.medataSetRegrId,
				medataSetSttusMtcd: state.pageInfo.medataSetSttusMtcd,
				modelId: state.pageInfo.modelId,
				srchText: state.pageInfo.srchText,
				typeModelId: state.pageInfo.typeModelId,
				medataSetId: state.pageInfo.medataSetId,
				prptyId: state.pageInfo.prptyId,
				includeDisuseYn: state.pageInfo.includeDisuseYn,
			},
		})
		.then((res) => {
			state.metadataSetList = res.data.list.map((x) => {
				x.medataSetAmdDt = dayjs(x.medataSetAmdDt).format('YYYY-MM-DD');
				return x;
			});
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const searchRetrievalMetadataSetList = (payload) => {
	state.pageInfo.curPage = payload.curPage;
	state.pageInfo.typeModelId = payload.pageInfo.typeModelId;
	state.pageInfo.srchStartDd = payload.pageInfo.srchStartDd;
	state.pageInfo.srchEndDd = payload.pageInfo.srchEndDd;
	state.pageInfo.ctgryId = payload.pageInfo.ctgryId;
	state.pageInfo.agntId = payload.pageInfo.agntId;
	state.pageInfo.keyword = payload.pageInfo.keyword;
	state.pageInfo.modelId = payload.pageInfo.modelId;
	state.pageInfo.medataSetSttusMtcd = payload.pageInfo.medataSetSttusMtcd;
	state.pageInfo.medataSetRegrId = payload.pageInfo.medataSetRegrId;
	state.pageInfo.srchText = payload.pageInfo.srchText;
	state.pageInfo.medataSetId = payload.pageInfo.medataSetId;
	state.pageInfo.prptyId = payload.pageInfo.prptyId;
	state.pageInfo.includeDisuseYn = payload.pageInfo.includeDisuseYn;

	getMetadataSetList();
};

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getMetadataSetList();
};

</script>
<style lang="scss">
</style>