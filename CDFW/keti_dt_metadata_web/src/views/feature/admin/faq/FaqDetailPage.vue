<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>FAQ 정보</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <FaqDetail
            :faq="faq"
            :fileList="fileList"
            @downloadFile="downloadFile"
          />
        </div>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button
        v-if="isAmdYn(route.meta.auth)"
        type="primary"
        @click="modifyFaq"
        >수정</el-button
      >
      <el-button plain type="primary" @click="goToList">목록</el-button>
    </div>
  </div>
</template>
<script setup>
import FaqDetail from "@/components/admin/faq/FaqDetail.vue";

import { ref, onMounted } from "vue";
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
const faq = ref({});
const fileList = ref([]);

onMounted(() => {
  let faqOid = route.query.faqOid;
  getFaqDetail(faqOid);
  getAttachedFileList(faqOid);
});

const getFaqDetail = (faqOid) => {
  $axios
    .get(util.format($apiUrls.admin.faq.getFaqDetail, faqOid))
    .then((res) => {
      faq.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAttachedFileList = (faqOid) => {
  $axios
    .get(util.format($apiUrls.admin.faq.getFaqAttachFileList, faqOid))
    .then((res) => {
      fileList.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const modifyFaq = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    faqOid: route.query.faqOid,
  };
  routerPush(platform, "FaqModifyPage", query);
};

const downloadFile = (payload) => {
  commonFileDownload(
    $axios,
    $apiUrls.admin.common.getDownloadFile,
    payload.fileRestoNm,
    payload.fileOriginNm
  );
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "FaqListPage", query);
};
</script>
<style lang="scss"></style>
