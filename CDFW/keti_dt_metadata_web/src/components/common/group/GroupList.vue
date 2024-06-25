<template>
  <div>
    <ComnList
      :tableHeader="tableHeader"
      :tableData="groupList"
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
  groupList: {
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

const emits = defineEmits(["pageMove", "groupDetail"]);

const tableHeader = ref([
  {
    prop: "grpId",
    label: "그룹 ID",
    width: 250,
  },
  {
    prop: "grpNm",
    label: "그룹 명",
    width: 250,
  },
  {
    prop: "regrNm",
    label: "등록자 명",
    width: 250,
  },
  {
    prop: "regDt",
    label: "등록일시",
    width: 250,
  },
  {
    prop: "amdDt",
    label: "수정일시",
    width: 250,
  },
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const rowClick = (data) => {
  emits("groupDetail", data);
};
</script>
<style lang="scss"></style>
