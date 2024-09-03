<template>
	<div>
		<comn-list :tableHeader="tableHeader" :tableData="metadataObjectList" :height="440" @row-click="rowClick">
			<template v-slot:medataVal="slotData">
				<span @click="goToMetadataManagePage1(slotData.row)" class="link-text">
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
import metaCommon from "@/assets/js/metaCommon.js";

const emits = defineEmits(["objectPageMove", "chooseMetadataFromObjectType", "goToDetailPage"]);
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

const goToMetadataManagePage1 = (payload) => {
	emits("goToDetailPage");
	metaCommon.goToMetadataManagePage({
		medataSetId: payload.medataVal,
		typeModelId: props.rangeTypeModelId,
		backPageName: props.backPageName
	});
}

</script>