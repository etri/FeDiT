<template>
	<div>
		<ComnList 
		:tableHeader="tableHeader" 
		:tableData="rdfNamespaceList" 
		@row-click="rowClick">
		</ComnList>
	</div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, defineProps, defineEmits, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getUser, getLoginUserId } from "@/assets/js/auth.js";
import {
	getGlobalProperties,
	isAmdYn,
	isReadYn
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const user = getUser();

const emits = defineEmits(["detailNamespace"]);
const props = defineProps({
	rdfNamespaceList: {
		type: Array,
		required: true,
	},
	totalPage: {
		type: Number,
		required: true,
	}
});

const state = reactive({
	rdfNamespaceList: [],
	rdfNamespace: {},
});

const tableHeader = ref([
  {
    prop: "",
    label: "번호",
    width: 40,
    align: "center",
		type: "index",
  },
	{
		prop: "rdfNmspPfix",
		label: "Prefix",
		width: 100,
	},
	{
		prop: "rdfNmspUri",
		label: "URI",
		width: 350,
	},
	{
		prop: "rdfNmspAplyMtcdNm",
		label: "시스템 적용",
		width: 350,
	}
]);

const rowClick = (selectedRow) => {
	emits("detailNamespace", { selectedRow });
};

</script>
<style lang="scss"></style>