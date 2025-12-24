<template>
  <el-form label-width="160px" :model="apigroup">
    <el-row>
      <el-col :span="24" :xs="24">
        <el-form-item label="API그룹 명">{{ apigroup.grpName }}</el-form-item>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="24" :xs="24">
        <el-form-item label="API그룹 설명">{{ apigroup.grpDesc }}</el-form-item>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="6" :xs="24">
        <el-form-item label="사용여부">{{ apigroup.useYn }}</el-form-item>
      </el-col>
    </el-row>
  </el-form>
  <div class="btnSec taR">
    <el-button
      v-if="isAmdYn(route.meta.auth)"
      type="primary"
      @click="modifyApigroup"
      >수정</el-button
    >
    <el-button type="primary" plain @click="gotoList">목록</el-button>
  </div>
</template>
<script setup>
import { useRoute } from "vue-router";
import { defineProps } from "vue";
import { isAmdYn, getCookie, routerPush } from "@/assets/js/common.js";

const route = useRoute();

const props = defineProps({
  apigroup: {
    type: Object,
    required: true,
  },
});

const modifyApigroup = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    grpOid: route.query.grpOid,
  };
  routerPush(platform, "ApigroupModifyPage", query);
};
const gotoList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "ApigroupListPage", query);
};
</script>
<style lang="scss"></style>
