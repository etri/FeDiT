<template>
  <div class="cntSec">
    <MetadataRevisionSearchForm @searchMetadataRevisionList="searchMetadataRevisionList" />

    <div class="boxLayout">
      <div class="boxTit">
        <h3>변경 이력</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <MetadataRevisionList :metadataRevisionList="state.metadataRevisionList"
            :totalPage="state.pageInfo.totalListSize" :curPage="state.pageInfo.curPage" @pageMove="pageMove" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>

import MetadataRevisionSearchForm from '@/components/meta/revisions/MetadataRevisionSearchForm.vue';
import MetadataRevisionList from '@/components/meta/revisions/MetadataRevisionList.vue';
import { reactive, onMounted } from 'vue';
import { getGlobalProperties } from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const searchMetadataRevisionList = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.srchStartDd = payload.pageInfo.srchStartDd;
  state.pageInfo.srchEndDd = payload.pageInfo.srchEndDd;
  state.pageInfo.medataSetId = payload.pageInfo.medataSetId;
  getMetadataRevisionList();
};

const state = reactive({
  metadataRevisionList: [],
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    medataSetId: "",
    srchStartDd: "",
    srchEndDd: "",
    pageListSize: 10
  }
});

onMounted(() => {
  initializeTimeRange();
  getMetadataRevisionList();
});

const initializeTimeRange = () => {
  let startDay = new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split("T")[0];
  let endDay = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0];
  state.pageInfo.srchStartDd = startDay;
  state.pageInfo.srchEndDd = endDay;
};

const getMetadataRevisionList = () => {
  $axios
    .get($apiUrls.meta.datastore.influxdb.getJsonMeasurementData, {
      params: {
        isPaging: true,
        curPage: state.pageInfo.curPage,
        srchStartDd: state.pageInfo.srchStartDd,
        srchEndDd: state.pageInfo.srchEndDd,
        medataSetId: state.pageInfo.medataSetId,
        sqlDateFormat: "YYYY-MM-DD",
      },
    })
    .then((res) => {
      if (res.data.list) {
        state.metadataRevisionList = res.data.list.map((item, idx) => {
        idx = idx || 0;
        state.pageInfo.curPage = state.pageInfo.curPage || 1;
        state.pageInfo.pageListSize = state.pageInfo.pageListSize || 10;
        item.rownum = state.pageInfo.pageListSize * (state.pageInfo.curPage - 1) + idx + 1;
        return item;
      });
      state.pageInfo.totalListSize = res.data.page.totalListSize;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getMetadataRevisionList();
};

</script>
<style lang="scss"></style>