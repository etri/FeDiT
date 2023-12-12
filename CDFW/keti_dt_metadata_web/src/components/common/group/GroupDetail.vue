<template>
  <el-form label-width="160px" :model="group">
    <el-row>
      <el-col :span="20" :xs="24">
        <el-form-item label="그룹명">{{ group.grpNm }}</el-form-item>
      </el-col></el-row
    >
    <el-row>
      <el-col :span="20" :xs="24">
        <el-form-item label="설명">{{ group.grpDesc }}</el-form-item>
      </el-col></el-row
    >
  </el-form>
  <div class="btnSec taR">
    <el-button type="primary" @click="editGroup">수정</el-button>
    <el-button type="primary" plain @click="gotoList">목록</el-button>
  </div>
</template>
<script setup>
import { useRoute } from "vue-router";
import { getCookie, routerPush } from "@/assets/js/common.js";
const route = useRoute();

const props = defineProps({
  group: {
    type: Object,
    required: true,
  },
});

const editGroup = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    grpId: props.group.grpId,
  };
  routerPush(platform, "GroupEdit", query);
};
const gotoList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "GroupList", query);
};
</script>
<style lang="scss"></style>
