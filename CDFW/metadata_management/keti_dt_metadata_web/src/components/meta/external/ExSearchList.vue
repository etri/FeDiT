<template>
	<div class="listTable">
		<div>
			<ComnList
			:tableHeader="tableHeader"
			:tableData="metadataList"
			@row-click="goPage"
			>
				<template #medataSetNm="{ row }">
					{{ row.medataSetNm }}
					<span
						v-if="row.medataSetSttusMtcd"
						class="meta-status-badge ml10"
						:class="`is-${row.medataSetSttusMtcd}`"
					>{{ row.medataSetSttusMtcdNm }}</span>
				</template>
			</ComnList>
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
	pageInfo: {
		type: Object,
		required: false,
	}
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
    columnType: "custom",
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
	const path = route.path;
	const query = props.pageInfo;

	// TODO : 기존 router push는 남겨둔 상태로 external route 관련 적용 처리. 추후 수정 필요.
	if(path.includes('exsearch')) {
		router.push({path: `/meta/exsearch/page/${payload.medataSetId}`, query: query});
	}
	else {
		const isExternal = window.location.pathname.startsWith("/meta/external");
		if(isExternal) {
			router.push({path: `/meta/external/search/intgrdata/page/${payload.medataSetId}`, query: query});
		}
		else {
			router.push({path: `/meta/search/intgrdata/page/${payload.medataSetId}`, query: query});
		}
	}
};

const pagemove = (payload) => {
	emits("pageMove", payload);
};

</script>
<style lang="scss" scoped></style>