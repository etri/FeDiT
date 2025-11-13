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

    <el-form-item label="코드그룹 설명" prop="grpDesc">
      <el-input v-model="state.code.grpDesc" type="textarea"></el-input>
    </el-form-item>

    <el-form-item label="사용여부" prop="useYn">
      <el-checkbox v-model="state.code.useYn"></el-checkbox>
    </el-form-item>
  </el-form>
</template>
<script setup>
import { ref, reactive, defineExpose } from "vue";

const ruleFormRef = ref(null);
const labelPosition = ref("right");
const state = reactive({
  code: {
    grpNm: "",
    grpVal: "",
    grpDesc: "",
    useYn: true,
  },
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
defineExpose({
  code: state.code,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss"></style>
