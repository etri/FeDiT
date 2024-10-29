<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>API그룹 정보</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <ApigroupDetail :apigroup="apigroup" />
        </div>
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
import ApigroupDetail from "@/components/admin/api/ApigroupDetail.vue";
import ApiList from "@/components/admin/api/ApiList.vue";

import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";

import util from "util";
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const route = useRoute();
const apigroup = ref({});
const curPage = ref("detail");
const curTitle = ref("API 상세");

onMounted(() => {
  getApigroupDetail();
});

const getApigroupDetail = () => {
  let grpOid = route.query.grpOid;

  $axios
    .get(util.format($apiUrls.admin.api.getApigroupDetail, grpOid))
    .then((res) => {
      apigroup.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};
</script>
<style lang="scss"></style>
