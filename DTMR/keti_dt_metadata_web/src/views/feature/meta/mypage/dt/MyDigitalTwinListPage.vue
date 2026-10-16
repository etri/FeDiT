<template>
	<div>
		<div class="cntSec">

			<MyDigitalTwinSearchForm :dataStatusList="dataStatusList" @searchMyDigitalTwinList="searchMyDigitalTwinList" />

			<div class="boxLayout">
				<div class="boxTit">
					<h3>내 디지털트윈 목록</h3>
				</div>
				<div class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<MyDigitalTwinList :myDigitalTwinList="state.myDigitalTwinList" :totalPage="state.pageInfo.totalListSize"
							:curPage="state.pageInfo.curPage" @clickDigitalTwin="clickDigitalTwin" @pageMove="pageMove" />
					</div>
				</div>
			</div>

		</div>
	</div>
</template>
<script setup>
import MyDigitalTwinSearchForm from "@/components/meta/mypagedigitaltwin/MyDigitalTwinSearchForm.vue";
import MyDigitalTwinList from "@/components/meta/mypagedigitaltwin/MyDigitalTwinList.vue";

import { onMounted, reactive, ref, getCurrentInstance, watch } from "vue";
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

const dataStatusList = ref([]);

const state = reactive({
	myDigitalTwinList: [],
	pageInfo: {
		curPage: 1,
		srchStartDd: "",
		srchEndDd: "",
		keyword: "",
		medataSetSttusMtcd: "",
		srchText: "",
		typeModelId: "DigitalTwin",
		includeDisuseYn: "Y",

		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	}
});

onMounted(() => {
	getMetaCodeList();
	getMyDigitalTwinList();
});

const getMyDigitalTwinList = () => {
	$axios
		.get($apiUrls.meta.portal.mypage.getMyDigitalTwinList, {
			params: {
				curPage: state.pageInfo.curPage,
				srchStartDd: state.pageInfo.srchStartDd,
				srchEndDd: state.pageInfo.srchEndDd,
				keyword: state.pageInfo.keyword,
				medataSetSttusMtcd: state.pageInfo.medataSetSttusMtcd,
				srchText: state.pageInfo.srchText,
				typeModelId: state.pageInfo.typeModelId,
				includeDisuseYn: state.pageInfo.includeDisuseYn,
			},
		})
		.then((res) => {
			state.myDigitalTwinList = res.data.list.map((x) => {
				x.medataSetAmdDt = dayjs(x.medataSetAmdDt).format('YYYY-MM-DD');
				return x;
			});
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const searchMyDigitalTwinList = (payload) => {
	state.pageInfo.curPage = payload.curPage;
	state.pageInfo.srchStartDd = payload.pageInfo.srchStartDd;
	state.pageInfo.srchEndDd = payload.pageInfo.srchEndDd;
	state.pageInfo.medataSetSttusMtcd = payload.pageInfo.medataSetSttusMtcd;
	state.pageInfo.keyword = payload.pageInfo.keyword;
	state.pageInfo.srchText = payload.pageInfo.srchText;
	getMyDigitalTwinList();
};

const getMetaCodeList = async () => {
	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00001"],
		},
	});

	const List = store.getters["MetaStore/getStoreMetaCodeList"]("MCG00001");
	dataStatusList.value = List;
};

const clickDigitalTwin = (payload) => {
	if (isReadYn(route.meta.auth)) {
		let platform = getCookie("pltfrmId");

		let query = { medataSetId: payload.medataSetId, backPageName: 'MyDigitalTwinListPage' };
		routerPush(platform, "DigitalTwinDetailManagePage", query);
	} else {
		alert("읽기 권한이 없습니다.");
	}
};

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getMyDigitalTwinList();
};

</script>
<style lang="scss"></style>