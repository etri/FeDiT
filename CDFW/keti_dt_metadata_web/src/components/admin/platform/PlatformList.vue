<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>Platform 목록</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <ComnList
            :tableHeader="tableHeader"
            :tableData="state.platformList"
            @row-click="rowClick"
          ></ComnList>
          <ComnPagination :curPage="state.pageInfo.curPage" :totalPage="state.pageInfo.totalListSize" @pagemove="pageMove" />
        </div>
      </div>
    </div>
    <!--
      <ul class="btnSec taR mt10">
        <li>
          <el-button type="primary" size="large" @click="edlitClick"
            >등록</el-button
          >
        </li>
      </ul>
    -->
  </div>
  
  <ComnDialog v-model="dialogVisibleEdit"
      :title="dialogEditTitle"
      :attr_draggable="true"
      :attr_showClose="true"
      :attr_closeOnClickModal="false"
      :attr_closeOnPressEscape="false"
      :attr_destoryOnClose="true"
  >
    <template #content>
      <div class="boxLayout">
        <div class="boxTit">
          <h3>Platform 정보</h3>
        </div>
        <div class="boxCnt">
          <PlatformEdit 
            :pltfrmId="platformId"
            @cancelDialog="cancelDialog"
            @goToList="getPlatformList"
          />
        </div>
      </div>
    </template>
  </ComnDialog>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnDialog from "@/components/common/ComnDialog";
import ComnPagination from "@/components/common/ComnPagination.vue";
import { ref, defineProps, defineEmits, onMounted, reactive } from "vue";
import { getGlobalProperties, getCookie, routerPush, nowTimestamp } from "@/assets/js/common.js";

import PlatformEdit from "@/components/admin/platform/PlatformEdit.vue";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const props = defineProps({
});

const dialogVisibleEdit = ref(false);
const dialogKeyByEdit = ref('');
const dialogEditTitle = "Platform 등록/수정";

const state = reactive({
  platformList: [],
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    fromDate: "",
    toDate: "",
  },
});

const tableHeader = ref([
  {
    prop: "pltfrmId",
    label: "플랫폼 ID",
    width: 120,
  },
  {
    prop: "pltfrmNm",
    label: "플랫폼 명",
    width: 236,
  }, 
  {
    prop: "useYn",
    label: "사용여부",
    width: 100,
  },
  {
    prop: "mainYn",
    label: "메인화면여부",
    width: 100,
  },
  /*
  {
    prop: "regDt",
    label: "등록 일시",
    width: 160,
  },   
  {
    prop: "amdDt",
    label: "수정 일시",
    width: 160,
  },
  */ 
]);

onMounted(() => {
  getPlatformList();
});

const getPlatformList = () => {
  $axios
    .get($apiUrls.platform.getPlatformPaging, {
      params: {},
    })
    .then((res) => {
      state.platformList = res.data.data;
      state.pageInfo.curPage = res.data.page.curPage;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};


let platformId = "";
let editCheck = false;

const edlitClick = () => {
  platformId = null;
  editCheck = true;
  editVisibleUpdate();
}

const editVisibleUpdate = () => {
  dialogKeyByEdit.value = nowTimestamp();
  dialogVisibleEdit.value = true;
};

// rowClick 시 수정
const rowClick = (data) => {
  editCheck = false;
  if(! editCheck){
    platformId = data.pltfrmId;
  }
  editVisibleUpdate();
};

const cancelDialog = () => {
  dialogVisibleEdit.value = false;
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getPlatformList();
};
</script>
<style lang="scss"></style>
