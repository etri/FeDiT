<template>
  <el-form
    ref="ruleFormRef"
    :model="state.api"
    :rules="state.rules"
    label-width="120px"
    class="demo-ruleForm"
    :label-position="labelPosition"
  >
    <el-form-item label="API그룹 명" prop="grpName">
      <el-input v-model="state.api.grpName"></el-input>
    </el-form-item>

    <el-form-item label="API그룹 설명" prop="grpDesc">
      <el-input v-model="state.api.grpDesc" type="textarea"></el-input>
    </el-form-item>

    <el-form-item label="사용여부" prop="useYn">
      <el-checkbox v-model="state.api.useYn"></el-checkbox>
    </el-form-item>
  </el-form>
  <div class="btnSec taR mt20">
    <el-button type="primary" @click="modifyApigroup">저장</el-button>
    <el-button
      v-if="isDelYn(route.meta.auth)"
      type="primary"
      text
      bg
      @click="deleteApigroup"
      >삭제</el-button
    >
    <el-button plain type="primary" @click="goToReadPage">취소</el-button>
  </div>
</template>

<script setup>
import { isDelYn } from "@/assets/js/common.js";
import { ref, reactive, onMounted, defineEmits } from "vue";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import util from "util";
import { useRoute } from "vue-router";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const emits = defineEmits(["modifyApigroup", "deleteApigroup"]);

const ruleFormRef = ref(null);
const labelPosition = ref("right");
const state = reactive({
  api: {},
  rules: {
    grpName: [
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
  getApiGroupDetail();
});

const getApiGroupDetail = () => {
  let grpOid = route.query.grpOid;
  $axios
    .get(util.format($apiUrls.admin.api.getApigroupDetail, grpOid))
    .then((res) => {
      state.api = res.data;

      if (res.data.useYn == "Y") state.api.useYn = true;
      else state.api.useYn = false;
    })
    .catch((err) => {
      console.log(err);
    });
};

const modifyApigroup = () => {
  emits("modifyApigroup", { data: state.api, ruleFormRef });
};

const deleteApigroup = () => {
  emits("deleteApigroup");
};

const goToReadPage = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    grpOid: route.query.grpOid,
  };
  routerPush(platform, "ApigroupDetailPage", query);
};
</script>
<style lang="scss"></style>
