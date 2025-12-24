<template>
  <div>
    <div class="boxTit">
      <h3>권한 설정(API 목록)</h3>
      <div class="btnSec abs">
        <div class="settings" v-if="curPage == 'modify'">
          <el-button size="small" @click="dialogVisible = true">
            <Plus style="width: 1.3em; height: 2em" />
          </el-button>

          <el-button size="small" @click="removeContact">
            <Minus style="width: 1.3em; height: 2em" />
          </el-button>
        </div>
      </div>
    </div>
    <div class="boxCnt">
      <comn-list
        v-if="curPage === 'modify'"
        :tableHeader="tableHeaderModi"
        :tableData="savedApiList"
        @row-click="rowClick"
        @selectionChange="onSelectionChkbox"
      >
        <template v-slot:name="slotProps">
          <el-input v-model="slotProps.row.userID"> </el-input>
        </template>
      </comn-list>
      <comn-list
        v-if="curPage === 'detail'"
        :tableHeader="tableHeaderDetail"
        :tableData="savedApiList"
        @row-click="rowClick"
      >
      <template v-slot:name="slotProps">
          <el-input v-model="slotProps.row.userID"> </el-input>
        </template>
      </comn-list>
      <div class="btnSec taR">
        <el-button
          v-if="isWriteYn(route.meta.auth) && curPage == 'modify'"
          type="primary"
          @click="saveAuthgroupUser"
          >저장</el-button
        >
      </div>
    </div>
  </div>
  <div>
    <el-dialog title="API그룹 선택" v-model="dialogVisible">
      <AuthgroupTotalApiList
        @cancelPopup="cancelPopup"
        @selectedApi="selectedApi"
        :totalApiList="totalApiList"
        @searchApi="searchApi"
        @resetSearchApi="resetSearchApi"
      />
    </el-dialog>
  </div>
</template>
<script setup>
import AuthgroupTotalApiList from "./AuthgroupTotalApiList.vue";
import ComnList from "@/components/common/ComnList";
import { useRoute } from "vue-router";
import { isWriteYn } from "@/assets/js/common.js";
import { ref, defineProps, defineEmits } from "vue";

const route = useRoute();
const emits = defineEmits([
  "selectedApi",
  "saveApiData",
  "removeSelectedApi",
  "searchApi",
  "resetSearchApi",
]);

const props = defineProps({
  savedApiList: {
    type: Array,
    required: true,
  },
  totalApiList: {
    type: Array,
    required: true,
  },
  curPage: {
    type: String,
    required: false,
  },
});

let dialogVisible = ref(false);
let apiArr = ref([]);

const tableHeaderModi = ref([
  {
    type: "selection",
    width: 50,
  },
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
    prop: "regDt",
    label: "등록일시",
    width: 250,
  },
]);

const tableHeaderDetail = ref([
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
    prop: "regDt",
    label: "등록일시",
    width: 250,
  },
]);

const onSelectionChkbox = (selectionRows) => {
  apiArr.value = selectionRows;
};
const rowClick = () => {};
const removeContact = () => {
  emits("removeSelectedApi", apiArr);
};
const cancelPopup = () => {
  dialogVisible.value = false;
};
const saveAuthgroupUser = () => {
  emits("saveApiData", { data: apiArr.value });
};
const selectedApi = (payload) => {
  emits("selectedApi", payload);
  cancelPopup();
};

const searchApi = (payload) => {
  emits("searchApi", payload);
};

const resetSearchApi = () => {
  emits("resetSearchApi");
};
</script>
<style lang="scss">
// .el-overlay-dialog {
//     overflow: hidden !important;
// }
</style>
