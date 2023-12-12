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
import { ref, reactive, defineExpose, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);
const labelPosition = ref("left");

const state = reactive({
  board: {},
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

onMounted(() => {
  getBoardDetail();
});

const getBoardDetail = () => {
  let bbsOid = route.query.bbsOid;
  $axios
    .get(util.format($apiUrls.admin.board.getBoardDetail, bbsOid))
    .then((res) => {
      state.board = res.data;

      res.data.replUseYn == "Y"
        ? (state.board.replUseYn = true)
        : (state.board.replUseYn = false);
      res.data.atcFileUseYn == "Y"
        ? (state.board.atcFileUseYn = true)
        : (state.board.atcFileUseYn = false);
    })
    .catch((err) => {
      console.log(err);
    });
};

defineExpose({
  data: state,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss"></style>
