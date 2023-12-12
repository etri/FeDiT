<template>
  <div>
    <ComnList
      :tableHeader="tableHeader"
      :tableData="authList"
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
  authList: {
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

const emits = defineEmits(["pageMove", "detailAuth"]);

const tableHeader = ref([
  {
    prop: "autName",
    label: "권한명",
    width: 250,
  },
  {
    prop: "autDesc",
    label: "설명",
    width: 250,
  },
  {
    prop: "useYn",
    label: "사용여부",
    width: 250,
  },
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const rowClick = (data) => {
  emits("detailAuth", data);
};
</script>
<style lang="scss"></style>
