<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>코드그룹 등록</h3>
      </div>
      <div class="boxCnt">
        <CodegroupEdit ref="editCode" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditCodegroup">저장</el-button>
      <el-button plain type="primary" @click="goToList">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import CodegroupEdit from "@/components/admin/code/CodegroupEdit.vue";

import { ref } from "vue";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const editCode = ref(null);

const EditCodegroup = async () => {
  let ruleForm = editCode.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let code = editCode.value.code;

      let codeGroupInfo = {
        ...code,
        useYn: code.useYn == true ? "Y" : "N",
        pltfrmId: getCookie("pltfrmId"),
        upCdGrpId: 0,
      };

      $axios
        .post($apiUrls.admin.code.setCodegroup, codeGroupInfo)
        .then(() => {
          alert("저장이 완료되었습니다.");
          let platform = getCookie("pltfrmId");
          let query = null;
          routerPush(platform, "CodegroupListPage", query);
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
  routerPush(platform, "CodegroupListPage", query);
};
</script>
<style lang="scss"></style>
