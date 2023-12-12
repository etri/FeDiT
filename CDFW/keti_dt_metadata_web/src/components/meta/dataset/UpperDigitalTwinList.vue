<template>
	<div>
		<ComnList :tableHeader="tableHeader" :tableData="upperMetadataSetDtwListBySubSetId" :minHeight="80">

			<template v-slot:dtwNm="slotData">
				<span @click="goToDigitalTwinManagePage(slotData.row)" class="link-text">
					{{ slotData.row.dtwNm }}
				</span>
			</template>

			<template v-slot:upSetNm="slotData">
				<span @click="goToMetadataManagePage(slotData.row)" class="link-text">
					{{ slotData.row.upSetNm }}
				</span>
			</template>

		</ComnList>
	</div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";

import { ref, reactive, defineProps, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getUser, getLoginUserId } from "@/assets/js/auth.js";
import {
	getGlobalProperties,
	isAmdYn,
	isReadYn,
	getCookie,
	routerPush
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;

//router에 등록한 페이지명
// [managePageNameArr] 관리용 메뉴 (디지털트윈 관리 상세, 메타데이터 관리 상세)
// [retrievalPageNameArr] 검색용 메뉴 (디지털트윈 검색, 메타데이터셋 검색, 메타데이터 검색)
const managePageNameArr = ['DigitalTwinDetailManagePage', 'MetadataDetailManagePage'];
const retrievalPageNameArr = ['RetrievalMetadataSetPage', 'RetrievalDigitalTwinDatasetPage', 'RetrievalMetadataPage'];

const props = defineProps({
	upperMetadataSetDtwListBySubSetId: {
		type: Array,
		required: false,
	},
	backPageName: {
		type: String,
		required: false,
	}
});

const tableHeader = ref([
	{
		prop: "",
		label: "번호",
		width: 45,
		align: "center",
		type: "index",
	},
	{
		prop: "dtwNm",
		label: "디지털트윈",
		width: 130,
		columnType: "custom",
	},
	{
		prop: "dtwSttusMtcdNm",
		label: "디지털트윈 상태",
		width: 130,
	},
	{
		prop: "upSetNm",
		label: "연결 메타데이터 셋",
		width: 130,
		columnType: "custom",
	},
	{
		prop: "upPrptyNm",
		label: "연결 프라퍼티",
		width: 130,
	},
	{
		prop: "upSetSttusMtcdNm",
		label: "연결 메타데이터 셋 상태",
		width: 130,
	},
]);

const goToDigitalTwinManagePage = (payload) => {
	let platform = getCookie("pltfrmId");
	let query = { medataSetId: payload.dtwId };
	let backPageName = props.backPageName;

	if (managePageNameArr.includes(backPageName)) { //관리용 메뉴 (디지털트윈 관리 상세)
		routerPush(platform, "DigitalTwinDetailManagePage", query);
	} else if (retrievalPageNameArr.includes(backPageName)) { //검색용 메뉴 (디지털트윈 셋조회 상세)
		routerPush(platform, "RetrievalDigitalTwinDatasetPage", query);
	}
};

const goToMetadataManagePage = (payload) => {
	let platform = getCookie("pltfrmId");
	let query = { medataSetId: payload.upSetId };
	let backPageName = props.backPageName;

	let typeModelId = payload.upTypeModelId; //model table내의 type_model_id 로 분기 처리
	if ('DigitalTwin' === typeModelId) {

		if (managePageNameArr.includes(backPageName)) { //관리용 메뉴 (디지털트윈 관리 상세)
			routerPush(platform, "DigitalTwinDetailManagePage", query);
		} else if (retrievalPageNameArr.includes(backPageName)) { //검색용 메뉴 (디지털트윈 셋조회 상세)
			routerPush(platform, "RetrievalDigitalTwinDatasetPage", query);
		}

	} else {

		if (managePageNameArr.includes(backPageName)) { //관리용 메뉴 (메타데이터셋 관리 상세)
			routerPush(platform, "MetadataDetailManagePage", query);
		} else if (retrievalPageNameArr.includes(backPageName)) { //검색용 메뉴 (메타데이터셋 셋조회 상세)
			routerPush(platform, "RetrievalMetadataSetPage", query);
		}
	}
};

</script>
<style lang="scss"></style>