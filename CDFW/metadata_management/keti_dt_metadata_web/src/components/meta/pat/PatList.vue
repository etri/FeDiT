<template>

<div class="listTable">
	<div>
		<comn-list
		:tableHeader="tableHeader"
		:tableData="patList"
		@row-click="elementClick"
		>

		<template v-slot:toknExpDate="slotProps">
			<div v-if="slotProps.row.toknExpDate !== null">
				<p>{{ slotProps.row.toknExpDate }}</p>
			</div>
			<div v-else>
				<p>기한 없음</p>
			</div>
		</template>
		</comn-list>
	</div>
    <ComnPagination :totalPage="props.totalPage" :curPage="props.curPage" @pagemove="pagemove" />
</div>

</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, reactive, defineProps, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getUser } from "@/assets/js/auth.js";
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
const $emitter =
  getCurrentInstance().appContext.config.globalProperties.$emitter;

const emits = defineEmits(["pageMove", "clickPat"]);

const props = defineProps({
	patList: {
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
});

const tableHeader = ref([
  {
    prop: "toknNm",
    label: "Token 명",
    width: 200,
  },
  {
    prop: "toknExpDate",
    label: "만료일",
    width: 100,
	columnType: "custom",
  },
]);


const elementClick = (item) => {
	console.log(item);
  emits("clickPat", item);
};

const pagemove = (payload) => {
  emits("pageMove", payload);
};

</script>
<style lang="scss">
</style>