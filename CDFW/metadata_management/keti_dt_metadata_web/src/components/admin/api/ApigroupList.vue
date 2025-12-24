<template>
  <div>
    <ComnList
      :tableHeader="tableHeader"
      :tableData="apiList"
      @row-click="rowClick"
    ></ComnList>

    <ComnPagination :totalPage="totalPage" :curPage="curPage" @pagemove="pagemove" />
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import { ref, defineProps, defineEmits } from "vue";

const props = defineProps({
  apiList: {
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

const emits = defineEmits(["pageMove", "detailApi"]);

const tableHeader = ref([
  {
    prop: "grpName",
    label: "API 그룹명",
    width: 250,
  },
  {
    prop: "pltfrmId",
    label: "플랫폼 아이디",
    width: 250,
  },
  {
    prop: "useYn",
    label: "사용여부",
    width: 250,
  },
  {
    prop: "regrId",
    label: "등록자",
    width: 250,
  },
  {
    prop: "regDt",
    label: "등록일시",
    width: 250,
  },
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const rowClick = (data) => {
  emits("detailApi", data);
};
</script>
<style lang="scss"></style>
