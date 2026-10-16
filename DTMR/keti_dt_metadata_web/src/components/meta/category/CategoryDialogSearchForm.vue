<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>카테고리 검색</h3>
	    <div class="btnSec taR">
        <el-button type="default" @click="refresh">초기화</el-button>				
        <el-button type="primary" @click="getUsableStateCategoryList(1)">검색</el-button>
      </div>
    </div>
    <div class="boxCnt">
      <el-form label-position="left"
        :inline="true"
        :model="pageInfo"
        class="demo-form-inline search-form"
        label-width="160px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="상위 카테고리">
              <div class="inline-area">
                <el-select v-model="pageInfo.searchUpcdType" placeholder="선택" style="width: 140px;">
                  <el-option label="상위 카테고리 명" value="1" />
                  <el-option label="상위 카테고리 ID" value="2" />
                </el-select>
                <el-input
                  class="ml15"
                  v-model="pageInfo.searchUpcdWord"
                  placeholder="검색어를 입력하세요."
                  @keyup.enter="getUsableStateCategoryList(1)"
                />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="검색어">
              <div class="inline-area">
                <el-select v-model="pageInfo.searchType" placeholder="선택" style="width: 140px;">
                  <el-option label="카테고리 명" value="1" />
                  <el-option label="카테고리 ID" value="2" />
                  <el-option label="카테고리 RDF 개념명" value="3" />
                </el-select>
                <el-input
                  class="ml15"
                  v-model="pageInfo.searchWord"
                  placeholder="검색어를 입력하세요."
                  @keyup.enter="getUsableStateCategoryList(1)"
                />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

    </div>
  </div>
</template>
<script setup>
import { reactive, defineEmits } from "vue";

const emits = defineEmits(["searchCategory"]);

const pageInfo = reactive({
  upCtgryId: "",
  ctgryId: "",
  ctgryMappgCd: "",
  searchType: "1",
  searchWord: "",
  searchUpcdType: "1",
  searchUpcdWord: "",
});

const getUsableStateCategoryList = (data) => {
  emits("searchCategory", {
    curPage: data,
    pageInfo,
  });
};

const refresh = () => {
  pageInfo.upCtgryId = "";
  pageInfo.ctgryId = "";
  pageInfo.ctgryMappgCd = "";
  pageInfo.searchType = "1";
  pageInfo.searchWord = "";
  pageInfo.searchUpcdType = "1";
  pageInfo.searchUpcdWord = "";
};
</script>
<style lang="scss"></style>