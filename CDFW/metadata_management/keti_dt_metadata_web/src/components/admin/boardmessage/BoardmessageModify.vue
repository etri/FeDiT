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

    <div v-if="boardDetail.atcFileUseYn == 'Y'">
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

import {
  ref,
  reactive,
  defineExpose,
  onMounted,
  defineProps,
  computed,
} from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";

import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const limit = ref(0);

const props = defineProps({
  board: {
    type: Object,
    required: true,
  },
});

const boardDetail = computed(() => {
  return props.board;
});

const ruleFormRef = ref(null);
const labelPosition = ref("left");

const state = reactive({
  boardmsg: {},
  fileList: [],
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

const setBbsOid = () => {
  let checkOidArr = route.query.param.split("=");
  return checkOidArr[1];
};

onMounted(() => {
  getBoardmsgDetail();
  getAttachedFileList();
});

const getBoardmsgDetail = () => {
  let bbsOid = setBbsOid();
  let pstngOid = route.query.pstngOid;

  $axios
    .get(util.format($apiUrls.admin.boardmsg.getBoardmsgDetail, bbsOid, pstngOid))
    .then((res) => {
      state.boardmsg = res.data;
      state.boardmsg.prevPstngYn == "Y"
        ? (state.boardmsgprevPstngYn = true)
        : (state.boardmsg.prevPstngYn = false);
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAttachedFileList = async () => {
  let bbsOid = setBbsOid();
  let pstngOid = route.query.pstngOid;

  await $axios
    .get(
      util.format(
        $apiUrls.admin.boardmsg.getBoardmsgAttachFiles,
        bbsOid,
        pstngOid
      )
    )
    .then((res) => {
      state.fileList = res.data.slice();
      state.originFile = res.data;
      state.fileList.forEach((data) => {
        data.name = data.fileOriginNm;
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

const uploadFile = (payload) => {
  state.fileList = [];
  for (let data of payload.fileList) state.fileList.push(data);
};

defineExpose({
  boardmsg: state.boardmsg,
  data: state,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss"></style>
