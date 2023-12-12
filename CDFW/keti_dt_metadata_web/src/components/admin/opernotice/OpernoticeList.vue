<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="operList"
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
      <template v-slot:fileCount="slotProps">
        <div v-if="slotProps.row.fileCount > 0">
          <img src="@/assets/images/common/ico_file.png" />
        </div>
        <div v-else>
          <span> X </span>
        </div>
      </template>
    </comn-list>

    <ComnPagination :totalPage="totalPage" :curPage="curPage" @pagemove="pagemove" />
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import { ref } from "vue";

const emits = defineEmits(["pageMove", "detailNotice"]);
const props = defineProps({
  operList: {
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
    prop: "ntfOid",
    label: "번호",
    width: 150,
  },
  {
    prop: "ntfTitle",
    label: "제목",
    width: 250,
  },
  {
    prop: "regrId",
    label: "등록자",
    width: 150,
  },
  {
    prop: "prevNtfYn",
    label: "우선공지",
    width: 150,
  },
  {
    prop: "regDt",
    label: "등록일",
    width: 200,
  },
  {
    prop: "retvNum",
    label: "조회수",
    width: 150,
    columnType: "custom",
  },
  {
    prop: "fileCount",
    label: "파일",
    width: 50,
    columnType: "custom",
  },
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};
const rowClick = (data) => {
  emits("detailNotice", data);
};
</script>
<style lang="scss"></style>
