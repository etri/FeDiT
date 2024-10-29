<template>
  <div>
    <div class="boxLayout">
      <div class="boxTit">
        <h3>API 등록</h3>
      </div>
      <div class="boxCnt">
        <el-form
          ref="ruleFormRef"
          :model="state.api"
          :rules="state.rules"
          label-width="120px"
          class="demo-ruleForm"
          :label-position="labelPosition"
        >
          <el-form-item label="API명" prop="apiName">
            <el-input v-model="state.api.apiName"></el-input>
          </el-form-item>

          <el-form-item label="API 설명" prop="apiDesc">
            <el-input v-model="state.api.apiDesc" type="textarea"></el-input>
          </el-form-item>

          <el-form-item label="URL" prop="apiUrl">
            <el-input v-model="state.api.apiUrl"></el-input>
          </el-form-item>

          <el-form-item label="메소드" prop="mthdCd">
            <el-radio-group v-model="state.api.mthdCd">
              <el-radio-button label="GET" />
              <el-radio-button label="POST" />
              <el-radio-button label="PUT" />
              <el-radio-button label="DELETE" />
              <el-radio-button label="PATCH" />
            </el-radio-group>
          </el-form-item>

          <el-form-item label="사용여부" prop="useYn">
            <el-checkbox v-model="state.api.useYn"></el-checkbox>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditApiInfo">저장</el-button>
      <el-button plain type="primary" @click="cancelDialog">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, defineEmits } from "vue";
import { useRoute } from "vue-router";
import { getLoginUserId } from "@/assets/js/auth.js";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";
const emits = defineEmits(["editApiInfo", "cancelDialog"]);

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);
const labelPosition = ref("right");

const state = reactive({
  api: {
    apiName: "",
    apiDesc: "",
    apiUrl: "",
    mthdCd: "",
    useYn: false,
  },
  rules: {
    apiName: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
    ],
    apiUrl: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
    ],
    mthdCd: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
    ],
  },
});

const EditApiInfo = async () => {
  let ruleForm = ruleFormRef.value;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let grpOid = route.query.grpOid;

      let apiInfo = {
        ...state.api,
        grpOid: route.query.grpOid,
        regr: getLoginUserId(),
        useYn: state.api.useYn == true ? "Y" : "N",
      };

      $axios
        .post(util.format($apiUrls.admin.api.setApiDetail, grpOid), apiInfo)
        .then(() => {
          alert("등록이 완료되었습니다.");
          resetApiData();
          emits("editApiInfo");
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

const resetApiData = () => {
  state.api.apiDesc = "";
  state.api.apiName = "";
  state.api.apiUrl = "";
  state.api.mthdCd = "";
  state.api.useYn = false;
};
const cancelDialog = () => {
  emits("cancelDialog");
};
</script>
<style lang="scss"></style>
