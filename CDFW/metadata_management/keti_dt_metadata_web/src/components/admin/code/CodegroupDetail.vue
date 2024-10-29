<template>
  <el-form label-width="160px" :model="codegroup">
    <el-row>
      <el-col :span="24" :xs="24">
        <el-form-item label="코드그룹 명">{{ codegroup.grpNm }}</el-form-item>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="24" :xs="24">
        <el-form-item label="코드그룹 값">{{ codegroup.grpVal }}</el-form-item>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="24" :xs="24">
        <el-form-item label="코드그룹 설명">{{
          codegroup.grpDesc
        }}</el-form-item>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="6" :xs="24">
        <el-form-item label="사용여부">{{ codegroup.useYn }}</el-form-item>
      </el-col>
    </el-row>
  </el-form>
  <div class="btnSec taR">
    <el-button
      v-if="isAmdYn(route.meta.auth)"
      type="primary"
      @click="modifyCodegroup"
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
  codegroup: {
    type: Object,
    required: true,
  },
});

const modifyCodegroup = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    grpId: route.query.grpId,
  };
  routerPush(platform, "CodegroupModifyPage", query);
};
const gotoList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "CodegroupListPage", query);
};
</script>
<style lang="scss"></style>
