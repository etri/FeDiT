<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>API그룹 검색</h3>
    </div>
    <div class="boxCnt">
      <el-form-item label="API이름" prop="name" class="chTable">
        <el-input
          v-model="state.name"
          placeholder="검색어를 입력하세요."
          @keyup.enter="searchApiName"
          style="width: 400px"
        ></el-input>
        <el-icon
          @click="resetApiList"
          style="position: relative; right: 22px; top: 3px"
          ><Close
        /></el-icon>
        <el-button
          type="primary"
          @click="searchApiName"
          style="position: relative; left;: 22px"
          >검색</el-button
        >
      </el-form-item>
      <div></div>
    </div>
  </div>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>API그룹 목록</h3>
    </div>
    <div>
      <comn-list
        :tableHeader="tableHeader"
        :tableData="totalApiList"
        :height="300"
        @selectionChange="onSelectionChkbox"
      
      >
        <template v-slot:name="slotProps">
          <el-input v-model="slotProps.row.userID"> </el-input>
        </template>
      </comn-list>
    </div>
  </div>
  <div class="btnSec taR mt10" >
    <el-button type="primary" @click="saveApi">선택</el-button>
    <el-button plain type="primary" @click="cancelPopup">취소</el-button>
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";

import { reactive, ref, defineProps, defineEmits } from "vue";

const props = defineProps({
  totalApiList: {
    type: Array,
    required: true,
  },
});
const emits = defineEmits(["cancelPopup", "selectedApi", "searchApi","resetSearchApi"]);
const state = reactive({
  name: "",
  selectApiList: [],
  indexList: [],
});

const tableHeader = ref([
  {
    type: "selection",
    width: 50,
  },
  {
    prop: "grpName",
    label: "API 그룹명",
    width: 100,
  },
  {
    prop: "pltfrmId",
    label: "플랫폼 아이디",
    width: 100,
  },
  {
    prop: "useYn",
    label: "사용여부",
    width: 100,
  },
  {
    prop: "regrId",
    label: "등록자",
    width: 100,
  },
]);

const onSelectionChkbox = (event) => {
  state.selectApiList = event;
};

const saveApi = () => {
  emits("selectedApi", {
    data: state.selectApiList,
  });
};
const cancelPopup = () => {
  emits("cancelPopup");
};

const searchApiName = () => {
  emits("searchApi", { data: state.name });
};

const resetApiList = () => {
    state.name = "";
    emits("resetSearchApi");
};
</script>
<style lang="scss"></style>
