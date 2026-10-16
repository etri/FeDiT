<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>PAT(Personal Access Token) 등록</h3>
      </div>
      <div class="boxCnt">
        <PatEdit ref="editForm" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditPatDetail">저장</el-button>
      <el-button type="primary" plain @click="goToList">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import PatEdit from "@/components/meta/pat/PatEdit.vue";
import { ref } from "vue";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import { useStore } from "vuex";

const store = useStore();

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const editForm = ref(null);

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "PatListPage", query);
};

const EditPatDetail = async () => {
  let ruleForm = editForm.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid) => {
    if (!valid) {
      alert("필수사항을 입력하십시오.");
      return;
    }
    const pat = editForm.value.data.pat;

    let expDate = null;
    if(pat.toknExpDateYn === '1') {
      expDate = pat.toknExpDate;
    }
    const patInfo = {
      toknNm: pat.toknNm,
      toknExpDate: expDate
    };
    $axios
      .post($apiUrls.meta.portal.pat.setPat, patInfo)
      .then((res) => {
        alert("저장되었습니다.");
        let platform = getCookie("pltfrmId");
        let query = { patkId: res.data.id };
		    routerPush(platform, "PatDetailPage", query);
      })
      .catch((err) => {
        console.log(err);
        alert("저장에 실패하였습니다.");
      });
  });
};

</script>
<style lang="scss"></style>
