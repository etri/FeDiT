<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>API그룹 검색</h3>
      <div class="btnSec taR">
        <el-button class="el-button--gray" size="small" :icon="Refresh" @click="resetSearchForm()">초기화</el-button>
        <el-button type="primary" size="small" @click="getApiGroupList(1)">검색</el-button>
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
          <el-col :span="10">
            <el-form-item label="API 그룹 명">
                <el-input
                  v-model="pageInfo.grpName"
                  placeholder="검색할 API 그룹 명을 입력하세요."
                  @keydown.enter="getApiGroupList(1)" />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="플랫폼 ID">
                <el-input
                  v-model="pageInfo.pltfrmId"
                  placeholder="검색할 플랫폼 ID를 입력하세요."
                  @keydown.enter="getApiGroupList(1)" />
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="사용여부">
              <el-select v-model="pageInfo.searchUseYn" placeholder="선택">
                <el-option label="선택" value="0" />
                <el-option label="사용" value="1" />
                <el-option label="미사용" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import { ref, defineEmits } from "vue";
const emits = defineEmits(["searchApigroup"]);

const pageInfo = ref({
  pltfrmId: "",
  grpName: "",
  searchUseYn: "0",
});

const getApiGroupList = (data) => {
  emits("searchApigroup", {
    curPage: data,
    pageInfo,
  });
};

const resetSearchForm = () => {
  pageInfo.value = {};
  getApiGroupList();
};

</script>
<style lang="scss" scoped>
.demo-form-inline {
  overflow:hidden;
  display:flex;
  .el-row{
    width:100%;
    .el-form-item {
      width: 100% !important;
    }
  }
}
</style>

