<template>
  <div>
    <div class="boxLayout">
      <div class="boxTit">
        <h3>코드 등록</h3>
      </div>
      <div class="boxCnt">
        <el-form
          ref="ruleFormRef"
          :model="state.code"
          :rules="state.rules"
          label-width="120px"
          class="demo-ruleForm"
          :label-position="labelPosition"
        >
          <el-form-item label="코드명" prop="cdNm">
            <el-input v-model="state.code.cdNm"></el-input>
          </el-form-item>

          <el-form-item label="코드값" prop="codeValue">
            <el-input v-model="state.code.cdVal"></el-input>
          </el-form-item>

          <el-form-item label="코드 순서" prop="odrg">
            <el-input
              v-model.number="state.code.odrg"
              type="text"
              autocomplete="off"
            ></el-input>
          </el-form-item>

          <el-form-item label="사용여부" prop="actTF">
            <el-checkbox label="사용" v-model="state.code.useYn"></el-checkbox>
          </el-form-item>

          <el-form-item label="설명" prop="description">
            <el-input v-model="state.code.cdDesc" type="textarea"></el-input>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditCodeInfo">저장</el-button>
      <el-button plain type="primary" @click="cancelDialog">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, defineEmits } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const emits = defineEmits(["editCodeInfo", "cancelDialog"]);

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

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

const state = reactive({
  code: {
    cdNm: "",
    cdVal: "",
    cdDesc: "",
    odrg: "0",
    useYn: false,
  },
  rules: {
    cdNm: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
    ],
    odrg: [{ validator: checkNum, trigger: "blur" }],
  },
});

const EditCodeInfo = async () => {
  let ruleForm = ruleFormRef.value;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let grpId = route.query.grpId;
      let codeInfo = {
        grpId: route.query.grpId,
        ...state.code,
        useYn: state.code.useYn == true ? "Y" : "N",
      };

      $axios
        .post(util.format($apiUrls.admin.code.setCode, grpId), codeInfo)
        .then(() => {
          alert("등록이 완료되었습니다.");
          resetCodeData();
          emits("editCodeInfo");
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

const resetCodeData = () => {
  state.code.cdNm = "";
  state.code.cdDesc = "";
  state.code.cdVal = "";
  state.code.odrg = "";
  state.code.useYn = false;
};

const cancelDialog = () => {
  emits("cancelDialog");
};
</script>
<style lang="scss"></style>
