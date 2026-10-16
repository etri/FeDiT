<template>
  <div class="imgWrap">
    <comn-list
      :tableHeader="tableHeader"
      :tableData="imgList"
      @row-click="rowClick"
    >
      <template v-slot:imgSrc="slotProps">
        <div v-if="slotProps.row.imgSrc != null">
          <img :src="slotProps.row.imgSrc" style="width: 30px; height: 30px" />
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

const emits = defineEmits(["pageMove", "imgDetail"]);
const props = defineProps({
  imgList: {
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
    prop: "imgSrc",
    label: "미리보기",
    width: 30,
    columnType: "custom",
  },
  {
    prop: "imgNm",
    label: "이미지명",
    width: 250,
  },
  {
    prop: "imgLnydNm",
    label: "이미지 설명",
    width: 150,
  },
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};
const rowClick = (data) => {
  emits("imgDetail", data);
};
</script>
<style lang="scss">
.imgWrap {
  .el-table__row {
    td:first-child {
      background: #94d8ff;
      text-align: center;
    }
  }
}
</style>
