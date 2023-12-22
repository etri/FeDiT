<template>
  <div>
    <div class="cntSec">
      <div class="boxLayout">
        <div class="boxTit">
          <h3>이미지 목록</h3>
        </div>
        <div class="boxCnt">
          <div style="overflow-x: hidden; overflow-y: auto">
            <ImageList
              :imgList="state.imgList"
              :totalPage="state.pageInfo.totalListSize"
              :curPage="state.pageInfo.curPage"
              @pageMove="pageMove"
              @imgDetail="imgDetail"
            />
          </div>
        </div>
      </div>
      <ul class="btnSec taR mt10">
        <li>
          <el-button
            v-if="isWriteYn(route.meta.auth)"
            type="primary"
            size="large"
            @click="registerImage"
            >등록</el-button
          >
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import ImageList from "@/components/admin/image/ImageList.vue";

import { onMounted, reactive } from "vue";
import {
  getGlobalProperties,
  previewFile,
  isWriteYn,
  isReadYn,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import { useRoute } from "vue-router";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const route = useRoute();

const state = reactive({
  imgList: [],
  pageInfo: {
    curPage: 1,
    fromDate: "",
    toDate: "",
    searchWord: "",
    searchType: "0",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
  },
});

onMounted(() => {
  getImageList();
});

const getImageList = () => {
  $axios
    .get($apiUrls.admin.image.getImageListPaging, {
      params: {
        curPage: state.pageInfo.curPage,
        pltfrmId: getCookie("pltfrmId"),
      },
    })
    .then((res) => {
      state.imgList = res.data.data;
      state.imgList.forEach(async (data) => {
        data.imgSrc = await previewFile(
          $axios,
          $apiUrls.admin.common.getDownloadFile,
          data.fileRestoNm,
          data.fileOriginNm
        );
      });
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const registerImage = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "ImageEditPage", query);
};

const imgDetail = (payload) => {
  if (isReadYn(route.meta.auth)) {
    let platform = getCookie("pltfrmId");
    let query = { imgOid: payload.imgOid };
    routerPush(platform, "ImageDetailPage", query);
  } else {
    alert("읽기 권한이 없습니다.");
  }
};
const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getImageList();
};
</script>
<style lang="scss"></style>
