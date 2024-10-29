<template>
  <div>
    <div class="btnSec taL" style="margin-top: -15px;">
      <el-button type="default" style="margin-top: 15px;"
        v-for="typeModel in typeModelList" 
        :key="typeModel.modelNm" 
        @click="detailModel(typeModel.modelId)"> {{typeModel.modelLogicNm}} </el-button>
    </div>
  </div>   
</template>

<script setup>
import {getGlobalProperties } from "@/assets/js/common.js";
import { ref, reactive, getCurrentInstance } from "vue";
import util from "util";
const $emitter = getCurrentInstance().appContext.config.globalProperties.$emitter;
const emits = defineEmits(["detailModel"]);
const props = defineProps({
	typeModelList: {
		type: Array,
		required: true
	},
});

const detailModel = (modelId) => {
  emits("detailModel", modelId);
}
</script>
<style lang="scss"></style>