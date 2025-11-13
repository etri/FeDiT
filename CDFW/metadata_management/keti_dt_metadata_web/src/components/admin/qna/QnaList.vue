<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="qnaList"
      @row-click="rowClick"
    >
      <template v-slot:qnaTitle="slotProps">
        <div v-if="slotProps.row.ottpYn == 'Y'">
          {{ slotProps.row.qnaTitle }}
        </div>
        <div v-else>
          {{ slotProps.row.qnaTitle }} <el-icon><Lock /></el-icon>
        </div>
      </template>

      <template v-slot:retvNum="slotProps">
        <div v-if="slotProps.row.retvNum == null">
          <p>0</p>
        </div>
        <div v-else>
          {{ slotProps.row.retvNum }}
        </div>
      </template>

      <template v-slot:sttusCd="slotProps">
        <div v-if="slotProps.row.sttusCd == 'COD_02828'">
          <p>답변대기</p>
        </div>
        <div v-else>
          <p>답변완료</p>
        </div>
      </template>
    </comn-list>

    <ComnPagination
      :totalPage="totalPage"
      :curPage="curPage"
      @pagemove="pagemove"
    />
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, defineProps, defineEmits } from "vue";
import { getUser } from "@/assets/js/auth.js";
import { getGlobalProperties, getSuperAdmin } from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;


const user = getUser();
const emits = defineEmits(["pageMove", "qnaDetail"]);
const props = defineProps({
  qnaList: {
    type: Array,
    required: true,
  },
  qnaCode: {
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
    prop: "qnaOid",
    label: "번호",
    width: 150,
  },
  {
    prop: "qnaTitle",
    label: "질문제목",
    width: 250,
    columnType: "custom",
  },
  {
    prop: "regrId",
    label: "작성자",
    width: 150,
  },
  {
    prop: "sttusCd",
    label: "진행상태",
    width: 200,
    columnType: "custom",
  },
  {
    prop: "retvNum",
    label: "조회수",
    width: 200,
    columnType: "custom",
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
const rowClick = async (data) => {
  let superAdmin = await getSuperAdmin($axios, $apiUrls.admin.common.getSuperAdmin);
  if ( data.ottpYn == "Y" || user.id == data.regrId || user.id == superAdmin) {
    emits("qnaDetail", data);
  } 
  else alert("비공개 글입니다.");
};


</script>
<style lang="scss"></style>
