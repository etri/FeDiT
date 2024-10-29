<template>
  <el-form
    ref="ruleFormRef"
    :model="state.pat"
    :rules="state.rules"
    label-width="120px"
    class="demo-ruleForm"
    :label-position="labelPosition"
  >

    <el-form-item label="Token 명" prop="toknNm">
      <el-input v-model="state.pat.toknNm"></el-input>
    </el-form-item>

    <el-form-item label="만료일 설정 여부" prop="toknExpDateYn">
      <el-radio-group v-model="state.pat.toknExpDateYn" class="ml-4">
        <el-radio label="1" size="large">기한 설정</el-radio>
        <el-radio label="2" size="large">기한 없음</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="만료일" prop="toknExpDate" v-show="state.pat.toknExpDateYn === '1'" :required="state.pat.toknExpDateYn === '1'">
      <div class="demo-date-picker">
        <div class="block">
          <el-date-picker
            v-model="state.pat.toknExpDate"
            type="date"
            placeholder=""
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 150px"
          />
        </div>
      </div>
    </el-form-item>
    
  </el-form>
</template>
<script setup>
import { getUser } from "@/assets/js/auth.js";
import { ref, reactive, defineExpose } from "vue";

const user = getUser();
const limit = ref(0);

const ruleFormRef = ref(null);
const labelPosition = ref("right");

const state = reactive({
  fileList: [],
  pat: {
    toknNm: "",
    toknExpDateYn: '1',
    toknExpDate: "",
    regrId: user.id,
    regrNm: user.nm,
  },
  rules: {
    toknNm: [
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
    toknExpDateYn: [
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
    toknExpDate: [
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

defineExpose({
  data: state,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss">
textarea {
  width: 100%;
  height: 7em;
  resize: none;
}
</style>
