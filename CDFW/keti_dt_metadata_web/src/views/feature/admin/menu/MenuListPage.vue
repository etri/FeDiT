<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>메뉴 목록</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <MenuList :menuItems="menuItems" @detailMenu="detailMenu" />
        </div>
      </div>
    </div>

    <ul class="btnSec taR mt10">
      <li>
        <el-button
          v-if="isWriteYn(route.meta.auth)"
          type="primary"
          size="large"
          @click="registerMenu"
          >등록</el-button
        >
      </li>
    </ul>
  </div>
</template>
<script setup>
import MenuList from "@/components/admin/menu/MenuList.vue";
import { useStore } from "vuex";
import { onMounted, watch, ref } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  routerPush,
  getCookie,
  isWriteYn,
  isReadYn,
} from "@/assets/js/common.js";

import { getLoginUserId } from "@/assets/js/auth.js";

const store = useStore();
const route = useRoute();

const properties = getGlobalProperties();
const $axios = properties.$axios;
const $apiUrls = properties.$apiUrls;
const menuItems = ref([]);

watch(
  () => route.path,
  (cur, prev) => getMenuList()
);
onMounted(() => getMenuList());

const getMenuList = async () => {
  menuItems.value = [];
  await store.dispatch("CodeStore/getCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      grpIdList: ["CGR00001"],
    },
  });

  const typeCdList = store.getters["CodeStore/getStoreCodeList"]("CGR00001");
  for (const typeCd of typeCdList) {
    if (typeCd.useYn !== "Y") continue;

    const menuList = await store.dispatch("MenuStore/getMenuList", {
      axios: $axios,
      apiUrls: $apiUrls,
      params: {
        searchType: "tree",
        typeCd: typeCd.cdId,
        userId: getLoginUserId(),
        pltfrmId: getCookie("pltfrmId"),
      },
    });

    if (menuList.length > 0) {
      menuItems.value.push({
        menuNm: typeCd.cdNm,
        isCodeMenu: true,
        children: menuList,
      });
    }
  }
};

const detailMenu = (payload) => {
  // 최상위 코드메뉴인 경우에는 상세 화면 전환하지 않음.
  if (payload.isCodeMenu) return;

  if (isReadYn(route.meta.auth)) {
    let platform = getCookie("pltfrmId");
    let query = {
      menuOid: payload.menuOid,
    };
    routerPush(platform, "MenuDetailPage", query);
  } else {
    alert("읽기 권한이 없습니다.");
  }
};

const registerMenu = (event) => {
  event.preventDefault();
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "MenuEditPage", query);
};
</script>
<style lang="scss"></style>
