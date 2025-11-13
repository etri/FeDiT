<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="metaDataModelList"
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

import { ref, reactive, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
const route = useRoute();
const router = useRouter();
const emits = defineEmits(["pageMove"], ["selectedRow"]);
const props = defineProps({
	metaDataModelList: {
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
    prop: "rownum",
    label: "번호",
    width: 40,
    align: "center"
  },
  {
    prop: "modelNm",
    label: "모델 명",
    width: 100,
  },
  {
    prop: "modelLogicNm",
    label: "모델 논리명",
    width: 100,
  },
  {
    prop: "upModelNm",
    label: "상위 모델 명",
    width: 100,
  },  
  {
    prop: "modelDataSttusMtcdNm",
    label: "상태",
    width: 60,
  }
]);

const rowClick = (rowData) => {
	emits("selectedRow", { rowData });  
};

const pagemove = (payload) => {
  emits("pageMove", payload);
};

</script>
<style lang="scss"></style>