<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>메뉴 수정</h3>
      </div>
      <div class="boxCnt">
        <MenuModify ref="modify" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="modifyMenu">저장</el-button>
      <el-button
        v-if="isDelYn(route.meta.auth)"
        type="primary"
        text
        bg
        @click="deleteMenu"
        >삭제</el-button
      >
      <el-button plain type="primary" @click="goToDetail">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import MenuModify from "@/components/admin/menu/MenuModify.vue";

import { ref } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  getCookie,
  isDelYn,
  routerPush,
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const modify = ref(null);

const modifyMenu = async () => {
  let ruleForm = modify.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let result = confirm("수정 하시겠습니까?");
      if (result) {
        let menuDetail = modify.value.data.menuDetail;
        let menuOid = route.query.menuOid;

        let menuInfo = {
          ...menuDetail,
          admrYn: menuDetail.admrYn == true ? "Y" : "N",
          useYn: menuDetail.useYn == true ? "Y" : "N",
          pltfrmId: getCookie("pltfrmId"),
        };

        $axios
          .put(util.format($apiUrls.menu.modifyMenuDetail, menuOid), menuInfo)
          .then(() => {
            alert("수정이 완료되었습니다.");
            let platform = getCookie("pltfrmId");
            let query = {
              menuOid: route.query.menuOid,
            };
            routerPush(platform, "MenuDetailPage", query);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

const deleteMenu = () => {
  let result = confirm("삭제 하시겠습니까?");
  if (result) {
    let menuOid = route.query.menuOid;

    $axios
      .delete(util.format($apiUrls.menu.deleteMenuDetail, menuOid))
      .then(() => {
        alert("삭제가 완료되었습니다.");
        let platform = getCookie("pltfrmId");
        let query = null;
        routerPush(platform, "MenuListPage", query);
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

const goToDetail = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    menuOid: route.query.menuOid,
  };
  routerPush(platform, "MenuDetailPage", query);
};
</script>
<style lang="scss"></style>
