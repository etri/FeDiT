<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit" v-if="searchMode === 'domain'"><h3>RDF 프라퍼티 목록 - {{ rdfInfo.nodeNm }}</h3></div>
      <div class="boxTit" v-else><h3>RDF 프라퍼티 목록</h3></div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <div class="centered-table">
            <ComnList
              :tableHeader="tableHeader"
              :tableData="rdfPropertyList"
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
      </div>
    </div>
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, defineProps, defineEmits, reactive, onMounted } from "vue";

const emits = defineEmits(["pageMove"], ["selectedRow"]);

const props = defineProps({
  rdfPropertyList: {
    type: Array,
    required: true,
  },
  totalPage: {    //  rdfPropertyList
    type: Number,
    required: true,
  },
  curPage: {    // rdfPropertyList
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
    prop: "rdfPrptyNm",
    label: "RDF 프라퍼티 명",
    width: 120,
  },
  {
    prop: "rdfPrptyLogicNm",
    label: "RDF 프라퍼티 논리명",
    width: 120,
  },
  {
    prop: "rdfPrpty",
    label: "RDF 프라퍼티",
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


</script>
<style lang="scss"></style>