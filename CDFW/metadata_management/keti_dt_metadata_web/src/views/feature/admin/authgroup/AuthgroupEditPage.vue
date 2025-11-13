<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>권한 등록</h3>
      </div>
      <div class="boxCnt">
        <AuthgroupEdit ref="editAuth" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditAuthgroup">저장</el-button>
      <el-button plain type="primary" @click="goToList">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import AuthgroupEdit from "@/components/admin/authgroup/AuthgroupEdit.vue";

import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import { ref } from "vue";

const editAuth = ref(null);
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const EditAuthgroup = async () => {
  let ruleForm = editAuth.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let authgroup = editAuth.value.auth;
      let authInfo = {
        autName: authgroup.autName,
        autDesc: authgroup.autDesc,
        typeCd: authgroup.typeCd == true ? "COD_00001" : "COD_00002",
        useYn: authgroup.useYn == true ? "Y" : "N",
        pltfrmId: getCookie("pltfrmId"),
      };

      $axios
        .post($apiUrls.admin.auth.setAuthDetail, authInfo)
        .then(() => {
          alert("저장이 완료되었습니다.");

          let platform = getCookie("pltfrmId");
          let query = null;
          routerPush(platform, "AuthgroupListPage", query);
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

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "AuthgroupListPage", query);
};
</script>
<style lang="scss"></style>
