<template>
  <div>
    <div class="cntSec">
      <div class="boxLayout">
        <div class="boxTit">
          <h3>코드그룹 검색</h3>
        </div>
        <div class="boxCnt">
          <CodeSearchForm @searchCodegroup="searchCodegroup" />
        </div>
      </div>
      <div class="boxLayout">
        <div class="boxTit">
          <h3>코드그룹 목록</h3>
        </div>
        <div class="boxCnt">
          <div style="overflow-x: hidden; overflow-y: auto">
            <CodegroupList
              :codeList="state.codeList"
              :totalPage="state.pageInfo.totalListSize"
              :curPage="state.pageInfo.curPage"
              @pageMove="pageMove"
              @detailCode="detailCode"
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
            @click="registerCodegroup"
            >등록</el-button
          >
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import CodegroupList from "@/components/admin/code/CodegroupList.vue";
import CodeSearchForm from "@/components/admin/code/CodeSearchForm.vue";

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
  codeList: [],
  pageInfo: {
    curPage: 1,
    fromDate: "",
    toDate: "",
    searchWord: "",
    searchType: "0",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    actTF: -1,
    grpAdminFlag: 0,
  },
});

onMounted(() => {
  getCodegroupList();
});

const getCodegroupList = () => {
  $axios
    .get($apiUrls.admin.code.getCodegroupList, {
      params: {
        curPage: state.pageInfo.curPage,
        grpNm:
          state.pageInfo.searchType == 1 ? state.pageInfo.searchWord : null,
        grpVal:
          state.pageInfo.searchType == 2 ? state.pageInfo.searchWord : null,
        searchWord:
          state.pageInfo.searchType == 0 ? state.pageInfo.searchWord : null,
        pltfrmId: getCookie("pltfrmId"),
      },
    })
    .then((res) => {
      state.codeList = res.data.data;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const registerCodegroup = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "CodegroupEditPage", query);
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getCodegroupList();
};

const searchCodegroup = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.searchType = payload.searchType;
  state.pageInfo.searchWord = payload.searchWord;
  getCodegroupList();
};

const detailCode = (payload) => {
  if (isReadYn(route.meta.auth)) {
    let platform = getCookie("pltfrmId");
    let query = {
      grpId: payload.grpId,
    };
    routerPush(platform, "CodegroupDetailPage", query);
  } else {
    alert("읽기 권한이 없습니다.");
  }
};
</script>
<style lang="scss"></style>
