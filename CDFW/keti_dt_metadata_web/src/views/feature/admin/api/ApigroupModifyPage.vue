<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>API그룹 수정</h3>
      </div>
      <div class="boxCnt">
        <ApigroupModify
          @modifyApigroup="modifyApigroup"
          @deleteApigroup="deleteApigroup"
        />
      </div>
    </div>

    <div class="boxLayout">
      <div class="boxTit">
        <h3>API 정보</h3>
      </div>
      <div class="boxCnt">
        <ApiList :curPage="curPage" :curTitle="curTitle" />
      </div>
    </div>
  </div>
</template>
<script setup>
import ApigroupModify from "@/components/admin/api/ApigroupModify.vue";
import ApiList from "@/components/admin/api/ApiList.vue";

import { ref } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import util from "util";
import { getLoginUserId } from "@/assets/js/auth.js";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const curPage = ref("modify");
const curTitle = ref("API 수정");

const modifyApigroup = async (payload) => {
  let ruleForm = payload.ruleFormRef.value;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let result = confirm("수정 하시겠습니까?");
      if (result) {
        let grpOid = route.query.grpOid;
        let api = payload.data;
        let apiInfo = {
          ...api,
          grpOid: grpOid,
          amdr: getLoginUserId(),
          useYn: api.useYn == true ? "Y" : "N",
        };

        $axios
          .put(
            util.format($apiUrls.admin.api.modifyApigroupDetail, grpOid),
            apiInfo
          )
          .then(() => {
            alert("수정이 완료되었습니다.");
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

const deleteApigroup = async () => {
  let result = confirm("전체 데이터가 삭제 됩니다. 삭제 하시겠습니까?");
  if (result) {
    let grpOid = route.query.grpOid;

    $axios
      .delete(util.format($apiUrls.admin.api.deleteApigroupDetail, grpOid))
      .then(() => {
        alert("삭제가 완료되었습니다.");

        let platform = getCookie("pltfrmId");
        let query = null;
        routerPush(platform, "ApigroupListPage", query);
      })
      .catch((err) => {
        alert("삭제가 실패되었습니다.");
        console.log(err);
      });
  }
};
</script>
<style lang="scss"></style>
