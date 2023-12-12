<template>
	<div>
		<comn-list :tableHeader="tableHeader" :tableData="metadataObjectList" :height="440" @row-click="rowClick">
			<template v-slot:medataVal="slotData">
				<span @click="goToMetadataManagePage(slotData.row)" class="link-text">
					{{ slotData.row.medataVal }}
				</span>
			</template>
		</comn-list>
		<ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="objectPagemove" />
	</div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, reactive, defineProps } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getUser, getLoginUserId } from "@/assets/js/auth.js";
import {
	getGlobalProperties,
	getCookie,
	isEmpty,
	routerPush
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const emits = defineEmits(["objectPageMove", "chooseMetadataFromObjectType"]);
const props = defineProps({
	metadataObjectList: {
		type: Array,
		required: true,
	},
	totalPage: {
		type: Number,
		required: true,
	},
	curPage: {
		type: Number,
		required: true,
	},
	rangeTypeModelId: { //유형 모델 ID
		type: String,
		required: false,
	},

	backPageName: {
		type: String,
		required: false,
	}
});

const state = reactive({
	metadataObjectList: [],
	metadata: {},
	pageInfo: {
		curPage: 1,
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	}
});

const tableHeader = ref([
	{
		prop: "rownum", //pagination 적용한 목록에서 쓰이는 번호 column
		label: "번호",
		width: 45,
		align: "center"
	},
	{
		prop: "medataVal",
		label: "메타데이터 값",
		width: 150,
		columnType: "custom",
	},
	{
		prop: "medataValNm",
		label: "값의 메타데이터 셋 명",
		width: 200,
	},
	{
		prop: "medataValSttusMtcdNm",
		label: "상태",
		width: 100,
	},
	{
		prop: "medataValAmdDt",
		label: "수정일",
		width: 100,
	}
]);

const objectPagemove = (payload) => {
	emits("objectPageMove", payload);
};

const rowClick = (node, column) => {
	if(column.property == 'medataVal'){		//  medataVal 칼럼 영역은 링크 누를 때만 이벤트 발생
		return;
	}
	state.metadata.medataId = node.medataId;
	state.metadata.prptyId = node.prptyId;
	state.metadata.langMtcd = node.langMtcd;
	state.metadata.medataVal = node.medataVal;
	state.metadata.medataValNm = node.medataValNm;
	state.metadata.medataValSttusMtcdNm = node.medataValSttusMtcdNm;
	state.metadata.medataValAmdDt = node.medataValAmdDt;
	emits("chooseMetadataFromObjectType", { data: state.metadata });
};

const goToMetadataManagePage = (payload) => {
	if (isEmpty(payload.medataVal)) return;

	let platform = getCookie("pltfrmId");
	let query = { medataSetId: payload.medataVal }; //메타데이터 셋 ID

	//router에 등록한 페이지명
	// [managePageNameArr] 관리용 메뉴 (디지털트윈 관리 상세, 메타데이터 관리 상세)
	// [retrievalPageNameArr] 검색용 메뉴 (디지털트윈 검색, 메타데이터셋 검색, 메타데이터 검색)
	let managePageNameArr = ['DigitalTwinDetailManagePage', 'MetadataDetailManagePage'];
	let retrievalPageNameArr = ['RetrievalMetadataSetPage', 'RetrievalDigitalTwinDatasetPage', 'RetrievalMetadataPage'];

	let backPageName = props.backPageName;
	let typeModelId = props.rangeTypeModelId; //model table내의 type_model_id 로 분기 처리

	if ('DigitalTwin' === typeModelId) { //누른 메타데이터값 -> 메타데이터 셋 ID
		//디지털트윈관리 or 디지털트윈검색 page로 이동
		if (managePageNameArr.includes(backPageName)) {
			routerPush(platform, "DigitalTwinDetailManagePage", query);
		} else if (retrievalPageNameArr.includes(backPageName)) {
			routerPush(platform, "RetrievalDigitalTwinDatasetPage", query);
		}
	} else {
		//메타데이터관리 or 메타데이터 검색 page로 이동
		if (managePageNameArr.includes(backPageName)) {
			routerPush(platform, "MetadataDetailManagePage", query);
		} else if (retrievalPageNameArr.includes(backPageName)) {
			routerPush(platform, "RetrievalMetadataSetPage", query);
		}
	}
};

</script>