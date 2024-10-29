<template>
  <div id="codePopup">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>{{ curTitle }}</h3>
      </div>
      <div class="boxCnt">
        <el-form
          ref="ruleFormRef"
          :model="api"
          :rules="rules"
          label-width="120px"
          class="demo-ruleForm"
          :label-position="labelPosition"
        >
          <el-form-item label="API 명" prop="apiName">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="api.apiName"
            ></el-input>
          </el-form-item>

          <el-form-item label="API 설명" prop="apiDesc">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="api.apiDesc"
              type="textarea"
            ></el-input>
          </el-form-item>

          <el-form-item label="URL" prop="apiUrl">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="api.apiUrl"
            ></el-input>
          </el-form-item>

          <el-form-item label="메소드" prop="mthdCd">
            <el-radio-group
              v-model="api.mthdCd"
              v-bind:disabled="curPage != 'modify'"
            >
              <el-radio-button label="GET" />
              <el-radio-button label="POST" />
              <el-radio-button label="PUT" />
              <el-radio-button label="DELETE" />
              <el-radio-button label="PATCH" />
            </el-radio-group>
          </el-form-item>

          <el-form-item label="사용여부" prop="useYn">
            <el-checkbox
              v-bind:disabled="curPage != 'modify'"
              label="사용"
              v-model="api.useYn"
            ></el-checkbox>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button
        v-if="isAmdYn(route.meta.auth) && curPage == 'modify'"
        type="primary"
        @click="modifyApiInfo"
        >수정</el-button
      >

      <el-button
        type="primary"
        v-if="isDelYn(route.meta.auth) && curPage == 'modify'"
        @click="deleteApiInfo"
        >삭제</el-button
      >
      <el-button plain type="primary" @click="cancelDialog">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import { ref, defineProps, defineEmits } from "vue";
import { useRoute } from "vue-router";
import { isAmdYn, isDelYn } from "@/assets/js/common.js";

const route = useRoute();

const props = defineProps({
  api: {
    type: Object,
    required: true,
  },
  curPage: {
    type: String,
    required: false,
  },
  curTitle: {
    type: String,
    required: false,
  },
});

const emits = defineEmits([
  "cancelModiyDialog",
  "modifyApiInfo",
  "deleteApiInfo",
]);

const ruleFormRef = ref(null);
const labelPosition = ref("right");

const rules = ref({
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
});

const cancelDialog = () => {
  emits("cancelModiyDialog");
};

const modifyApiInfo = async () => {
  emits("modifyApiInfo", { data: props.api, ruleFormRef });
};

const deleteApiInfo = () => {
  emits("deleteApiInfo", { data: props.api });
};
</script>
<style lang="scss"></style>
