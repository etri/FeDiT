<template>
      <div class="boxTit">
        <h3>그룹 사용자 목록</h3>
      </div>
      <div class="boxCnt">
        <ComnList
          :tableHeader="tableHeader"
          :tableData="groupUserList"
          @row-click=""
        ></ComnList>

        <ComnPagination
          :totalPage="state.pageInfo.totalListSize"
          @pagemove="pagemove"
        />
      </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import { reactive, defineProps, defineEmits, onMounted } from "vue";

const props = defineProps({
  groupUserList: {
    type: Array,
    required: true,
  },
});
const emits = defineEmits([
  "cancelPopup",
  "selectedUser",
  "searchUser",
  "resetSearchUser",
]);
const state = reactive({
  pageInfo: {
    curPage: 1,
    searchType: "0",
    searchWord: "",
    searchUseYn: "0",
    typeCd: "",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
  },
});

const tableHeader = [
  {
    type: "",
    width: 50,
  },
  {
    prop: "grpId",
    label: "그룹 ID",
    width: 250,
  },
  {
    prop: "userId",
    label: "사용자 ID",
    width: 250,
  },
];

</script>
<style lang="scss"></style>
