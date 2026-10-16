<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>API그룹 등록</h3>
      </div>
      <div class="boxCnt">
        <ApigroupEdit ref="editApi" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditApigroup">저장</el-button>
      <el-button plain type="primary" @click="goToList">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import ApigroupEdit from "@/components/admin/api/ApigroupEdit.vue";

import { ref } from "vue";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const editApi = ref(null);

const EditApigroup = async () => {
  let ruleForm = editApi.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let api = editApi.value.api;

      let apiGroupInfo = {
        ...api,
        useYn: api.useYn == true ? "Y" : "N",
        pltfrmId: getCookie("pltfrmId"),
      };

      $axios
        .post($apiUrls.admin.api.setApigroupDetail, apiGroupInfo)
        .then(() => {
          alert("저장이 완료되었습니다.");
          let platform = getCookie("pltfrmId");
          let query = null;
          routerPush(platform, "ApigroupListPage", query);
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
  routerPush(platform, "ApigroupListPage", query);
};
</script>
<style lang="scss"></style>
