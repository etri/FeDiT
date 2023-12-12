<template>
  <div>
    <el-form
      :inline="true"
      :model="pageInfo"
      class="demo-form-inline"
      label-width="120px"
    >
      <el-form-item label="검색어" v-if="searchWordVisibleYn">
        <el-row :gutter="20">
          <el-col :span="9">
            <el-select v-model="pageInfo.searchType" placeholder="선택">
              <el-option label="선택" value="0" />
              <el-option label="제목" value="1" />
              <el-option label="작성자" value="2" />
            </el-select>
          </el-col>
          <el-col :span="11">
            <el-input
              class="w-50 m-2"
              v-model="pageInfo.searchWord"
              placeholder="검색어를 입력하세요."
              @keyup.enter="getOpernoticeList(1)" /></el-col
        ></el-row>
      </el-form-item>
      <el-form-item label="제목" v-if="!searchWordVisibleYn">
        <el-row :gutter="20">
          <el-col :span="20">
            <el-input
              class="w-50 m-2"
              v-model="pageInfo.qnaTitle"
              placeholder="제목을 입력하세요."
              @keyup.enter="getOpernoticeList(1)" /></el-col
        ></el-row>
      </el-form-item>
      <el-form-item label="등록일">
        <el-row :gutter="20">
          <el-col :span="11">
            <div class="demo-date-picker">
              <div class="block">
                <el-date-picker
                  v-model="pageInfo.fromDate"
                  type="date"
                  placeholder="시작일"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disabledDate1"
                  style="width: 150px"
                />
              </div>
            </div>
          </el-col>
          <el-col :span="1"><span>~</span></el-col>
          <el-col :span="8">
            <div class="demo-date-picker">
              <div class="block">
                <el-date-picker
                  v-model="pageInfo.toDate"
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
            <el-select v-model="pageInfo.sttusCd" placeholder="선택">
              <el-option label="전체" value="0" />
              <el-option
                v-for="item in qnaCode"
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
      <el-button type="primary" @click="getOpernoticeList(1)">검색</el-button>
    </div>
  </div>
</template>
<script setup>
import { reactive, defineEmits, defineProps } from "vue";

const emits = defineEmits(["searchQna"]);
const props = defineProps({
  qnaCode: {
    type: Array,
    required: true,
  },
  searchWordVisibleYn: {
    // 마이페이지 / 내 문의 내역에서는 보이지 않도록 설정
    type: Boolean,
    default: true,
  },
});

const pageInfo = reactive({
  searchType: "0",
  searchWord: "",
  prevNtfYn: "",
  fromDate: "",
  toDate: "",
  sttusCd: "",
  qnaTitle:
    "" /** '내 문의 내역'에서는 검색어 콤보 박스가 아닌 '제목' 필드만 표시  */,
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

const getOpernoticeList = (data) => {
  emits("searchQna", {
    curPage: data,
    pageInfo,
  });
};
</script>
<style lang="scss"></style>
