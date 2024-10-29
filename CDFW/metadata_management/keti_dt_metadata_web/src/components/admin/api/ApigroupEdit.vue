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
</template>
<script setup>
import { ref, reactive, defineExpose } from "vue";

const ruleFormRef = ref(null);
const labelPosition = ref("right");
const state = reactive({
  api: {
    grpName: "",
    grpDesc: "",
    useYn: true,
  },
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
defineExpose({
  api: state.api,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss"></style>
