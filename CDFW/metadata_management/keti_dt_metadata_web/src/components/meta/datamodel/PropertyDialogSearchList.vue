<template>
<div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="propertyList"
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
import { getGlobalProperties } from "@/assets/js/common.js";

const emits = defineEmits(["pageMove", "selectedRow"]);
const props = defineProps({
  propertyList: {
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
  propertyList: [],
	property: {},
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
    width: 40,
    align: "center"
  },	
  {
    prop: "prptyNm",
    label: "프라퍼티 명",
    width: 100,
  },	
  {
    prop: "prptyLogicNm",
    label: "프라퍼티 논리명",
    width: 100,
  },	
  {
    prop: "dataArrayYn",
    label: "데이터 배열 여부",
    width: 100,
  },		
  /* 2023-06-29 상위 프라퍼티 막음 {
    prop: "upPrptyId",
    label: "상위 프라퍼티 명",
    width: 100,
  },*/		
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const rowClick = (rowData) => {
	emits("selectedRow", { rowData });
};

</script>
<style lang="scss"></style>