<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>FAQ 검색</h3>
      <div class="btnSec taR">
        <el-button type="primary" @click="getFaqList(1)">검색</el-button>
        <!-- <el-button type="default" @click="refresh">초기화</el-button> -->
      </div>
    </div>
    <div class="boxCnt">

      <el-form
        :inline="true"
        :model="pageInfo"
        class="demo-form-inline"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-form-item label="검색어">
            <div class="inline-area">
              <el-select v-model="pageInfo.searchType" placeholder="전체" style="width: 230px">
                <el-option label="전체" value="0" /><!-- 전체(제목/작성자) -->
                <el-option label="제목" value="1" />
                <el-option label="작성자" value="2" />
              </el-select>
              <el-input
                class="w-50 ml15"
                v-model="pageInfo.searchWord"
                placeholder="검색어를 입력하세요."
                @keyup.enter="getFaqList(1)" />
            </div>
          </el-form-item>

          <el-form-item label="등록일">
            <div class="inline-area">
              <div class="demo-date-picker">
                <el-date-picker
                  v-model="pageInfo.fromDate"
                  type="date"
                  placeholder="시작일"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disabledDate1"
                  style="width: 150px !important;"
                />
              </div>
              <div class="date-picker-tilde">~</div>
              <div class="demo-date-picker">
                <el-date-picker
                  v-model="pageInfo.toDate"
                  type="date"
                  placeholder="종료일"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disabledDate2"
                  style="width: 150px !important;"
                  @change="changeDate"
                />
              </div>
            </div>
          </el-form-item>
        </el-row>
      </el-form>

      <!-- <div class="btnSec taR">
        <el-button type="primary" @click="getFaqList(1)">검색</el-button>
      </div> -->

    </div>
  </div>
</template>
<script setup>
import { reactive, defineEmits } from "vue";
const emits = defineEmits(["searchFaq"]);

const pageInfo = reactive({
  searchType: "0",
  searchWord: "",
  fromDate: "",
  toDate: "",
});
const disabledDate1 = (time) => {
  if (pageInfo.toDate == null || pageInfo.toDate == "")
    return (pageInfo.toDate = "");
  else return time.getTime() > new Date(pageInfo.toDate);
};
const disabledDate2 = (time) => {
  return time.getTime() < new Date(pageInfo.fromDate);
};

const changeDate = () => {
  if (pageInfo.toDate == null) {
    pageInfo.toDate = "";
  }
  if (pageInfo.fromDate == null) {
    pageInfo.fromDate = "";
  }
};

const getFaqList = (data) => {
  emits("searchFaq", {
    curPage: data,
    pageInfo,
  });
};
</script>