<template>
  <el-form
    ref="ruleFormRef"
    :model="state.board"
    :rules="state.rules"
    label-width="120px"
    class="demo-ruleForm"
    :label-position="labelPosition"
  >
    <el-form-item label="게시판명" prop="bbsNm">
      <el-input v-model="state.board.bbsNm"></el-input>
    </el-form-item>

    <el-form-item label="게시판 코드" prop="bbsCd">
      <el-input v-model="state.board.bbsCd"></el-input>
    </el-form-item>

    <el-form-item label="첨부파일" prop="atcFileUseYn">
      <el-checkbox v-model="state.board.atcFileUseYn"></el-checkbox>
    </el-form-item>

    <el-form-item label="댓글" prop="replUseYn">
      <el-checkbox v-model="state.board.replUseYn"></el-checkbox>
    </el-form-item>
  </el-form>
</template>
<script setup>
import { ref, reactive, defineExpose } from "vue";

const ruleFormRef = ref(null);
const labelPosition = ref("left");

const state = reactive({
  board: {
    bbsNm: "",
    bbsCd: "",
    atcFileUseYn: false,
    replUseYn: false,
  },
  rules: {
    bbsNm: [
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
    bbsCd: [
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
  board: state.board,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss"></style>
