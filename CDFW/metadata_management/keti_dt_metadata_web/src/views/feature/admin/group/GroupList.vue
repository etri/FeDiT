<template>
  <div class="cntSec">
    <GroupSearchForm @searchGroup="searchGroup" />
    <div class="boxLayout">
      <div class="boxTit">
        <h3>그룹 목록</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <GroupList
            :groupList="state.groupList"
            :totalPage="state.pageInfo.totalListSize"
            :curPage="state.pageInfo.curPage"
            @pageMove="pageMove"
            @groupDetail="groupDetail"
          />
        </div>
      </div>
    </div>
    <ul class="btnSec taR mt10">
      <li>
        <el-button type="primary" size="large" @click="editGroup">등록</el-button>
      </li>
    </ul>
  </div>
</template>
<script setup>
import GroupList from "@/components/admin/group/GroupList.vue";
import GroupSearchForm from "@/components/admin/group/GroupSearchForm.vue";

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
  groupList: [],
  pageInfo: {
    curPage: 1,
    grpNm: "",
    typeCd: "",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    fromDate: "",
    toDate: "",
  },
});

onMounted(() => {
  getGroupList();
});

const getGroupList = () => {
  $axios
    .get($apiUrls.common.group.getGroupList, {
      params: {
        curPage: state.pageInfo.curPage,
        grpNm : state.pageInfo.grpNm,
        searchRegSt: state.pageInfo.fromDate,
        searchRegEd: state.pageInfo.toDate,
      },
    })
    .then((res) => {
      state.groupList = res.data.data;
      state.pageInfo.curPage = res.data.page.curPage;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const editGroup = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "GroupEdit", query);
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getGroupList();
};

const searchGroup = (payload) => {
  state.pageInfo.grpNm =
    payload.grpNm == "" ? "" : payload.grpNm;
  getGroupList();
};

const groupDetail = (payload) => {
  let platform = getCookie("pltfrmId");
  let query = {
    grpId: payload.grpId,
  };
  routerPush(platform, "GroupEdit", query);
};
</script>
<style lang="scss"></style>
