<template>
  <div id="codePopup">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>{{ curTitle }}</h3>
      </div>
      <div class="boxCnt">
        <el-form
          ref="ruleFormRef"
          :model="code"
          :rules="rules"
          label-width="120px"
          class="demo-ruleForm"
          :label-position="labelPosition"
        >
          <el-form-item label="코드명" prop="cdNm">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="code.cdNm"
            ></el-input>
          </el-form-item>

          <el-form-item label="코드값" prop="cdVal">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="code.cdVal"
            ></el-input>
          </el-form-item>

          <el-form-item label="코드 순서" prop="odrg">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model.number="code.odrg"
            ></el-input>
          </el-form-item>

          <el-form-item label="사용여부" prop="useYn">
            <el-checkbox
              v-bind:disabled="curPage != 'modify'"
              label="사용"
              v-model="code.useYn"
            ></el-checkbox>
          </el-form-item>

          <el-form-item label="설명" prop="cdDesc">
            <el-input
              class="textareaType"
              v-bind:disabled="curPage != 'modify'"
              v-model="code.cdDesc"
              type="textarea"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button
        v-if="isAmdYn(route.meta.auth) && curPage == 'modify'"
        type="primary"
        @click="modifyCodeInfo"
        >수정</el-button
      >

      <el-button
        type="primary"
        v-if="isDelYn(route.meta.auth) && curPage == 'modify'"
        @click="deleteCodeInfo"
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
  code: {
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
  "modifyCodeInfo",
  "deleteCodeInfo",
]);

const ruleFormRef = ref(null);
const labelPosition = ref("right");
const checkNum = (rule, value, callback) => {
  if (!value) {
    return callback(new Error("숫자를 입력해주십시오"));
  }
  setTimeout(() => {
    if (!Number.isInteger(value)) {
      callback(new Error("숫자를 입력해주십시오"));
    } else {
      callback();
    }
  }, 500);
};

const rules = ref({
  cdNm: [
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
  odrg: [{ required: true, validator: checkNum, trigger: "blur" }],
});

const cancelDialog = () => {
  emits("cancelModiyDialog");
};
const modifyCodeInfo = async () => {
  emits("modifyCodeInfo", { data: props.code, ruleFormRef });
};

const deleteCodeInfo = () => {
  emits("deleteCodeInfo", { data: props.code });
};
</script>
<style lang="scss">
.el-textarea__inner {
  resize: none;
}
</style>
