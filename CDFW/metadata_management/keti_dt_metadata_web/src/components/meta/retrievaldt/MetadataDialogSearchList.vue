<template>
	<div>

		<div v-if="'geoJson' != props.rangeDataTypeMtcd && !metaConst.ARR_ETCJSON_DATATYPE.includes(props.rangeDataTypeMtcd)">
			<comn-list
				:tableHeader="tableHeader"
				:tableData="metadataList"
				@row-click="rowClick"
			> <!--       :height="300" -->
			</comn-list>
			<ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
		</div>

		<div v-if="'geoJson' === props.rangeDataTypeMtcd">
			<comn-list
				:tableHeader="tableHeaderForGeoJson"
				:tableData="metadataList"
				@row-click="rowClickForGeoJson"
			> <!--       :height="300" -->
			</comn-list>
			<ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
		</div>

		<div v-if="metaConst.ARR_ETCJSON_DATATYPE.includes(props.rangeDataTypeMtcd)">
			<comn-list
				:tableHeader="tableHeaderForEtcJson"
				:tableData="metadataList"
				@row-click="rowClickForEtcJson"
			> <!--       :height="300" -->
			</comn-list>
			<ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
		</div>		

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
  isAmdYn, 
  isReadYn 
} from "@/assets/js/common.js";
import util from "util";
import metaConst from "@/assets/js/metaConst.js";

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const emits = defineEmits(["pageMove", "chooseMetadataFromDataType", "chooseMetadataFromGeoJson", "chooseMetadataFromEtcJson"]);
const props = defineProps({
	metadataList: {
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
	rangeModelTypeMtcd: {
		type: String,
		required: false
	},
	rangeDataTypeMtcd: {
		type: String,
		required: false
	}
});

const state = reactive({
	metadataList: [],
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
    prop: "rownum",
    label: "번호",
    width: 45,
    align: "center"
  },
	{
		prop: "medataVal",
		label: "메타데이터 값",
		width: 370,
	},	
	{
		prop: "langMtcd",
		label: "언어",
		width: 100,
	},
]);

const tableHeaderForGeoJson = ref([
	{
		prop: "geodataVal",
		label: "지리데이터 값",
		width: 370,
	}	
]);

const tableHeaderForEtcJson = ref([
	{
		prop: "medataVal",
		label: "메타데이터 값",
		width: 370,
	}	
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const rowClick = (node) => {
	state.metadata.medataId = node.medataId;
	state.metadata.prptyId = node.prptyId;
	state.metadata.langMtcd = node.langMtcd;
	state.metadata.medataVal = node.medataVal;
	emits("chooseMetadataFromDataType", { data: state.metadata });
};

const rowClickForGeoJson = (node) => {
	state.metadata = {...node};
	emits("chooseMetadataFromGeoJson", { data: state.metadata });	
};

const rowClickForEtcJson = (node) => {
	state.metadata = {...node};
	emits("chooseMetadataFromEtcJson", { data: state.metadata });
};

</script>
<style lang="scss"></style>