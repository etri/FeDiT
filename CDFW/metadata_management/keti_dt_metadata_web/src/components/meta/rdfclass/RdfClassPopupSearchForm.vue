<template>
  <div class="boxLayout">
    <div class="boxTit" v-if="searchMode === 'range'"><h3>RDF 클래스 검색 - {{ rdfInfo.nodeNm }}</h3>
      <div class="btnSec taR">
        <el-button type="primary" @click="getRdfClassList()">검색</el-button>
      </div>
    </div>
    <div class="boxTit" v-else><h3>RDF 클래스 검색</h3>
      <div class="btnSec taR">
        <el-button type="primary" @click="getRdfClassList()">검색</el-button>
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
          <el-col :span="12">    
            <el-form-item label="RDF 매핑 형식">
              <el-select v-if="searchTypeFix" v-model="searchInfo.rdfFormMtcd" placeholder="전체" disabled>
                <el-option label="전체" value="" />
                <el-option
                  v-for="item in rdfFormMtcdList"
                  :key="item.mtcd"
                  :label="item.mtcdNm"
                  :value="item.mtcd"
                />
              </el-select>
              <el-select v-else v-model="searchInfo.rdfFormMtcd" placeholder="전체" >
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
            <el-form-item label="네임스페이스">
              <el-select v-model="searchInfo.rdfNmspId" placeholder="전체">
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
  onMounted,
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
  searchMode: "",
  searchTypeFix:{
    type: Boolean,
  },
  rdfInfo: {
    type: Object,
  }
});

setTimeout(() => {
  if(props.searchTypeFix){
    searchInfo.value.rdfFormMtcd = props.rdfInfo.rdfFormMtcd
  }
}, 1000);

const getRdfClassList = () => {
  emits("searchRdfClass", searchInfo.value);
};
</script>
<style lang="scss"></style>