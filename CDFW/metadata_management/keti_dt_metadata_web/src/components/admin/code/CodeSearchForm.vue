<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>코드그룹 검색</h3>
      <div class="btnSec taR">
        <el-button class="el-button--gray" size="small" :icon="Refresh" @click="resetSearchForm()">초기화</el-button>
        <el-button type="primary" size="small" @click="getCodeGroupList(1)">검색</el-button>
      </div>
    </div>
    <div class="boxCnt">
      <el-form
        :inline="true"
        :model="pageInfo"
        class="demo-form-inline"
        label-width="120px"
      >
      <el-row :gutter="10">
        <el-col :span="5">
          <el-form-item label="코드 그룹 명">
            <el-input
              v-model="pageInfo.grpNm"
              placeholder="검색할 코드 그룹 명을 입력하세요."
              @keydown.enter="getCodeGroupList(1)" />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="코드 그룹 값">
            <el-input
              v-model="pageInfo.grpVal"
              placeholder="검색할 코드 그룹 값을 입력하세요."
              @keydown.enter="getCodeGroupList(1)" />
          </el-form-item>
        </el-col>
      </el-row>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import { ref, defineEmits } from "vue";
const emits = defineEmits(["searchCodegroup"]);

const pageInfo = ref({
  grpNm: "",
  grpVal: "",
});

const getCodeGroupList = (data) => {
  emits("searchCodegroup", {
    curPage: data,
    grpNm: pageInfo.value.grpNm,
    grpVal: pageInfo.value.grpVal,
  });
};

const resetSearchForm = () => {
  pageInfo.value = {};
  getCodeGroupList();
};

</script>
<style lang="scss" scoped>
.demo-form-inline {
  overflow:hidden;
  display:flex;
  .el-row {
    width:100%;
    .el-form-item {
      width: 100% !important;
    }
  }
}
</style>
