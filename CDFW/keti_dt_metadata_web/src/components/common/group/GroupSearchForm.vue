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
              <el-option label="그룹명" value="1" />
              <el-option label="설명" value="2" />
            </el-select>
          </el-col>
          <el-col :span="11">
            <el-input
              class="w-50 m-2"
              v-model="pageInfo.searchWord"
              placeholder="검색어를 입력하세요."
              @keyup.enter="getGroupList(1)" /></el-col
        ></el-row>
      </el-form-item>
    </el-form>
    <div class="btnSec taR">
      <el-button type="primary" @click="getGroupList(1)">검색</el-button>
    </div>
  </div>
</template>
<script setup>
import { useStore } from "vuex";
import { getGlobalProperties } from "@/assets/js/common.js";
import { ref, defineEmits } from "vue";
const emits = defineEmits(["searchGroup"]);
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const pageInfo = ref({
  searchWord: "",
  searchType: "0",
});

const getGroupList = (data) => {
  console.log(pageInfo);

  emits("searchGroup", {
    curPage: data, pageInfo
  });
};

</script>
<style lang="scss"></style>
