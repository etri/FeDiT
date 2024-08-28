<template>
  <div class="boxLayout">
    <div class="boxTit" v-if="searchMode === 'range'"><h3>RDF 클래스 목록 - {{ rdfInfo.nodeNm }}</h3></div>
    <div class="boxTit" v-else><h3>RDF 클래스 목록</h3></div>
    <div class="boxCnt">
      <ComnList
        :tableHeader="tableHeader"
        :tableData="rdfClassList"
        :height="470"
        @row-click="rowClick"
      />
      <ComnPagination
        :totalPage="totalPage"
        :curPage="curPage"
        @pagemove="pagemove"
      />
    </div>
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, defineProps, defineEmits, reactive, onMounted } from "vue";
const emits = defineEmits(["pageMove"], ["selectedRow"]);

const props = defineProps({
  rdfClassList: {
    type: Array,
    required: true,
  },
  totalPage: {    //  rdfClassList
    type: Number,
    required: true,
  },
  curPage: {    // rdfClassList
    type: Number,
    required: true,
  },
  rdfNmspList: {
    type: Array,
    required: true,
  },
  rdfFormMtcdList: {
    type: Array,
    required: true,
  },
  searchMode: "",
  searchTypeFix:{
    type: Boolean,
  },
  rdfInfo: {
    type: Object,
  }
});

const tableHeader = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 40,
    align: "center",
  },
  {
    prop: "rdfClassNm",
    label: "RDF 클래스 명",
    width: 120,
  },
  {
    prop: "rdfClassLogicNm",
    label: "RDF 클래스 논리명",
    width: 120,
  },
  {
    prop: "rdfClass",
    label: "RDF 클래스",
    width: 120,
  },
  {
    prop: "rdfFormMtcdNmStr", // DB에서 조회한 배열 데이터를 콤마로 이어붙여서 string으로 변환
    label: "RDF 매핑 형식",
    width: 120,
  },
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const rowClick = (rowData) => {
	emits("selectedRow", { rowData });  
};

onMounted(() => {});

</script>
<style lang="scss"></style>