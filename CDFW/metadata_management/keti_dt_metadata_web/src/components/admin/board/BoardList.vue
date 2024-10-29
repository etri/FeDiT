<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="boardList"
      @row-click="rowClick"
    >
    </comn-list>

    <ComnPagination :totalPage="totalPage" :curPage="curPage" @pagemove="pagemove" />
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref } from "vue";

const props = defineProps({
  boardList: {
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

const emits = defineEmits(["pageMove", "detailBoard"]);

const tableHeader = ref([
  {
    prop: "bbsNm",
    label: "게시판명",
    width: 250,
  },
  {
    prop: "atcFileUseYn",
    label: "첨부파일",
    width: 250,
  },
  {
    prop: "replUseYn",
    label: "댓글",
    width: 250,
  },
]);
const pagemove = (payload) => {
  emits("pageMove", payload);
};
const rowClick = (data) => {
  emits("detailBoard", data);
};
</script>
<style lang="scss"></style>
