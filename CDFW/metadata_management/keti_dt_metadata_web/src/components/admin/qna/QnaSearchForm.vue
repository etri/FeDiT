<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>QNA 검색</h3>
      <div class="btnSec taR">
        <el-button type="primary" @click="getQnaList(1)">검색</el-button>
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
          <el-form-item label="검색어" v-if="searchWordVisibleYn">
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
                @keyup.enter="getQnaList(1)" />
            </div>
          </el-form-item>

          <el-form-item label="제목" v-if="!searchWordVisibleYn">
            <el-input
              class="w-50 m-2"
              v-model="pageInfo.qnaTitle"
              placeholder="제목을 입력하세요."
              @keyup.enter="getQnaList(1)" />
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
          <el-form-item label="구분">
            <el-select v-model="pageInfo.sttusCd" placeholder="전체">
              <el-option label="전체" value="0" />
              <el-option
                v-for="item in qnaCode"
                :key="item.cdId"
                :label="item.cdNm"
                :value="item.cdId"
              />
            </el-select>
          </el-form-item>
        </el-row>
      </el-form>

      <!-- <div class="btnSec taR">
        <el-button type="primary" @click="getQnaList(1)">검색</el-button>
      </div> -->

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
  sttusCd: "0",
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

const getQnaList = (data) => {
  emits("searchQna", {
    curPage: data,
    pageInfo,
  });
};
</script>
