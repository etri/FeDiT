<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>메타데이터 모델 검색</h3>
      <div class="btnSec taR">
          <el-button type="primary" @click="getMetaDataModelList(1)"
            >검색</el-button
          >
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
            <el-col :span="10">
              <el-form-item label="상태">
                <el-select
                  v-bind:disabled="searchSttusCd == 'use'"
                  v-model="pageInfo.modelDataSttusMtcd"
                  @change="changeCd"
                  placeholder="선택"
                >
                  <el-option label="전체" value="all" />
                  <el-option
                    v-for="item in dataStatusCdList"
                    :key="item.mtcd"
                    :label="item.mtcdNm"
                    :value="item.mtcd"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="14">
              <el-form-item label="모델 명">
                <el-input
                  class="w-auto m-2"
                  v-model="pageInfo.searchName"
                  placeholder="검색어를 입력하세요."
                  @keydown.enter.prevent="getMetaDataModelList(1)"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from "vue";

const emits = defineEmits(["searchMetaDataModelList"]);
const props = defineProps({
  dataStatusCdList: {
    type: Array,
    required: false,
  },
  searchMode: {
    type: String,
    required: false,
  },
  searchSttusCd: {
    type: String,
    required: false,
  },
  typeModelId: {
    type: String,
    required: false,
  },
});

const pageInfo = reactive({
  searchMode: props.searchMode,
  searchName: "",
  typeModelId: props.typeModelId,
  modelDataSttusMtcd: props.searchSttusCd,
});

const getMetaDataModelList = (data) => {
  emits("searchMetaDataModelList", {
    curPage: data,
    pageInfo,
  });
};

const changeCd = (data) => {
  pageInfo.modelDataSttusMtcd = data;
};
</script>