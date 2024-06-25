<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>그룹 검색</h3>
      <div class="btnSec taR">
        <el-button class="el-button--gray" size="small" :icon="Refresh" @click="resetSearchForm()">초기화</el-button>
        <el-button type="primary" size="small" @click="getGroupList(1)">검색</el-button>
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
          <el-col :span="6">
            <el-form-item label="그룹 명">
              <el-input
                v-model="pageInfo.grpNm"
                placeholder="검색할 그룹 명을 입력하세요."
                @keydown.enter="getGroupList(1)" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import { useStore } from "vuex";
import { getGlobalProperties } from "@/assets/js/common.js";
import { ref, defineEmits } from "vue";

const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const emits = defineEmits(["searchGroup"]);

const pageInfo = ref({
  grpNm: "",
});

const getGroupList = (data) => {
  console.log(pageInfo);

  emits("searchGroup", {
    curPage: data,
    grpNm: pageInfo.value.grpNm,
  });
};

const resetSearchForm = () => {
  pageInfo.value = {};
  getGroupList();
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
