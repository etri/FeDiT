<template>
	<div class="cntSec">
		<!-- 메타데이터 검색 -->
		<ExSearchForm @exSearchList="exSearchList" :pageInfo="route.query" />

		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 목록</h3>
			</div>
			<div class="boxCnt">
				<div style="overflow-x: hidden; overflow-y: auto">
					<ExSearchList :metadataList="state.metadataList" :totalListSize="state.pageInfo.totalListSize"
						:curPage="state.pageInfo.curPage" :pageInfo="state.pageInfo" @pageMove="pageMove" />
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import ExSearchForm from '@/components/meta/external/ExSearchForm.vue';
import ExSearchList from '@/components/meta/external/ExSearchList.vue';

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
		digitalTwinId: "",
		typeModelId: "DigitalTwin",
		srchText: "",
		keyword: "",
		keywordType: "",
		polygon: "",
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	}
});

onMounted(() => {
	if(typeof route.query.curPage !== "undefined" && route.query.curPage !== null) {
		state.pageInfo = route.query;
	}
	getMetadataList();
});

const exSearchList = (payload) => {
	state.pageInfo.curPage = payload.curPage;
	state.pageInfo.digitalTwinId = payload.pageInfo.digitalTwinId;
	state.pageInfo.typeModelId = payload.pageInfo.typeModelId;
	state.pageInfo.srchText = payload.pageInfo.srchText;
	state.pageInfo.keyword = payload.pageInfo.keyword;
	state.pageInfo.keywordType = payload.pageInfo.keywordType;
	state.pageInfo.polygon = payload.pageInfo.polygon;
	getMetadataList();
};

const getMetadataList = () => {
	$axios
		.get($apiUrls.publicpage.meta.search.metadata.getMetadataList, {
			params: {
				curPage: state.pageInfo.curPage,
				digitalTwinId: state.pageInfo.digitalTwinId,
				typeModelId: state.pageInfo.typeModelId,
				srchText: state.pageInfo.srchText,
				keyword: state.pageInfo.keyword,
				keywordType: state.pageInfo.keywordType,
				polygon: state.pageInfo.polygon
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