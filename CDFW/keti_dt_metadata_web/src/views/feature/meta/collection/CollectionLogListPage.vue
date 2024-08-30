<template>
  <div class="cntSec">
    <CollectionLogSearchForm @searchLog="searchLog" />
    <div class="boxLayout">
      <div class="boxTit">
        <h3>수집 로그 목록</h3>
      </div>
      <div class="boxCnt">
        <ComnList 
          :tableHeader="tableHeader" 
          :tableData="state.logList">
          <template v-slot:btnMappingInfo="slotData">
            <el-button size="small" @click="handleClickInfo(slotData.$index)">매핑 정보</el-button>
          </template>
        </ComnList>
        <ComnPagination 
          :curPage="state.pageInfo.curPage" 
          :totalPage="state.pageInfo.totalListSize"
          @pagemove="pagemove"
          />
      </div>
    </div>
  </div>
  <el-dialog v-model="dialogLogMappingInfo" title="수집 로그 매핑 정보">
      <div class="dialog-area">
        <div class="boxLayout">
            <div class="boxTit"><h3>수집 로그 매핑 정보</h3></div>
            <div class="boxCnt">
              <JsonEditorVue class="dialog_jsonEditor_setting" v-model="selectedMappingInfo" v-bind="{
                readOnly: true,
                mode: 'text',
                theme: 'light',
                mainMenuBar: false,
                navigationBar: false,
                parser: undefined,
              }" />
            </div>
          </div>
      </div>
  </el-dialog>
</template>
<script setup>
import CollectionLogSearchForm from "@/components/meta/collection/CollectionLogSearchForm.vue";
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
  isWriteYn,
  isAmdYn,
  isDelYn,
} from "@/assets/js/common.js";
import { ref, reactive, onMounted, computed, watch , defineEmits} from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";

const route = useRoute();
const router = useRouter();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const ruleFormRef = ref(null);
const dialogLogMappingInfo = ref(false);

const state = reactive({
  logList: [],
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  },
  searchInfo: {
    colecLogId: "",
    colecLogData: "",
    srchStartDd: "",
    srchEndDd: "",
  }
});

const tableHeader = [
  {
    prop: "colecLogId",
    label: "수집 로그 ID",
    width: 150,
  },
  {
    prop: "colecLogRegrId",
    label: "수집 로그 등록자 ID",
    width: 100,
  },
  {
    prop: "colecLogRegrNm",
    label: "수집 로그 등록자 명",
    width: 100,
  },
  {
    prop: "colecLogRegDt",
    label: "등록일시",
    width: 100,
  },
  /** {
    prop: "colecLogData",
    label: "수집 로그 데이터",
    width: 150,
  },  */
  {
    prop: "btnMappingInfo",
    label: "수집 로그 매핑 정보",
    width: 50,
    columnType: "custom",
  },
]

const goToDetail = () => {
  // TODO 상세 페이지 이동
}

const getLogList = () => {
  let param = Object.assign({}, state.pageInfo, state.searchInfo);
  $axios
    .get($apiUrls.meta.collection.getLogList, {
        params: param
      }
    )
    .then((res) => {
      state.logList = res.data.list;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    })
}

const searchLog = (payload) => {
  state.pageInfo = {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  };
  state.searchInfo = payload;
  getLogList();
};

onMounted(() => {
  getLogList();
})

const selectedMappingInfo = ref("");

const pagemove = (payload) => {
  state.pageInfo.curPage = payload;
  getLogList();
};

const handleClickInfo = (index) =>{
  if(state.logList[index].colecMappingStr == "" || state.logList[index].colecMappingStr == null){
    selectedMappingInfo.value = "데이터 없음";
    dialogLogMappingInfo.value = true;
    return;
  }
  selectedMappingInfo.value = JSON.parse(state.logList[index].colecMappingStr);
  dialogLogMappingInfo.value = true;
}

</script>