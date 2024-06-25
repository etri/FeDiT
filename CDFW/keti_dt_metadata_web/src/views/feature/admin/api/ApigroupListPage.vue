<template>
  <div class="cntSec">
    <ApigroupSearchForm @searchApigroup="searchApigroup" />
    <div class="boxLayout">
      <div class="boxTit">
        <h3>API그룹 목록</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <ApigroupList
            :apiList="state.apiList"
            :totalPage="state.pageInfo.totalListSize"
            :curPage="state.pageInfo.curPage"
            @pageMove="pageMove"
            @detailApi="detailApi"
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
          @click="registerApigroup"
          >등록</el-button
        >
      </li>
    </ul>
  </div>
</template>
<script setup>
import ApigroupSearchForm from "@/components/admin/api/ApigroupSearchForm.vue";
import ApigroupList from "@/components/admin/api/ApigroupList.vue";

import { onMounted, reactive } from "vue";
import {
  getGlobalProperties,
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
  apiList: [],
  pageInfo: {
    curPage: 1,
    pltfrmId: "",
    grpName: "",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    actTF: -1,
    grpAdminFlag: 0,
    searchUseYn: "0",
  },
});

onMounted(() => {
  getApigroupList();
});

const getApigroupList = () => {
  $axios
    .get($apiUrls.admin.api.getApigroupListPaging, {
      params: {
        curPage: state.pageInfo.curPage,
        pltfrmId : state.pageInfo.pltfrmId,
        grpName : state.pageInfo.grpName,
        useYn:
          state.pageInfo.searchUseYn == 0
            ? null
            : state.pageInfo.searchUseYn == 1
            ? "Y"
            : "N",
        pltfrmId: getCookie("pltfrmId"),
      },
    })
    .then((res) => {
      state.apiList = res.data.data;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const registerApigroup = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "ApigroupEditPage", query);
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getApigroupList();
};

const searchApigroup = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.pltfrmId =
    payload.pltfrmId == "" ? "" : payload.pageInfo.value.pltfrmId;
  state.pageInfo.grpName =
    payload.grpName == "" ? "" : payload.pageInfo.value.grpName;
  state.pageInfo.searchUseYn = payload.pageInfo.value.searchUseYn;
  getApigroupList();
};

const detailApi = (payload) => {
  if (isReadYn(route.meta.auth)) {
    let platform = getCookie("pltfrmId");
    let query = { grpOid: payload.grpOid };
    routerPush(platform, "ApigroupDetailPage", query);
  } else {
    alert("읽기 권한이 없습니다.");
  }
};
</script>
<style lang="scss"></style>
