<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="agentList"
      :height="440"      
			@row-click="rowClick"			
    >
    </comn-list>

    <ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
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

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const user = getUser();

const emits = defineEmits(["pageMove", "chooseAgent"]);
const props = defineProps({
  agentList: {
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

const state = reactive({
  agentList: [],
  agent: {},
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,    
  }
});

const tableHeader = ref([
  {
    prop: "agntId",
    label: "대리인 ID",
    width: 70,
  },
  {
    prop: "agntNm",
    label: "대리인 명", /* 메타데이터 셋 명 */
    width: 70,
  },
  {
    prop: "agntModelNm",
    label: "대리인 모델 명",
    width: 70,
  },
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const rowClick = (node) => {
	state.agent.agntId = node.agntId;
	state.agent.agntNm = node.agntNm;
	emits("chooseAgent", { data: state.agent });
};

const handleClickModify = (index) => {
  tableData.value.splice(index, 1);
}

</script>
<style lang="scss"></style>