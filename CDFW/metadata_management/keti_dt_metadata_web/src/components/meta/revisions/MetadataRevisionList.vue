<template>
  <div>
    <ComnList 
      :tableHeader="tableHeader" 
      :tableData="props.metadataRevisionList" 
      @rowClick="goToDetailDialog" />

    <el-dialog v-model="dialogVisibleDetail" v-bind:title="dialogTitle">
      <MetadataRevisionDialogDetail :medataSetId="selectedMedataSetId" :time="selectedMedataTime" />
    </el-dialog>

    <ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import MetadataRevisionDialogDetail from "@/components/meta/revisions/MetadataRevisionDialogDetail.vue";

import { ref, reactive } from "vue";

const emits = defineEmits(["pageMove"]);

const props = defineProps({

  metadataRevisionList: {
    type: Array,
    required: true
  },
  totalPage: {
    type: Number,
    required: true
  },
  curPage: {
    type: Number,
    required: true
  }
});

const state = reactive({
  metadataRevisionList: [],
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
  }
});

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const dialogTitle = ref('변경이력 상세');
const dialogVisibleDetail = ref(false);
const selectedMedataSetId = ref('');
const selectedMedataTime = ref('');

const goToDetailDialog = (node) => {
  dialogVisibleDetail.value = true;
  selectedMedataSetId.value = node.medataSetId;
  selectedMedataTime.value = node.time;
};

const tableHeader = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 15,
    align: "center"
  },
  {
    prop: "formattedTime",
    label: "_time",
    width: 35,
  },
  {
    prop: "medataSetId",
    label: "메타데이터 셋 ID",
    width: 35,
  },
  {
    prop: "value",
    label: "_value",
    width: 140,
  },
]);

</script>
<style lang="scss"></style>