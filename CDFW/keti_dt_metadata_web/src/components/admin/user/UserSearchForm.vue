<template>
  <div>
    <el-form
      :inline="true"
      :model="pageInfo"
      class="demo-form-inline"
      label-width="120px"
      onsubmit="return false"
    >
      <el-form-item label="검색어">
        <el-row :gutter="20">
          <el-col :span="9">
            <el-select v-model="pageInfo.searchType" placeholder="선택">
              <el-option label="선택" value="0" />
              <el-option label="사용자 ID" value="1" />
              <el-option label="사용자명" value="2" />
              <el-option label="이메일" value="3" />
              <el-option label="전화번호" value="4" />
            </el-select>
          </el-col>
          <el-col :span="11">
            <el-input
              class="w-50 m-2"
              v-model="pageInfo.searchWord"
              placeholder="검색어를 입력하세요."
              @keyup.enter="getUserList(1)" /></el-col
        ></el-row>
      </el-form-item>
    </el-form>

    <div class="btnSec taR">
      <el-button type="primary" @click="getUserList(1)">검색</el-button>
    </div>
  </div>
</template>
<script setup>
import { ref, defineEmits } from "vue";
const emits = defineEmits(["searchUser"]);

const pageInfo = ref({
  searchType: "0",
  searchWord: "",
});

const getUserList = (data) => {
  emits("searchUser", {
    curPage: data,
    searchType: pageInfo.value.searchType,
    searchWord: pageInfo.value.searchWord,
  });
};
</script>
<style lang="scss"></style>
