<template>
	<div>
		<ComnList
			:tableHeader="tableHeader"
			:tableData="upperMetadataSetDtwListBySubSetId" 
      :minHeight="100"
      :height="`${upperMetadataSetDtwListBySubSetId.length <= 1 ? 100 : (upperMetadataSetDtwListBySubSetId.length + 1) * 40 }`"
			@row-click="rowClick"/>
	</div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";

import { ref, reactive, defineProps, defineEmits, getCurrentInstance } from "vue";
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
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;

const emits = defineEmits(["chooseUpperMetadataSetDtw"]);

const props = defineProps({
	upperMetadataSetDtwListBySubSetId: {
		type: Array,
		required: false,
	}
});

const tableHeader = ref([
  {
    prop: "medataSetNm",
    label: "연결 메타데이터 셋",
    width: 130,
  },
  {
    prop: "prptyNm",
    label: "연결 프라퍼티",
    width: 130,
  },
  {
    prop: "medataSetSttusMtcdNm",
    label: "연결 메타데이터 셋 상태",
    width: 130,
  },
]);

const rowClick = (node) => {
	emits("chooseUpperMetadataSetDtw", { data: node });
};

</script>
<style lang="scss"></style>