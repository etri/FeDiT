<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>메타데이터 셋 검색</h3>
      <div class="btnSec taR">
        <el-button type="primary" @click="getMetadataSetList(1)">검색</el-button>
      </div>
    </div>

    <div class="boxCnt">
      <el-form label-position="left"
        :inline="true"
        :model="pageInfo"
        class="demo-form-inline search-form"
        label-width="130px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="메타데이터 상태">
              <el-select
                v-model="pageInfo.medataSetSttusMtcd"
                v-bind:disabled="searchSttusCd == 'use'"
                @change="changeCd"
                placeholder="전체"
              >
                <el-option label="전체" value="" />
                <el-option
                  v-for="item in dataStatusCdList"
                  :key="item.mtcd"
                  :label="item.mtcdNm"
                  :value="item.mtcd"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="메타데이터 유형">
              <el-select
                v-model="pageInfo.typeModelId"
                v-if="!searchMetaTypeFix"
                @change="changeTypeModelId"
                placeholder="전체"
              >
                <el-option label="전체" value="" />
                <el-option
                  v-for="item in typeModelList"
                  :key="item.modelId"
                  :label="`${item.modelNm} ${item.modelLogicNm}`"
                  :value="item.modelId"
                />
              </el-select>
              <el-select
                v-model="pageInfo.typeModelId"
                v-else
                disabled
                @change="changeTypeModelId"
                placeholder="전체"
              >
                <el-option label="전체" value="" />
                <el-option
                  v-for="item in typeModelList"
                  :key="item.modelId"
                  :label="`${item.modelNm} ${item.modelLogicNm}`"
                  :value="item.modelId"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="메타데이터 셋 명">
              <el-input
                class="w-auto m-2"
                v-model="pageInfo.srchText"
                placeholder=""
                @keydown.enter.prevent="getMetadataSetList(1)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="메타데이터 모델명">
              <el-input
                class="w-auto m-2"
                v-model="pageInfo.srchModelNm"
                placeholder=""
                @keydown.enter.prevent="getMetadataSetList(1)"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, watch, onMounted } from "vue";

const emits = defineEmits(["searchMetadataSetList"]);

const props = defineProps({
  dataStatusCdList: {
    type: Array,
    required: false,
  },
  typeModelList: {
    type: Array,
    required: false,
  },
  searchSttusCd: {
    type: String,
    required: false,
  },
  searchMode: {
    type: String,
    required: false,
  },
  modelId: {
    type: String,
    required: false,
  },
  typeModelId: {
    type: String,
    required: false,
  },
  searchMetaTypeFix: {
    type: Boolean,
    required: false,
  },
  searchMetaTypeId: {
    type: String,
    required: false,
  },
  srchModelNm: {
    type: String,
    required: false,
    default: "",
  },
});

onMounted(() => {
  pageInfo.typeModelId = props.searchMetaTypeId;
  pageInfo.modelId = props.modelId;
  pageInfo.medataSetSttusMtcd = props.searchSttusCd;
  pageInfo.srchModelNm = props.srchModelNm;
});

watch(
  () => props.searchMetaTypeId,
  () => {
    pageInfo.typeModelId = props.searchMetaTypeId;
  }
);

const pageInfo = reactive({
  typeModelId: props.typeModelId,
  modelId: props.modelId,
  medataSetSttusMtcd: props.searchSttusCd,
  srchModelNm: props.srchModelNm,
  srchText: "",
});

const getMetadataSetList = (data) => {
  emits("searchMetadataSetList", { curPage: data, pageInfo });
};

const changeCd = (data) => {
  pageInfo.medataSetSttusMtcd = data;
};

const changeTypeModelId = (data) => {
  pageInfo.typeModelId = data;
};
</script>
<style lang="scss"></style>