<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>RDF 클래스 검색</h3>
      <div class="btnSec taR">
          <el-button type="primary" @click="getRdfClassList()">검색</el-button>
        </div>
    </div>
    <div class="boxCnt">
      <el-form label-position="left"
        :model="searchInfo"
        :inline="true"
        class="demo-form-inline search-form"
        label-width="130px"
      >
        <el-row :gutter="20">
          <el-col :span="12" v-if="amdDtVisibleYn">
            <el-form-item label="수정일">
              <div class="demo-date-picker" style="display: flex">
                <div class="block" style="margin-right: 10px">
                  <el-date-picker
                    v-model="searchInfo.searchAmdStDt"
                    type="date"
                    placeholder="시작일"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                  />
                </div>
                <span style="margin-right: 10px">~</span>
                <div class="demo-date-picker">
                  <el-date-picker
                    v-model="searchInfo.searchAmdEdDt"
                    type="date"
                    placeholder="종료일"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                  />
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="네임스페이스">
              <el-select v-model="searchInfo.rdfNmspId" placeholder="선택" >
                <el-option label="전체" value="" />
                <el-option
                  v-for="item in rdfNmspList"
                  :key="item.rdfNmspId"
                  :label="item.label"
                  :value="item.rdfNmspId"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="RDF 매핑 형식">
              <el-select v-model="searchInfo.rdfFormMtcd" placeholder="선택" >
                <el-option label="전체" value="" />
                <el-option
                  v-for="item in rdfFormMtcdList"
                  :key="item.mtcd"
                  :label="item.mtcdNm"
                  :value="item.mtcd"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="RDF 클래스 명">
              <el-input
                v-model="searchInfo.searchClassNm"
                placeholder="물리명 또는 논리명을 입력하세요."
                @keydown.enter.prevent="getRdfClassList()"
              />
            </el-form-item>
          </el-col>
        </el-row>
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
} from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const emits = defineEmits(["searchRdfClass"]);

const searchInfo = ref({
  searchClassNm: "", // 물리명 or 논리명
  rdfFormMtcd: "",
  rdfNmspId: "",
  searchAmdStDt: "",
  searchAmdEdDt: "",
});

const props = defineProps({
  rdfFormMtcdList: {
    type: Array,
    required: false,
  },
  rdfNmspList: {
    type: Array,
    required: false,
  },
  amdDtVisibleYn: {
    type: Boolean,
    required: false,
  },
});

const getRdfClassList = () => {
  emits("searchRdfClass", searchInfo.value);
};
</script>
<style lang="scss"></style>