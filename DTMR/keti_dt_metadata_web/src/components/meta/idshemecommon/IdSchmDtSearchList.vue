<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="idSchemeCodeList"
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
	idSchemeCodeList: {
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
    prop: "idSchmCd",
    label: "식별체계 코드",
    width: 50,
  },
  {
    prop: "lctgExtrCd",
    label: "대분류",
    width: 50,
  },
  {
    prop: "idSchmCdNm",
    label: "식별체계 코드 명",
    width: 150,
  },  
]);

const rowClick = (rowData) => {
	emits("selectedRow", { rowData });  
};

const pagemove = (payload) => {
  emits("pageMove", payload);
};

</script>
<style lang="scss"></style>