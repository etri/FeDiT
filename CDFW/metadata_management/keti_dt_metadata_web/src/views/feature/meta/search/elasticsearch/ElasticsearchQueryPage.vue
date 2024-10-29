<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>Elasticsearch Query DSL</h3>
      </div>
      <div class="boxCnt">
        <el-form 
          :model="state.searchInfo"
          :rules="state.rules" 
          label-position="right" 
          class="demo-ruleForm" 
          ref="ruleFormRef"
          label-width="140px">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="쿼리 JSON" prop="queryJson">
                <el-input 
                  v-model="state.searchInfo.queryJson" 
                  type="textarea" :autosize="{ minRows: 20 }"
                  placeholder="쿼리 JSON을 입력하세요."/>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="HTTP 메서드" prop="httpMethod">
                <el-select v-model="state.searchInfo.httpMethod" placeholder="선택" disabled>
                  <el-option key="GET" label="GET" value="GET" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Index & Endpoint"  prop="indexEndpoint">
                <el-input v-model="state.searchInfo.indexEndpoint"/>
              </el-form-item>
            </el-col>
          </el-row>
          <div class="btnSec taR">
            <el-button type="default" @click="setUpQuery()">초기화</el-button>
            <el-button type="primary" @click="goToResult()">실행</el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>
                           
<script setup>
import { onMounted, reactive, ref, computed } from "vue";
import {
  getGlobalProperties,
} from "@/assets/js/common.js";
import { useStore } from "vuex";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const store = useStore();
const ruleFormRef = ref(null);

const defaultJson = {
    "size": 100,
    "query":{
      "match_all": { }
    }
  };


const state = reactive({
  searchInfo: {
    queryJson: "",
    httpMethod: "GET",
    indexEndpoint: "/dtmeta/_search"
  },
  rules: {
    queryJson: [
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
    httpMethod: [
      {
        required: true,
        message: "선택하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "내용 입력",
        trigger: "blur",
      },
    ],
    indexEndpoint: [
      {
        required: true,
        message: "선택하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "내용 입력",
        trigger: "blur",
      },
    ],
  }
});


const goToResult =() => {
  let ruleForm = ruleFormRef.value; 
  if (!ruleForm) return;
   ruleForm.validate((valid) => {
    if (valid) {
      let query = "?queryJson=" + encodeURIComponent(state.searchInfo.queryJson) 
                + "&httpMethod=" + state.searchInfo.httpMethod
                + "&indexEndpoint=" + state.searchInfo.indexEndpoint
                ;
      const url = window.location.origin + "/meta/searchresult/elasticsearch" + query;
      window.open(url, "winElasticsearchQueryResultPage");
    } else{
      alert("필수사항을 입력하십시오.");
    }
  })
};

onMounted(async()  => {
  
  state.searchInfo.queryJson = JSON.stringify(defaultJson, null, 2);
})



const setUpQuery = () => {
  state.searchInfo.queryJson = JSON.stringify(defaultJson, null, 2);
  state.searchInfo.httpMethod = "GET";
  state.searchInfo.indexEndpoint = "/dtmeta/_search";
}

</script>
<style lang="scss"></style>