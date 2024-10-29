<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>메뉴 등록</h3>
      </div>
      <div class="boxCnt">
        <MenuEdit
          ref="menuEdit"
          :targetCodeList="targetCodeList"
          :menuItems="menuItems"
          :typeCdList="typeCdList"
          @checkTgMenu="checkTgMenu"
        />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditMenu">저장</el-button>
      <el-button plain type="primary" @click="goToList">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import MenuEdit from "@/components/admin/menu/MenuEdit.vue";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import { getLoginUserId } from "@/assets/js/auth.js";
import { useStore } from "vuex";
import { computed, onMounted, ref } from "vue";

const store = useStore();
const menuEdit = ref(null);

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

onMounted(() => {
  getCodeList();
});
const menuItems = ref([]);
const getCodeList = () =>
  store.dispatch("CodeStore/getCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      grpIdList: ["CGR00055", "CGR00001"],
    },
  });

const targetCodeList = computed(() =>
  store.getters["CodeStore/getStoreCodeList"]("CGR00055")
);
const typeCdList = computed(() =>
  store.getters["CodeStore/getStoreCodeList"]("CGR00001")
);

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "MenuListPage", query);
};

const EditMenu = async () => {
  let ruleForm = menuEdit.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let menu = menuEdit.value.menu;

      let menuInfo = {
        ...menu,
        upMenuOid: menu.isRootMenu == true ? "0" : menu.upMenuOid,
        admrYn: menu.admrYn == true ? "Y" : null,
        useYn: menu.useYn == true ? "Y" : null,
        pltfrmId: getCookie("pltfrmId"),
      };
      $axios
        .post($apiUrls.menu.setMenuDetail, menuInfo)
        .then(() => {
          alert("저장이 완료되었습니다.");
          let platform = getCookie("pltfrmId");
          let query = null;
          routerPush(platform, "MenuListPage", query);
        })
        .catch((err) => {
          console.log(err);
          alert("저장이 실패하였습니다.");
        });
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

const checkTgMenu = async (payload) => {
  let menu = await store.dispatch("MenuStore/getMenuList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      searchType: "tree",
      typeCd: payload,
      userId: getLoginUserId(),
      pltfrmId: getCookie("pltfrmId"),
    },
  });

  let defaultData = {
    menuNm: "--선택--",
    menuOid: 0,
    typeCd: payload,
  };
  menu.unshift(defaultData);
  menuItems.value = menu;
};
</script>
<style lang="scss"></style>
