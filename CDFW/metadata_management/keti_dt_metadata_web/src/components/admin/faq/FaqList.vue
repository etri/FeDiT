<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="faqList"
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

const emits = defineEmits(["pageMove", "faqDetail"]);
const props = defineProps({
  faqList: {
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
    prop: "faqTitle",
    label: "제목",
    width: 150,
  },
  {
    prop: "regrId",
    label: "작성자",
    width: 250,
  },
  {
    prop: "retvNum",
    label: "조회수",
    width: 150,
  },
  {
    prop: "regDt",
    label: "등록일자",
    width: 150,
  },
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};
const rowClick = (payload) => {
  emits("faqDetail", payload);
};
</script>
<style lang="scss"></style>
