<template>
  <el-form
    ref="ruleFormRef"
    :model="state.auth"
    :rules="state.rules"
    label-width="120px"
    class="demo-ruleForm"
    :label-position="labelPosition"
  >
    <el-form-item label="그룹명" prop="autName">
      <el-input v-model="state.auth.autName"></el-input>
    </el-form-item>

    <el-form-item label="설명" prop="autDesc">
      <el-input v-model="state.auth.autDesc" type="textarea"></el-input>
    </el-form-item>

    <el-form-item label="구분" prop="typeCd">
      <el-checkbox label="관리자" v-model="state.auth.typeCd"></el-checkbox>
    </el-form-item>

    <el-form-item label="사용여부" prop="useYn">
      <el-checkbox v-model="state.auth.useYn"></el-checkbox>
    </el-form-item>
  </el-form>

  <div class="btnSec taR mt20">
    <el-button type="primary" @click="modifyAuthgroup">저장</el-button>
    <el-button
      v-if="isDelYn(route.meta.auth)"
      type="primary"
      text
      bg
      @click="deleteAuthgroup"
      >삭제</el-button
    >
    <el-button plain type="primary" @click="goToReadPage">취소</el-button>
  </div>
</template>
<script setup>
import { isDelYn, getCookie, routerPush } from "@/assets/js/common.js";

import { ref, reactive, onMounted } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";
import { useRoute } from "vue-router";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);
const labelPosition = ref("right");

const emits = defineEmits(["modifyAuthgroup", "deleteAuthgroup"]);

const state = reactive({
  auth: {},
  rules: {
    autName: [
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
    typeCd: {
      required: true,
      message: "구분을 확인해주세요.",
      trigger: "blur",
    },
    useYn: {
      required: true,
      message: "사용 여부를 확인해주세요.",
      trigger: "blur",
    },
  },
});
onMounted(() => {
  getAuthGroupDetail();
});

//auth detail 가져오기
const getAuthGroupDetail = () => {
  let autOid = route.query.autOid;
  $axios
    .get(util.format($apiUrls.admin.auth.getAuthDetail, autOid))
    .then((res) => {
      state.auth = res.data;

      if (res.data.typeCd == "COD_00001") state.auth.typeCd = true;
      if (res.data.useYn == "Y") state.auth.useYn = true;
    })
    .catch((err) => {
      console.log(err);
    });
};

const modifyAuthgroup = () => {
  emits("modifyAuthgroup", { data: state.auth, ruleFormRef: ruleFormRef });
};

const deleteAuthgroup = () => {
  emits("deleteAuthgroup");
};

const goToReadPage = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    autOid: route.query.autOid,
  };
  routerPush(platform, "AuthgroupDetailPage", query);
};
</script>
<style lang="scss"></style>
