<template>
  <div class="cntSec">
    <AuthgroupSearchForm @searchAuthgroup="searchAuthgroup" />
    <div class="boxLayout">
      <div class="boxTit">
        <h3>권한 목록</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <AuthgroupList
            :authList="state.authList"
            :totalPage="state.pageInfo.totalListSize"
            :curPage="state.pageInfo.curPage"
            @pageMove="pageMove"
            @detailAuth="detailAuth"
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
          @click="registerAuthgroup"
          >등록</el-button
        >
      </li>
    </ul>
  </div>
</template>
<script setup>
import AuthgroupList from "@/components/admin/authgroup/AuthgroupList.vue";
import AuthgroupSearchForm from "@/components/admin/authgroup/AuthgroupSearchForm.vue";

import { onMounted, reactive } from "vue";
import {
  getGlobalProperties,
  getCookie,
  isWriteYn,
  isReadYn,
  routerPush,
} from "@/assets/js/common.js";
import { useRoute } from "vue-router";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const route = useRoute();

const state = reactive({
  authList: [],
  pageInfo: {
    curPage: 1,
    autName: "",
    searchUseYn: "0",
    typeCd: "",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    grpAdminFlag: 0,
  },
});

onMounted(() => {
  getAuthgroupList();
});

const getAuthgroupList = () => {
  $axios
    .get($apiUrls.admin.auth.getAuthList, {
      params: {
        curPage: state.pageInfo.curPage,
        autName: state.pageInfo.autName,
        useYn:
          state.pageInfo.searchUseYn == 0
            ? null
            : state.pageInfo.searchUseYn == 1
            ? "Y"
            : "N",
        typeCd: state.pageInfo.typeCd == "" ? null : state.pageInfo.typeCd,
        pltfrmId: getCookie("pltfrmId"),
      },
    })
    .then((res) => {
      state.authList = res.data.data;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const registerAuthgroup = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "AuthgroupEditPage", query);
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getAuthgroupList();
};

const searchAuthgroup = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.autName = payload.pageInfo.value.autName;
  state.pageInfo.searchUseYn = payload.pageInfo.value.searchUseYn;
  state.pageInfo.typeCd = payload.pageInfo.value.typeCd;
  getAuthgroupList();
};

const detailAuth = (payload) => {
  if (isReadYn(route.meta.auth)) {
    let platform = getCookie("pltfrmId");
    let query = {
      autOid: payload.autOid,
    };
    routerPush(platform, "AuthgroupDetailPage", query);
  } else {
    alert("읽기 권한이 없습니다.");
  }
};
</script>
<style lang="scss"></style>
