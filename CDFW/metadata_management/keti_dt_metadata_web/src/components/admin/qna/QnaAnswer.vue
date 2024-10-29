<template>
  <el-form
    :model="formData"
    :rules="state.rules"
    ref="ruleForm"
    label-width="120px"
    class="demo-ruleForm"
  >
    <el-form-item label="답변" prop="qnaAns">
      <div
        v-if="
          (formData.qnaAns == '' || formData.qnaAns == null) &&
          state.changeData == false
        "
      >
        <p>등록된 답변이 없습니다.</p>
      </div>

      <div v-if="formData.qnaAns != '' && state.changeData == false">
        {{ formData.qnaAns }}
      </div>

      <div v-if="state.changeData == true">
        <el-input v-model="formData.qnaAns" type="textarea"></el-input>
      </div>
    </el-form-item>
  </el-form>
  <div class="btnSec taR mt20">
    <el-button
      v-if="
        answerable &&
        (formData.qnaAns == '' ||
          (state.changeData == true && isWriteYn(route.meta.auth)))
      "
      type="primary"
      @click="EditQna"
      >등록</el-button
    >
    <el-button
      plain
      type="primary"
      v-if="state.changeData == true"
      @click="cancelQna"
      >취소</el-button
    >
    <el-button
      v-if="
        answerable &&
        formData.qnaAns != '' &&
        state.changeData == false &&
        isAmdYn(route.meta.auth)
      "
      type="primary"
      @click="modifyQna"
      >수정</el-button
    >
  </div>
</template>

<script setup>
import { reactive, defineExpose, defineEmits, defineProps, watch } from "vue";
import { isWriteYn, isAmdYn } from "@/assets/js/common.js";
import { useRoute } from "vue-router";

const route = useRoute();

const emits = defineEmits(["sendQnaAnser"]);
const props = defineProps({
  qna: {
    type: Object,
    required: true,
  },
  answerable: { // 내 문의 내역에서는 답변 수정 불가능
    type: Boolean,
    default: true,
  },
});

const formData = reactive({
  qnaAns: "",
});

watch(
  () => props.qna.qnaAns,
  (newValue) => {
    formData.qnaAns = newValue;
  }
);

const state = reactive({
  changeData: false,
  rules: {},
});

const EditQna = () => {
  if (state.changeData == false) return (state.changeData = true);
  if (state.changeData == true) {
    emits("sendQnaAnser", { data: formData.qnaAns });
  }
};

const modifyQna = () => {
  state.changeData = !state.changeData;
};

const cancelQna = () => {
  state.changeData = !state.changeData;
  formData.qnaAns = props.qna.qnaAns;
};

defineExpose({
  code: state.code,
});
</script>
<style lang="scss"></style>
