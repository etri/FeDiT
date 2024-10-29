<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>식별체계 코드 검색</h3>
      <div class="btnSec taR">
          <el-button type="primary" @click="getIdSchemeCodeList(1)"
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
            <el-col :span="10" v-show="idSchmType === '01' || idSchmType === '02'">
              <el-form-item label="대분류">
                <el-select v-model="pageInfo.lctgExtrCd" placeholder="선택" style="width: 200%">
                  <el-option label="전체" value="" />
                  <el-option
                  v-for="item in lctgCodeList"
                  :key="item.lctgExtrCd"
                  :label="`[${item.lctgExtrCd}] ${item.idSchmCdNm}`"
                  :value="item.lctgExtrCd"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="14">
              <el-form-item label="검색어">
                <div class="inline-area">
                  <el-select v-model="pageInfo.searchType" placeholder="선택" class="w40">
                    <el-option label="코드 명" value="1" />
                    <el-option label="코드" value="2" />
                  </el-select>
                  <el-input
                    class="w-auto ml5 m-2"
                    v-model="pageInfo.searchWord"
                    placeholder="검색어를 입력하세요."
                    @keydown.enter.prevent="getIdSchemeCodeList(1)"
                  />
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, toRefs, watch } from "vue";

const emits = defineEmits(["searchMetaDataModelList"]);
const props = defineProps({
  idSchmType: {
    type: String,
    required: false,
  },
  lctgCodeList: {
    type: Array,
    required: false,
  },
});

const propsRefs = toRefs(props);
watch(
  [propsRefs.idSchmType],
  () => {
    pageInfo.lctgExtrCd = "";
    pageInfo.searchType = "1";
    pageInfo.searchWord = "";
  }
);

const pageInfo = reactive({
  lctgExtrCd: "",
  searchType: "1",
  searchWord: "",
});

const getIdSchemeCodeList = (data) => {
  emits("searchIdSchemeCodeList", {
    curPage: data,
    pageInfo,
  });
};

</script>