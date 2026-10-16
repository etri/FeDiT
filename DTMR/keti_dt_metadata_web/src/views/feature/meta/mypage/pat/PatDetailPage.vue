<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>PAT(Personal Access Token) 정보</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <PatDetail :pat="pat" />
        </div>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" plain v-if="isDelYn(route.meta.auth) && pat.patkRegrId == user.id" @click="deletePat">삭제</el-button>
      <el-button type="default" @click="goToList">목록</el-button>
    </div>
  </div>
</template>
<script setup>

import PatDetail from "@/components/meta/pat/PatDetail.vue";

import { ref, onMounted, watch, onBeforeMount } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getGlobalProperties,
  isDelYn,
  getCookie,
  routerPush,
  getSuperAdmin,
} from "@/assets/js/common.js";
import { getUser } from "@/assets/js/auth.js";

const user = getUser();
import util from "util";
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const route = useRoute();
const router = useRouter();

const pat = ref({});

onBeforeMount( async () => {
	await router.isReady();
});

onMounted(() => {
  getPatDetail();
});

watch(
  () => route.query.patkId,
  (cur, prev) => {
    if (cur) getPatDetail();
  },
  { deep: true }
)

const getPatDetail = () => {
  let patkId = route.query.patkId;

  $axios
    .get(util.format($apiUrls.meta.portal.pat.getPat, patkId))
    .then( (res) => {
      if ( user.id == res.data.patkRegrId ) {
        pat.value = res.data;
        pat.value.patkRegDt = pat.value.patkRegDt.substring(0, 19);
      } else {
        pat.value = { patkId: null };
        alert('내 PAT가 아닙니다.');
        goToList();
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const deletePat = () => { 
  let patkId = route.query.patkId;

  let result = confirm("" + pat.value.toknNm + " Token을 삭제하시겠습니까?");
  if (result) {
    $axios
      .delete(util.format($apiUrls.meta.portal.pat.deletePat, patkId))
      .then(() => {
        alert("" + pat.value.toknNm + " Token이 삭제되었습니다.");
        goToList();
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "PatListPage", query);
};

</script>
<style lang="scss"></style>