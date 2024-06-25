<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>카테고리 관리</h3>
      <div class="btnSec taR">
        <el-button type="primary" @click="getCategoryList(1)">검색</el-button>
        <el-button type="default" @click="refresh">초기화</el-button>
      </div>
    </div>
    <div class="boxCnt">
      <div>
        <el-form label-position="left"
          :inline="true"
          :model="pageInfo"
          class="demo-form-inline search-form"
          label-width="120px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="수정일">
                <div class="inline-area">
                  <div class="demo-date-picker">
                    <el-date-picker
                      v-model="pageInfo.srchStartDd"
                      type="date"
                      placeholder="시작일"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      :disabled-date="disabledDate1"
                      style="width: 150px"
                    />
                  </div>
                  <div class="date-picker-tilde">~</div>
                  <div class="demo-date-picker">
                    <el-date-picker
                      v-model="pageInfo.srchEndDd"
                      type="date"
                      placeholder="종료일"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      :disabled-date="disabledDate2"
                      style="width: 150px"
                      @change="changeDate"
                    />
                  </div>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="데이터 상태">
                <el-select
                  v-model="pageInfo.ctgryDataSttusMtcd"
                  @change="changeCd"
                  placeholder="선택"
                >
                  <el-option label="전체" value="" />
                  <el-option
                    v-for="item in dataStatusList"
                    :key="item.mtcd"
                    :label="item.mtcdNm"
                    :value="item.mtcd"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <ComnFormItemInput2Btns label="상위 카테고리" v-model="pageInfo.upCtgryNm"
                @click-search="dialogVisibleSearch = true" @click-refresh="refreshCategory" />

              <el-dialog v-model="dialogVisibleSearch" title="카테고리 검색">
                <CategoryDialogSearch @selectCategory="selectCategory" />
              </el-dialog>
            </el-col>       
            <el-col :span="12">
              <el-form-item label="검색어">
                <div class="inline-area">
                  <el-select v-model="pageInfo.searchType" placeholder="선택" style="width: 140px;">
                    <el-option label="카테고리 명" value="1" />
                    <el-option label="카테고리 ID" value="2" />
                    <el-option label="카테고리 RDF 개념명" value="3" />
                  </el-select>
                  <el-input
                    class="ml15"
                    v-model="pageInfo.searchWord"
                    placeholder="검색어를 입력하세요."
                    @keyup.enter="getCategoryList(1)" />
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
import CategoryDialogSearch from "@/components/meta/category/CategoryDialogSearch.vue";
import ComnFormItemInput2Btns from "@/components/common/ComnFormItemInput2Btns.vue";

import { ref, reactive, defineEmits } from "vue"; //, onMounted
import { useStore } from "vuex";
import { getGlobalProperties } from "@/assets/js/common.js";

const emits = defineEmits(["searchCategory"]);
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const dialogVisibleSearch = ref(false);

const pageInfo = reactive({
  srchStartDd: "",
  srchEndDd: "",
  searchType: "1",
  searchWord: "",
  ctgryDataSttusMtcd: "",
  ctgryNm: "",
  upCtgryId: "",
  upCtgryNm: "",
});

const props = defineProps({
  dataStatusList: {
    // 카테고리 데이터 상태코드리스트
    type: Array,
    required: false,
  },
});

const getCategoryList = (data) => {
  emits("searchCategory", {
    cusPage: data,
    pageInfo,
  });
};

const changeCd = (data) => {
  pageInfo.ctgryDataSttusMtcd = data;
};

const disabledDate1 = (time) => {
  if (pageInfo.srchEndDd == null || pageInfo.srchEndDd == "")
    return (pageInfo.srchEndDd = "");
  else return time.getTime() > new Date(pageInfo.srchEndDd);
};
const disabledDate2 = (time) => {
  //시작일과 동일 날짜도 종료 검색일로 지정할 수 있게끔 설정 (meta 관련 검색)
  let srchStartDd = new Date(pageInfo.srchStartDd);
  new Date(srchStartDd.setDate(srchStartDd.getDate() - 1)); //지정날짜에서 - 1 day
  return time.getTime() < new Date(srchStartDd.setDate(srchStartDd.getDate()));
};

const changeDate = () => {
  if (pageInfo.srchStartDd == null) {
    pageInfo.srchStartDd = "";
  }
  if (pageInfo.srchEndDd == null) {
    pageInfo.srchEndDd = "";
  }
};

const refresh = () => {
  pageInfo.srchStartDd = "";
  pageInfo.srchEndDd = "";
  pageInfo.searchType = "1";
  pageInfo.searchWord = "";
  pageInfo.ctgryDataSttusMtcd = "";
  pageInfo.ctgryNm = "";
  pageInfo.upCtgryId = "";
  pageInfo.upCtgryNm = "";
};

const refreshCategory = () => {
  pageInfo.upCtgryId = "";
  pageInfo.upCtgryNm = "";
};

const selectCategory = (payload) => {
  dialogVisibleSearch.value = false;
  pageInfo.upCtgryId = payload.data.ctgryId;
  pageInfo.upCtgryNm = payload.data.ctgryNm;
};
</script>
<style lang="scss"></style>