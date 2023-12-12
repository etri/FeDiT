<template>
  <div class="cntSec">
    <CollectionWorkSearchForm
       @searchWork="searchWork" />
    <div class="boxLayout">
      <div class="boxTit">
        <h3>수집 작업 목록</h3>
      </div>
      <div class="boxCnt">
        <ComnList 
        :tableHeader="tableHeader" 
        :tableData="state.workList"
        >
          <template v-slot:rootMedataSetId="slotData">
            <span @click="metaCommon.Buttons.metadataResourcePage.click(slotData.row.rootMedataSetId)" class="link-text">
              {{ slotData.row.rootMedataSetId }}
            </span>
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
</template>
<script setup>
import CollectionWorkSearchForm from "@/components/meta/collection/CollectionWorkSearchForm.vue";
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
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";
import dayjs from "dayjs";
import { trim } from "@amcharts/amcharts4/.internal/core/utils/Utils";
import metaCommon from "@/assets/js/metaCommon.js";

const route = useRoute();
const router = useRouter();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);

const state = reactive({
  workList: [],
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  },
  searchInfo: {
    colecWrkId: "",
    colecLogId: "",
    colecWrkSttusMtcd: "",
    cretMedataSetId: "",
    colecWrkMsg : "",
    srchStartDd: "",
    srchEndDd: "",
  }
});

const tableHeader = ref([
  {
    prop: "colecWrkId",
    label: "수집 작업 ID",
    width: 200,
  },
  {
    prop: "colecWrkSttusMtcdNm",
    label: "수집 작업 상태",
    width: 50,
  },  
  {
    prop: "colecLogId",
    label: "수집 로그 ID",
    width: 150,
  },
  {
    prop: "rootMedataSetId",
    label: "루트 메타데이터셋 ID",
    width: 150,
    columnType: "custom",
  },
  {
    prop: "cretMedataSetIdList",
    label: "생성 메타데이터셋 ID 목록",
    width: 150,
  },
  {
    prop: "colecWrkMsg",
    label: "수집 작업 메시지",
    width: 250,
  },
  {
    prop: "colecWrkRegDt",
    label: "수집 작업 등록 일시",
    width: 150,
  },
]);
const goToDetail = () => {
  // TODO 상세 페이지 이동
}

const getWorkList = () => {
  let param = Object.assign({}, state.pageInfo, state.searchInfo);
  $axios
    .get($apiUrls.meta.collection.getWorkList, {
        params: param
      }
    )
    .then((res) => {
      state.workList = res.data.list;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    })
}

const searchWork = (payload) => {
  state.pageInfo = {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  };
  state.searchInfo = payload;
  getWorkList();
};

const getCodeList = () =>
  store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00024"],
    },
  });

const mtcdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00024")
);

onMounted(() => {
	getCodeList();
  getWorkList();
})

const pagemove = (payload) => {
  state.pageInfo.curPage = payload;
  getWorkList();
};

</script>
<style lang="scss"></style>