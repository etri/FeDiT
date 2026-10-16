<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>공지사항 정보</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <OpernoticeDetail
            :notice="state.notice"
            :fileList="state.fileList"
            @downloadFile="downloadFile"
          />
        </div>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button
        v-if="isAmdYn(route.meta.auth)"
        type="primary"
        @click="modifyOper"
        >수정</el-button
      >
      <el-button plain type="primary" @click="goToList">목록</el-button>
    </div>
  </div>
</template>
<script setup>
import OpernoticeDetail from "@/components/admin/opernotice/OpernoticeDetail.vue";
import { onMounted, reactive } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  commonFileDownload,
  isAmdYn,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";

import util from "util";
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const route = useRoute();

const state = reactive({
  notice: {},
  fileList: [],
});

onMounted(() => {
  getOpernoticeDetail();
  getAttachedFileList();
});

const getOpernoticeDetail = () => {
  let ntfOid = route.query.ntfOid;
  $axios
    .get(util.format($apiUrls.admin.notices.getNoticeDetail, ntfOid))
    .then((res) => {
      state.notice = res.data;
      res.data.admPrsnNtfYn == "Y"
        ? (state.notice.typeNtcTF = "1")
        : (state.notice.typeNtcTF = "2");
      state.notice.ntcOperTF = "1";
      state.notice.clsButtIndcYn == "Y"
        ? (state.notice.clsButtIndc = true)
        : (state.notice.clsButtIndc = false);
      state.notice.todayPopupIndcYn == "Y"
        ? (state.notice.todayPopupIndc = true)
        : (state.notice.todayPopupIndc = false);
      state.notice.prevNtfYn == "Y"
        ? (state.notice.prevNtf = true)
        : (state.notice.prevNtf = false);
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAttachedFileList = () => {
  let ntfOid = route.query.ntfOid;
  $axios
    .get(util.format($apiUrls.admin.notices.getNoticeAttachFiles, ntfOid))
    .then((res) => {
      state.fileList = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const modifyOper = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    ntfOid: route.query.ntfOid,
  };
  routerPush(platform, "OpernoticeModifyPage", query);
};
const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "OpernoticeListPage", query);
};

const downloadFile = (payload) => {
  commonFileDownload(
    $axios,
    $apiUrls.admin.common.getDownloadFile,
    payload.fileRestoNm,
    payload.fileOriginNm
  );
};
</script>
<style lang="scss"></style>
