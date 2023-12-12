<template>
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>권한 검색</h3>
      </div>
      <div class="boxCnt">
        <el-form label-position="left"
          :model="searchInfo"
          :inline="true"
          class="demo-form-inline"
          label-width="120px"
        >
          <el-form-item label="권한명">
            <el-row :gutter="20">
              <el-col :span="18">
                <el-input class=""
                  v-model="searchInfo.autName"
                  placeholder="검색어를 입력하세요."
                  @keydown.enter.prevent="getAuthGroupList()" />
              </el-col>
              <el-col :span="6">
                <div class="btnSec taL">
                  <el-button type="primary" @click="getAuthGroupList()">검색</el-button>
                </div>
              </el-col>
            </el-row>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="boxLayout">
      <div class="boxTit">
        <h3>권한 목록</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <div>
            <ComnList
              :tableHeader="tableHeader"
              :tableData="authList"
              @selectionChange="selectCheckbox"
              :min-height="240"
            >
            </ComnList>
          </div>
        </div>
      </div>
    </div>
    <div class="btnSec taR">
      <el-button type="default" @click="closeDialogAuth()">취소</el-button>
      <el-button type="primary" @click="addAuth()">선택</el-button>
    </div>
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import { ref, reactive, onMounted, computed, watch, defineProps } from "vue";
import {
  getGlobalProperties,
  routerPush,
  getCookie,
  isWriteYn,
  isAmdYn,
  isDelYn,
  isReadYn,
} from "@/assets/js/common.js";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";

const route = useRoute();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const searchInfo = ref({
  autName: "",
});

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

const emits = defineEmits([
  "pageMove",
  "searchAuthgroup",
  "selectCheckbox",
  "getAuthGroupList",
  "addAuth",
  "closeDialog"
]);

const tableHeader = ref([
  // 권한 목록
  {
    prop: "deleteCheckBox",
    type: "selection",
    width: 40,
    align: "center",
  },
  {
    prop: "rownum",
    label: "번호",
    width: 50,
  },
  {
    prop: "autName",
    label: "권한명",
    width: 250,
  },
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const selectCheckbox = (data) => {
  emits("selectCheckbox", data);
};

const getAuthGroupList = () => {
  emits("searchAuthgroup", searchInfo.value);
};

const addAuth = (data) => {
  emits("addAuth", data);
};

const closeDialogAuth = () => {
  emits("closeDialogAuth");
}

</script>
