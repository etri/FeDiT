<template>
  <div class="boxLayout">
    <div class="boxTit" v-if="searchMode === 'model'">
      <h3>메타데이터 모델 프라퍼티 검색 - {{ modelNm }}</h3>
      <div class="btnSec taR">
        <el-button type="primary" @click="getTypeModelPropertyList()">검색</el-button>
      </div>
    </div>
    <div class="boxTit" v-else>
      <h3>메타데이터 모델 프라퍼티 검색</h3>
      <div class="btnSec taR">
        <el-button type="primary" @click="getTypeModelPropertyList()">검색</el-button>
      </div>
    </div>
    <div class="boxCnt">
        <el-form label-position="left" 
          :model="searchInfo" :inline="true" 
          class="demo-form-inline" l
          abel-width="80px"
          style="margin-top: 20px;">
          <el-form-item label="모델" style="margin-left: 21px;">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-input 
                  style="width: 400px;" 
                  v-model="state.modelNm" 
                  disabled />
              </el-col>
            </el-row>
          </el-form-item>
          <el-form-item label="검색어" style="margin-left: 21px;">
            <el-row :gutter="20">
              <el-col :span="24">
                <div class="inline-area">
                  <el-input 
                    style="width: 400px" 
                    v-model="searchInfo.searchName" 
                    placeholder="물리명 또는 논리명을 입력하세요."
                    @keydown.enter.prevent="getTypeModelPropertyList()" />
                </div>
              </el-col>
            </el-row>
          </el-form-item>
        </el-form>
    </div>
  </div>
</template>
<script setup>
import {
  reactive,
  ref,
  defineProps,
  defineEmits,
  defineExpose,
  watch,
  computed,
  onMounted,
} from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const emits = defineEmits(["searchModelProperty"]);

const searchInfo = ref({
  modelId: "",
  searchName: "",
});

const state = reactive({
  modelNm: "",
});

const props = defineProps({
  searchMode: "",
  searchModelDisabled: "",
  modelId: "",
  modelNm: "",
});

onMounted(() => {
  if (props.searchModelDisabled === "Y") {
    searchInfo.value.modelId = props.modelId
    state.modelNm = props.modelNm
  }
});

watch(() => props.modelId, () => {
  if (props.searchModelDisabled === "Y") {
    searchInfo.value.modelId = props.modelId
    state.modelNm = props.modelNm
  }
});

const getTypeModelPropertyList = () => {
  emits("searchModelProperty", searchInfo.value);
};
</script>
<style lang="scss"></style>