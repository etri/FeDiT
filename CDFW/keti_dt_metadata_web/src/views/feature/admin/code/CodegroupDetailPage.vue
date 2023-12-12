<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>코드그룹 정보</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <CodegroupDetail :codegroup="codegroup" />
        </div>
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
import CodegroupDetail from "@/components/admin/code/CodegroupDetail.vue";
import CodeInfoList from "@/components/admin/code/CodeInfoList.vue";

import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";

import util from "util";
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const route = useRoute();
const codegroup = ref({});
const curPage = ref("detail");
const curTitle = ref("코드 상세");
onMounted(() => {
  getCodegroupDetail();
});

const getCodegroupDetail = () => {
  let grpId = route.query.grpId;

  $axios
    .get(util.format($apiUrls.admin.code.getCodegroupDetail, grpId))
    .then((res) => {
      codegroup.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};
</script>
<style lang="scss"></style>
