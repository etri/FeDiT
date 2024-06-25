<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>메타데이터 코드 관리</h3>
      <div class="btnSec taR">
        <el-button type="default" @click="refresh">초기화</el-button>
        <el-button type="primary" @click="getMetaCodeGroupList(1)">검색</el-button>
      </div>
    </div>
    <div class="boxCnt">
      <div>
        <el-form label-position="left"
          :inline="true"
          :model="pageInfo"
          class="demo-form-inline"
          label-width="120px"
        >
          <el-row :gutter="20">
            <!-- <el-col :span="12"> -->
              <el-form-item label="코드그룹 ID">            
                <el-input
                  class="w-50 m-2"
                  v-model="pageInfo.mtcdGrpId"
                  placeholder=""
                  @keydown.enter.prevent="getMetaCodeGroupList(1)"
                />
              </el-form-item>
            <!-- </el-col>
            <el-col :span="12"> -->
              <el-form-item label="코드">
                <el-input
                    class="w-50 m-2"
                    v-model="pageInfo.mtcd"
                    placeholder=""
                    @keydown.enter.prevent="getMetaCodeGroupList(1)"
                  />
              </el-form-item>
            <!-- </el-col> -->
          </el-row>          
          <el-row :gutter="20">
            <!-- <el-col :span="12"> -->
              <el-form-item label="코드그룹 명">
                <el-input
                  class="w-50 m-2"
                  v-model="pageInfo.mtcdGrpNm"
                  placeholder=""
                  @keydown.enter.prevent="getMetaCodeGroupList(1)"
                />
              </el-form-item>
            <!-- </el-col>
            <el-col :span="12"> -->
              <el-form-item label="코드 명">
                <el-input
                  class="w-50 m-2"
                  v-model="pageInfo.mtcdNm"
                  placeholder=""
                  @keydown.enter.prevent="getMetaCodeGroupList(1)"
                />
              </el-form-item>
            <!-- </el-col> -->
          </el-row>
        </el-form>
      </div>
    </div>
  </div>
</template>
<script setup>
import { reactive, defineEmits } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";

const emits = defineEmits(["searchMetaCodeGroup"]);
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const pageInfo = reactive({
  mtcdGrpId: "",
  mtcd: "",
  mtcdGrpNm: "",
  mtcdNm: "",
});

const getMetaCodeGroupList = (data) => {
  emits("searchMetaCodeGroup", {
    curPage: data,
    pageInfo,
  });
};

const refresh = () => {
  pageInfo.mtcdGrpId = "";
  pageInfo.mtcd = "";
  pageInfo.mtcdGrpNm = "";
  pageInfo.mtcdNm = "";
};
</script>
<style lang=""></style>