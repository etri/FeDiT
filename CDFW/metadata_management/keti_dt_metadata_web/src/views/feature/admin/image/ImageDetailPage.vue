<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>이미지 상세</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <ImageDetail
            :image="image"
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
        @click="modifyImage"
        >수정</el-button
      >
      <el-button plain type="primary" @click="goToList">목록</el-button>
    </div>
  </div>
</template>
<script setup>
import ImageDetail from "@/components/admin/image/ImageDetail.vue";

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
const image = ref({});
const fileList = ref([]);

onMounted(() => {
  let imgOid = route.query.imgOid;
  getImageDetail(imgOid);
  getAttachedFileList(imgOid);
});

const getImageDetail = (imgOid) => {
  $axios
    .get(util.format($apiUrls.admin.image.getImageDetail, imgOid))
    .then((res) => {
      image.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAttachedFileList = (imgOid) => {
  $axios
    .get(util.format($apiUrls.admin.image.getImageAttachFileList, imgOid))
    .then((res) => {
      fileList.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const modifyImage = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    imgOid: route.query.imgOid,
  };
  routerPush(platform, "ImageModifyPage", query);
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
  routerPush(platform, "ImageListPage", query);
};
</script>
<style lang="scss"></style>
