<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>메뉴 정보</h3>
      </div>
      <div class="boxCnt">
        <MenuDetail :menu="menu" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button
        v-if="isAmdYn(route.meta.auth)"
        type="primary"
        @click="modifyMenu"
        >수정</el-button
      >
      <el-button plain type="primary" @click="goToList">목록</el-button>
    </div>
  </div>
</template>
<script setup>
import MenuDetail from "@/components/admin/menu/MenuDetail.vue";

import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  isAmdYn,
  routerPush,
  getCookie,
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const menu = ref({});

onMounted(() => {
  getMenuDetail();
});

const getMenuDetail = () => {
  let menuOid = route.query.menuOid;
  $axios
    .get(util.format($apiUrls.menu.getMenuDetail, menuOid))
    .then((res) => {
      menu.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "MenuListPage", query);
};

const modifyMenu = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    menuOid: route.query.menuOid,
  };
  routerPush(platform, "MenuModifyPage", query);
};
</script>
<style lang="scss">
.btn {
  float: right;
}
</style>
