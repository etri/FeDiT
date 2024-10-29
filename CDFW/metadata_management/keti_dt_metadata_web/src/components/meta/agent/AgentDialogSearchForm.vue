<template>
  <el-form label-position="left"
    :inline="true"
    :model="pageInfo"
    class="demo-form-inline"
    label-width="120px"
  >
  <el-row :gutter="20">
    <el-col :span="10">
      <el-form-item label="모델 명">
        <el-input
          v-model="pageInfo.agntModelNm"
          placeholder="모델 명을 입력하세요."
          @keydown.enter.prevent="getUsableStateAgentList(1)" />
      </el-form-item>
    </el-col>
    <el-col :span="14">
      <el-form-item label="검색어">
        <div class="inline-area">
          <el-select v-model="pageInfo.searchType" placeholder="선택" class="w35">
            <el-option label="대리인 명" value="1" />
            <el-option label="대리인 ID" value="2" />
          </el-select>
          <el-input class="ml15"
            v-model="pageInfo.searchWord"
            placeholder="검색어를 입력하세요."
            @keyup.enter="getUsableStateAgentList(1)" />
          </div>
        </el-form-item>      
      </el-col>
    </el-row>
  </el-form>
  <div class="btnSec taR">
    <el-button type="primary" @click="getUsableStateAgentList(1)">검색</el-button>
    <el-button type="default" @click="refresh">초기화</el-button>
  </div>
</template>
<script setup>
import { reactive, defineEmits } from "vue";
const emits = defineEmits(["searchAgent"]);

const pageInfo = reactive({
  medataSetSttusMtcd: "use",
  agntModelNm: "",
  searchType: "1",
  searchWord: "",    
});

const getUsableStateAgentList = (data) => {
  emits("searchAgent", {
    curPage: data,
    pageInfo,
  });
};

const refresh = () => {
  pageInfo.medataSetSttusMtcd = "use";
  pageInfo.agntModelNm = "";
  pageInfo.searchType = "1";
  pageInfo.searchWord = "";      
};

</script>
<style lang="scss"></style>
  