<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>코드그룹 수정</h3>
      </div>
      <div class="boxCnt">
        <CodegroupModify
          @modifyCodegroup="modifyCodegroup"
          @deleteCodegroup="deleteCodegroup"
        />
      </div>
    </div>

    <div class="boxLayout">
      <div class="boxTit">
        <h3>코드 정보</h3>
      </div>
      <div class="boxCnt">
        <CodeInfoList :curPage="curPage" :curTitle="curTitle" />
      </div>
    </div>
  </div>
</template>
<script setup>
import CodegroupModify from "@/components/admin/code/CodegroupModify.vue";
import CodeInfoList from "@/components/admin/code/CodeInfoList.vue";

import { ref } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const curPage = ref("modify");
const curTitle = ref("코드 수정");
const modifyCodegroup = async (payload) => {
  let ruleForm = payload.ruleFormRef.value;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let result = confirm("수정 하시겠습니까?");
      if (result) {
        let grpId = route.query.grpId;
        let code = payload.data;

        let codeInfo = {
          ...code,
          grpId: grpId,
          useYn: code.useYn == true ? "Y" : "N",
        };

        $axios
          .put(
            util.format($apiUrls.admin.code.modifyCodegroupDetail, grpId),
            codeInfo
          )
          .then(() => {
            alert("수정이 완료되었습니다.");

            // let platform = getCookie("pltfrmId");
            // let query = {
            //   grpId: grpId,
            // };
            // routerPush(platform, "CodegroupDetailPage", query);
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

const deleteCodegroup = async () => {
  let result = confirm("전체 데이터가 삭제 됩니다. 삭제 하시겠습니까?");
  if (result) {
    let grpId = route.query.grpId;
    $axios
      .delete(util.format($apiUrls.admin.code.deleteCodeAllData, grpId))
      .then(() => {
        alert("삭제가 완료되었습니다.");
        let platform = getCookie("pltfrmId");
        let query = null;
        routerPush(platform, "CodegroupListPage", query);
      })
      .catch((err) => {
        console.log(err);
      });
  }
};
</script>
<style lang="scss"></style>
