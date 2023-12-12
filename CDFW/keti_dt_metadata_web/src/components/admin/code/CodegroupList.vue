<template>
  <div class="ly-content">
    <ComnList
      :tableHeader="tableHeader"
      :tableData="codeList"
      @row-click="rowClick"
    ></ComnList>

    <ComnPagination :totalPage="totalPage" @pagemove="pagemove" :curPage="curPage"/>
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import { ref, defineProps, defineEmits } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const props = defineProps({
  codeList: {
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

const emits = defineEmits(["pageMove", "detailCode"]);

const tableHeader = ref([
  {
    prop: "grpNm",
    label: "코드 그룹명",
    width: 250,
  },
  {
    prop: "grpVal",
    label: "코드 그룹값",
    width: 250,
  },
]);
const pagemove = (payload) => {
  emits("pageMove", payload);
};
const rowClick = (data) => {
  emits("detailCode", data);
};
</script>
<style lang="scss"></style>
