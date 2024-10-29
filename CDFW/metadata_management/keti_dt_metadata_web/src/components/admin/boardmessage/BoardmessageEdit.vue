<template>
  <el-form
    ref="ruleFormRef"
    :model="state.boardmsg"
    :rules="state.rules"
    label-width="120px"
    class="demo-ruleForm"
    :label-position="labelPosition"
  >
    <el-form-item label="제목" prop="pstngTitle">
      <el-input v-model="state.boardmsg.pstngTitle"></el-input>
    </el-form-item>

    <el-form-item label="내용" prop="pstngSbst">
      <comn-editor v-model="state.boardmsg.pstngSbst" :max-limit="280" />
    </el-form-item>

    <el-form-item label="선 게시 여부" prop="prevPstngYn">
      <el-checkbox
        label="항상 목록의 최상위에 표시 됩니다."
        v-model="state.boardmsg.prevPstngYn"
      ></el-checkbox>
    </el-form-item>

    <div v-if="board.atcFileUseYn == 'Y'">
      <el-form-item label="파일 업로드" prop="file">
        <ComnUpload
          @uploadFile="uploadFile"
          :limit="limit"
          style="width: 100%"
          :infofileList="state.fileList"
        />
      </el-form-item>
    </div>
  </el-form>
</template>
<script setup>
import ComnEditor from "@/components/common/ComnEditor";
import ComnUpload from "@/components/common/ComnUpload.vue";

import { ref, reactive, defineProps, defineExpose } from "vue";

const limit = ref(0);

const props = defineProps({
  board: {
    type: Object,
    required: true,
  },
});

const ruleFormRef = ref(null);
const labelPosition = ref("left");

const state = reactive({
  fileList: [],
  boardmsg: {
    pstngTitle: "",
    pstngSbst: "",
    prevPstngYn: false,
  },
  rules: {
    pstngTitle: [
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
    pstngSbst: [
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
    prevPstngYn: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
    ],
  },
});

const uploadFile = (payload) => {
  state.fileList = [];
  for (let i of payload.fileList) state.fileList.push(i);
};

defineExpose({
  boardmsg: state.boardmsg,
  data: state,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss"></style>
