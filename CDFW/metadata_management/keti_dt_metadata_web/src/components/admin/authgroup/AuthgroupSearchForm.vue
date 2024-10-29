<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>권한 검색</h3>
      <div class="btnSec taR">
        <el-button class="el-button--gray" size="small" :icon="Refresh" @click="resetSearchForm()">초기화</el-button>
        <el-button type="primary" size="small" @click="getAuthGroupList(1)">검색</el-button>
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
          <el-form-item label="권한 명">
            <el-input
              v-model="pageInfo.autName"
              placeholder="검색할 권한 명을 입력하세요."
              @keydown.enter="getAuthGroupList(1)" />
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
        <el-col :span="3">
          <el-form-item label="구분">
            <el-select
              v-model="pageInfo.typeCdNm"
              @change="changeTypeCd"
              placeholder="선택"
            >
              <el-option label="선택" value="0" />
              <el-option
                v-for="item in typeCdList"
                :key="item.cdId"
                :label="item.cdNm"
                :value="item.cdId"
              />
            </el-select>
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
import { ref, defineEmits, onMounted } from "vue";
const emits = defineEmits(["searchAuthgroup"]);
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const pageInfo = ref({
  autName: "",
  searchUseYn: "0",
  searchType: "0",
  typeCdNm: "0",
  typeCd: "",
});

onMounted(() => {
  getCodeList();
});

const typeCdList = ref([]);

const getCodeList = async () => {
  await store.dispatch("CodeStore/getCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      grpIdList: ["CGR00001"],
    },
  });

  const List = store.getters["CodeStore/getStoreCodeList"]("CGR00001");
  console.log(List);
  typeCdList.value = List;
};

const getAuthGroupList = (data) => {
  console.log(pageInfo);

  emits("searchAuthgroup", {
    curPage: data, pageInfo
  });
};

const resetSearchForm = () => {
  pageInfo.value = {};
  getAuthGroupList();
};

const changeTypeCd = (data) => {
  pageInfo.value.typeCd = data;
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
