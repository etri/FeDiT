<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="categoryList"
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

const emits = defineEmits(["pageMove", "chooseUpperCategory"]);
const props = defineProps({
  categoryList: {
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
  categoryList: [],
	category: {},
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,    
  }
});

const tableHeader = ref([
  {
    prop: "ctgryNm",
    label: "카테고리 명",
    width: 150,
  },	
  {
    prop: "ctgryRdfCncptNm",
    label: "카테고리 RDF 개념명",
    width: 150,
  },
  {
    prop: "upCtgryNm",
    label: "상위 카테고리 명",
    width: 150,
  },		
  {
    prop: "ctgryId",
    label: "카테고리 ID",
    width: 100,
  },
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const rowClick = (node) => {
  state.category.ctgryId = node.ctgryId;
  state.category.ctgryNm = node.ctgryNm;
  state.category.ctgryRdfCncptNm = node.ctgryRdfCncptNm;
  emits("chooseUpperCategory", { data: state.category });
};

</script>
<style lang="scss"></style>