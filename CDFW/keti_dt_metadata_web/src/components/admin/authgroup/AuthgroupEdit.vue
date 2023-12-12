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
</template>
<script setup>
import { ref, reactive, defineExpose } from "vue";

const ruleFormRef = ref(null);
const labelPosition = ref("right");

const state = reactive({
  auth: {
    autName: "",
    autDesc: "",
    typeCd: true,
    useYn: true,
  },
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
defineExpose({
  auth: state.auth,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss"></style>
