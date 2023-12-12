<template>
  <div>
    <el-form
      :inline="true"
      :model="pageInfo"
      class="demo-form-inline"
      label-width="120px"
    >
      <el-form-item label="검색어">
        <el-row :gutter="20">
          <el-col :span="9">
            <el-select v-model="pageInfo.searchType" placeholder="선택">
              <el-option label="선택" value="0" />
              <el-option label="API 그룹명" value="1" />
              <el-option label="플랫폼 아이디" value="2" />
            </el-select>
          </el-col>
          <el-col :span="11">
            <el-input
              class="w-50 m-2"
              v-model="pageInfo.searchWord"
              placeholder="검색어를 입력하세요."
              @keyup.enter="getApiGroupList(1)" /></el-col
        ></el-row>
      </el-form-item>

      <el-form-item label="사용여부">
        <el-row :gutter="20">
          <el-col :span="17">
            <el-select v-model="pageInfo.searchUseYn" placeholder="선택">
              <el-option label="선택" value="0" />
              <el-option label="사용" value="1" />
              <el-option label="미사용" value="2" />
            </el-select>
          </el-col>
        </el-row>
      </el-form-item>
    </el-form>
    <div class="btnSec taR">
      <el-button type="primary" @click="getApiGroupList(1)">검색</el-button>
    </div>
  </div>
</template>
<script setup>
import { ref, defineEmits } from "vue";
const emits = defineEmits(["searchApigroup"]);

const pageInfo = ref({
  searchType: "0",
  searchWord: "",
  searchUseYn: "0",
});

const getApiGroupList = (data) => {
  emits("searchApigroup", {
    curPage: data,
    pageInfo,
  });
};
</script>
<style lang=""></style>
