<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="brdmessageList"
      @row-click="rowClick"
    >
      <template v-slot:retvNum="slotProps">
        <div v-if="slotProps.row.retvNum == null">
          <p>0</p>
        </div>
        <div v-else>
          {{ slotProps.row.retvNum }}
        </div>
      </template>
    </comn-list>

    <ComnPagination :totalPage="totalPage" :curPage="curPage" @pagemove="pagemove" />
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, defineProps, defineEmits } from "vue";

const emits = defineEmits(["pageMove", "detailBoardmsg"]);
const props = defineProps({
  brdmessageList: {
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
    prop: "pstngTitle",
    label: "게시글",
    width: 250,
  },

  {
    prop: "prevPstngYn",
    label: "선게시 여부",
    width: 100,
  },
  {
    prop: "retvNum",
    label: "조회수",
    width: 100,
    columnType: "custom",
  },
  {
    prop: "regrId",
    label: "작성자",
    width: 100,
  },
  {
    prop: "regDt",
    label: "작성일",
    width: 250,
  },
]);
const pagemove = (payload) => {
  emits("pageMove", payload);
};
const rowClick = (payload) => {
  emits("detailBoardmsg", payload);
};
</script>
<style lang="scss"></style>
