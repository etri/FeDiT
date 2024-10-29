<template>
  <el-form
    ref="ruleFormRef"
    :model="state.code"
    :rules="state.rules"
    label-width="120px"
    class="demo-ruleForm"
    :label-position="labelPosition"
  >
    <el-form-item label="코드그룹 명" prop="grpNm">
      <el-input v-model="state.code.grpNm"></el-input>
    </el-form-item>

    <el-form-item label="코드그룹 값" prop="grpVal">
      <el-input v-model="state.code.grpVal"></el-input>
    </el-form-item>

    <el-form-item label="코드그룹 설명">
      <el-input v-model="state.code.grpDesc"></el-input>
    </el-form-item>

    <el-form-item label="사용여부" prop="useYn">
      <el-checkbox label="사용" v-model="state.code.useYn"></el-checkbox>
    </el-form-item>
  </el-form>
  <div class="btnSec taR mt20">
    <el-button type="primary" @click="modifyCodegroup">저장</el-button>
    <el-button
      v-if="isDelYn(route.meta.auth)"
      type="primary"
      text
      bg
      @click="deleteCodegroup"
      >삭제</el-button
    >
    <el-button plain type="primary" @click="goToReadPage">취소</el-button>
  </div>
</template>

<script setup>
import { ref, reactive, defineEmits, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  isDelYn,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";

import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const ruleFormRef = ref(null);
const labelPosition = ref("right");

const emits = defineEmits(["modifyCodegroup", "deleteCodegroup"]);

const state = reactive({
  code: {},
  rules: {
    grpNm: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "내용 입력",
        trigger: "blur",
      },
    ],
    grpVal: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "내용 입력",
        trigger: "blur",
      },
    ],
  },
});

onMounted(() => {
  codeGroupDetail();
});

const codeGroupDetail = () => {
  let grpId = route.query.grpId;
  $axios
    .get(util.format($apiUrls.admin.code.getCodegroupDetail, grpId))
    .then((res) => {
      state.code = res.data;

      if (res.data.useYn == "Y") state.code.useYn = true;
      else state.code.useYn = false;
    })
    .catch((err) => {
      console.log(err);
    });
};

const modifyCodegroup = () => {
  emits("modifyCodegroup", { data: state.code, ruleFormRef: ruleFormRef });
};

const deleteCodegroup = () => {
  emits("deleteCodegroup");
};

const goToReadPage = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    grpId: route.query.grpId,
  };
  routerPush(platform, "CodegroupDetailPage", query);
};
</script>
<style lang="scss"></style>
