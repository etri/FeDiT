<template>
  <el-form label-width="160px" :model="authgroup">
    <el-row>
      <el-col :span="20" :xs="24">
        <el-form-item label="그룹명">{{ authgroup.autName }}</el-form-item>
      </el-col></el-row
    >
    <el-row>
      <el-col :span="20" :xs="24">
        <el-form-item label="설명">{{ authgroup.autDesc }}</el-form-item>
      </el-col></el-row
    >
    <el-row>
      <el-col :span="6" :xs="24">
        <el-form-item label="구분">{{
          authgroup.typeCd == "COD_00001" ? "관리자" : "사용자"
        }}</el-form-item>
      </el-col></el-row
    >
    <el-row>
      <el-col :span="6" :xs="24">
        <el-form-item label="사용여부">{{ authgroup.useYn }}</el-form-item>
      </el-col></el-row
    >
  </el-form>
  <div class="btnSec taR">
    <el-button
      v-if="isAmdYn(route.meta.auth)"
      type="primary"
      @click="modifyAuthgroup"
      >수정</el-button
    >
    <el-button type="primary" plain @click="gotoList">목록</el-button>
  </div>
</template>
<script setup>
import { useRoute } from "vue-router";
import { isAmdYn, getCookie, routerPush } from "@/assets/js/common.js";
const route = useRoute();

const props = defineProps({
  authgroup: {
    type: Object,
    required: true,
  },
});

const modifyAuthgroup = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    autOid: props.authgroup.autOid,
  };
  routerPush(platform, "AuthgroupModifyPage", query);
};
const gotoList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "AuthgroupListPage", query);
};
</script>
<style lang="scss"></style>
