<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>RDF 프라퍼티 검색</h3>
      <div class="btnSec taR">
        <el-button type="default" @click="refresh">초기화</el-button>
        <el-button type="primary" @click="getRdfPropertyList">검색</el-button>
        </div>
    </div>
    <div class="boxCnt">
      <el-form label-position="left"
        :model="searchInfo"
        :inline="true"
        class="demo-form-inline search-form"
        label-width="150px"
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
                    style="width: 150px"
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
                    style="width: 150px"
                  />
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="네임스페이스">
              <el-select
                style="width: 400px"
                v-model="searchInfo.rdfNmspId"
                placeholder="전체"
              >
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
              <el-select v-model="searchInfo.rdfFormMtcd" placeholder="전체">
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
            <el-form-item label="RDF 프라퍼티 명">
              <div class="inline-area">
                <el-input
                  class="w-100 m-2"
                  v-model="searchInfo.searchPrptyNm"
                  placeholder="물리명 또는 논리명을 입력하세요."
                  @keydown.enter.prevent="getRdfPropertyList()"
                />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="14">
            <el-form-item label="포함 범위 RDF 클래스">
              <div class="inline-area">
                <el-input v-model="searchInfo.rdfClass" disabled style="width: calc(100% - 123px);" /> 
                <div class="btnSec taR ml15">
                  <el-button type="default" @click="searchCategory()">
                    <el-icon class="icon icon-search"></el-icon>
                  </el-button>
                  <el-button type="default" class="el-button--delete" @click="refreshCategory()"><el-icon class="icon icon-refresh" /></el-button>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
  <el-dialog v-model="dialogVisibleClassSearch" title="포함 범위 RDF 클래스">
    <div class="dialog-area">
      <RdfClassListPopupPage
        :searchMode="classSearchMode"
        @selectedRow="selectRdfClass"
      />
    </div>
  </el-dialog>
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
import RdfClassListPopupPage from "@/views/feature/meta/setting/rdfclass/RdfClassListPopupPage.vue";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const emits = defineEmits(["searchRdfPropertyList"]);

const dialogVisibleClassSearch = ref(false);
const classSearchMode = ref("all");

const searchInfo = ref({
  searchPrptyNm: "", // 물리명 or 논리명
  rdfFormMtcd: "",
  rdfNmspId: "",
  searchAmdStDt: "",
  searchAmdEdDt: "",
  rdfClass: "",  // 화면상에만 검색
  rangeRdfClassId : ""  // foag:agent
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

const getRdfPropertyList = () => {
  emits("searchRdfPropertyList", searchInfo.value);
};

const refresh = () => {
  searchInfo.value = {
    searchPrptyNm: "", // 물리명 or 논리명
    rdfFormMtcd: "",
    rdfNmspId: "",
    searchAmdStDt: "",
    searchAmdEdDt: "",
  };
  getRdfPropertyList();
};

const searchCategory =() => {
  dialogVisibleClassSearch.value = true;
}

const refreshCategory =() =>{
  searchInfo.value.rdfClass = "";
  searchInfo.value.rangeRdfClassId = "";
}

const selectRdfClass =(data) =>{
  searchInfo.value.rdfClass = data.rowData.rdfClass;
  searchInfo.value.rangeRdfClassId = data.rowData.rdfClassId;
  dialogVisibleClassSearch.value = false;
}






</script>
<style lang=""></style>