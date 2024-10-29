<template>
	<div>
		<div class="cntSec">
			<RetrievalMetadataSearchForm @searchRetrievalMetadataList="searchRetrievalMetadataList" />

			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 목록</h3>
				</div>
				<div class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<RetrievalMetadataList :metadataList="state.metadataList" :totalPage="state.pageInfo.totalListSize"
							:curPage="state.pageInfo.curPage" @clickMetadata="clickMetadata" @pageMove="pageMove" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import RetrievalMetadataSearchForm from '@/components/meta/retrievaldata/RetrievalMetadataSearchForm.vue';
import RetrievalMetadataList from '@/components/meta/retrievaldata/RetrievalMetadataList.vue';

import { onMounted, reactive, ref, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { getGlobalProperties, isReadYn, routerPush, getCookie } from "@/assets/js/common.js";

const store = useStore();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;

const state = reactive({
	metadataList: [],
	pageInfo: {
		curPage: 1,
		medataSetId: "",
		typeModelId: "",
		modelId: "",
		agntId: "",
		agntNm: "",
		prptyId: "",
		prptyNm: "",
		srchVal: "",
		medataSetSttusMtcd: "use",
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	}
});

onMounted(() => {
	getMetadataList();
});

const searchRetrievalMetadataList = (payload) => {
	state.pageInfo.curPage = payload.curPage;
	state.pageInfo.medataSetId = payload.pageInfo.medataSetId;
	state.pageInfo.typeModelId = payload.pageInfo.typeModelId;
	state.pageInfo.modelId = payload.pageInfo.modelId;
	state.pageInfo.agntId = payload.pageInfo.agntId;
	state.pageInfo.prptyId = payload.pageInfo.prptyId;
	state.pageInfo.modelId = payload.pageInfo.modelId;
	state.pageInfo.srchVal = payload.pageInfo.srchVal;
	getMetadataList();
};

const clickMetadata = (payload) => {
	if (isReadYn(route.meta.auth)) {
		let platform = getCookie("pltfrmId");
		let query = { medataId: payload.medataId, medataSetId: payload.medataSetId, medataSetNm: payload.medataSetNm };
		routerPush(platform, "RetrievalMetadataPage", query);
	} else {
		alert("읽기 권한이 없습니다.");
	}
};

const getMetadataList = () => {
	$axios
		.get($apiUrls.meta.resource.metadatasets.getMetadataList, {
			params: {
				curPage: state.pageInfo.curPage,
				medataSetId: state.pageInfo.medataSetId,
				typeModelId: state.pageInfo.typeModelId,
				modelId: state.pageInfo.modelId,
				agntId: state.pageInfo.agntId,
				prptyId: state.pageInfo.prptyId,
				srchVal: state.pageInfo.srchVal,
				medataSetSttusMtcd: state.pageInfo.medataSetSttusMtcd,
			},
		})
		.then((res) => {
			state.metadataList = res.data.list;
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getMetadataList();
};

</script>
<style lang="scss"></style>