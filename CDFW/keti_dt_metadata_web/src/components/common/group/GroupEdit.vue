<template>
  <el-form
    ref="ruleFormRef"
    :model="state.group"
    :rules="state.rules"
    label-width="120px"
    class="demo-ruleForm"
    :label-position="labelPosition"
  >
    <el-form-item label="그룹명" prop="grpNm">
      <el-input v-model="state.group.grpNm"></el-input>
    </el-form-item>

    <el-form-item label="설명" prop="grpDesc">
      <el-input v-model="state.group.grpDesc" type="textarea"></el-input>
    </el-form-item>
  </el-form>
</template>
<script setup>
import { getGlobalProperties } from "@/assets/js/common.js";
import { ref, reactive, defineExpose, defineProps, onMounted } from "vue";
import { useRoute } from "vue-router";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);
const labelPosition = ref("right");

const props = defineProps({
});

let grpId = route.query.grpId;

onMounted(() => {
  if(grpId != null){
    getGroupDetail();
  }
});

const state = reactive({
  group: {
    grpNm: "",
    grpDesc: "",
  },
  rules: {
    grpNm: [
      {
        required: true,
        message: "이름을 입력하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "이름 입력",
        trigger: "blur",
      },
    ],
    grpDesc: [
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

const getGroupDetail = () => {
  let grpId = route.query.grpId;
  $axios
    .get(util.format($apiUrls.common.group.getGroupDetail, grpId))
    .then((res) => {
      state.group.grpNm = res.data.grpNm;
      state.group.grpDesc = res.data.grpDesc;
    })
    .catch((err) => {
      console.log(err);
    });
};

defineExpose({
  group: state.group,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss"></style>
