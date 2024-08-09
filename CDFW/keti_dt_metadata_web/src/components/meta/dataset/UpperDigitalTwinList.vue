<template>
	<div>
		<ComnList :tableHeader="tableHeader" :tableData="upperMetadataSetDtwListBySubSetId" :minHeight="80">

			<template v-slot:dtwNm="slotData">
				<span @click="goToDigitalTwinManagePage1(slotData.row)" class="link-text">
					{{ slotData.row.dtwNm }}
				</span>
			</template>

			<template v-slot:upSetNm="slotData">
				<span @click="goToMetadataManagePage1(slotData.row)" class="link-text">
					{{ slotData.row.upSetNm }}
				</span>
			</template>

		</ComnList>
	</div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";

import { ref, reactive, defineProps, getCurrentInstance } from "vue";
import metaCommon from "@/assets/js/metaCommon.js";

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

const goToDigitalTwinManagePage1 = (payload) => {
	metaCommon.goToDigitalTwinManagePage({
		medataSetId: payload.dtwId,
		backPageName: props.backPageName
	});
}

const goToMetadataManagePage1 = (payload) => {
	metaCommon.goToMetadataManagePage({
		medataSetId: payload.upSetId,
		typeModelId: payload.upTypeModelId,
		backPageName: props.backPageName
	});
}

</script>