<template>
	<div class="listTable">
		<div>
			<ComnList
			:tableHeader="tableHeader"
			:tableData="metadataList"
			@row-click="goPage"
			  />
		</div>

		<ComnPagination :totalPage="props.totalListSize" :curPage="props.curPage" @pagemove="pagemove" />
	</div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { reactive, defineProps, ref } from "vue";
import { useRouter, useRoute } from "vue-router";

const route = useRoute();
const router = useRouter();

const emits = defineEmits(["pageMove", "clickMetadata"]);
const props = defineProps({
	metadataList: {
		type: Array,
		required: true,
	},
	totalListSize: {
		type: Number,
		required: true,
	},
	curPage: {
		type: Number,
		required: true,
	},
});

const state = reactive({
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
    prop: "medataSetNm",
    label: "메타데이터 셋 명",
    width: 150,
  },
  {
    prop: "typeModelNm",
    label: "유형",
    width: 100,
  },
  {
    prop: "modelNm",
    label: "표준 모델",
    width: 100,
  },
  {
    prop: "medataSetId",
    label: "ID",
    width: 100,
  },
]);

const goPage = (payload) => {
	const query = {}; // TODO 검색조건
	router.push({path: `/meta/exsearch/page/${payload.medataSetId}`, query: query});
};

const pagemove = (payload) => {
	emits("pageMove", payload);
};

</script>
<style lang="scss" scoped></style>