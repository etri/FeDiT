<template>
  <div class="boxLayout">
    <div class="boxTit" v-if="searchMode === 'model'"><h3>메타데이터 모델 프라퍼티 목록 - {{ modelNm }}</h3></div>
    <div class="boxTit" v-else><h3>메타데이터 모델 프라퍼티 목록</h3></div>
    <div class="boxCnt">
      <div style="overflow-x: hidden; overflow-y: auto">
        <div class="centered-table">
          <ComnList
            :tableHeader="tableHeader"
            :tableData="modelPropertyList"
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
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, defineProps, defineEmits, reactive, onMounted } from "vue";
const emits = defineEmits(["pageMove"], ["selectedRow"]);

const props = defineProps({
  modelPropertyList: { 
    type: Array,
    required: true,
  },
  totalPage: {    //  modelPropertyList
    type: Number,
    required: true,
  },
  curPage: {    // modelPropertyList
    type: Number,
    required: true,
  },
  searchMode: "",
  modelId: "",
  modelNm: "",
});

const tableHeader = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 40,
    align: "center",
  },
  {
    prop: "prptyNm",
    label: "프라퍼티 명",
    width: 120,
  },
  {
    prop: "prptyLogicNm",
    label: "프라퍼티 논리명",
    width: 120,
  },
  {
    prop: "rangeModelNm",
    label: "범위 모델명",
    width: 120,
  },
  {
    prop: "modelPrptyMandMtcdNm",
    label: "필수 구분",
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