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
              <el-option label="권한명" value="1" />
              <el-option label="설명" value="2" />
            </el-select>
          </el-col>
          <el-col :span="11">
            <el-input
              class="w-50 m-2"
              v-model="pageInfo.searchWord"
              placeholder="검색어를 입력하세요."
              @keyup.enter="getAuthGroupList(1)" /></el-col
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
    <el-form
      :inline="true"
      :model="pageInfo"
      class="demo-form-inline"
      label-width="120px"
    >
      <el-form-item label="구분">
        <el-row :gutter="20">
          <el-col :span="17">
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
          </el-col>
        </el-row>
      </el-form-item>
    </el-form>
    <div class="btnSec taR">
      <el-button type="primary" @click="getAuthGroupList(1)">검색</el-button>
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
  searchWord: "",
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

const changeTypeCd = (data) => {
  pageInfo.value.typeCd = data;
};
</script>
<style lang="scss"></style>
