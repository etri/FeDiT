<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>메타데이터 유형 모델 검색</h3>
       <div class="btnSec taR">
          <el-button type="default" @click="refresh">초기화</el-button>
          <el-button type="primary" @click="getTypeModelList(1)">검색</el-button>
        </div>
    </div>
    <div class="boxCnt">
      <div>
        <el-form label-position="left"
          :inline="true"
          :model="pageInfo"
          class="demo-form-inline search-form"
          label-width="200px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="수정일">
                <div class="inline-area">
                  <div class="demo-date-picker">
                    <div class="block">
                      <el-date-picker
                        v-model="pageInfo.searchAmdStDt"
                        type="date"
                        placeholder="시작일"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                        :disabled-date="disabledDate1"
                      />
                    </div>
                  </div>
                  <div class="date-picker-tilde">~</div>
                  <div class="demo-date-picker">
                    <div class="block">
                      <el-date-picker
                        v-model="pageInfo.searchAmdEdDt"
                        type="date"
                        placeholder="종료일"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                        :disabled-date="disabledDate2"
                      />
                    </div>
                  </div>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="데이터 상태">
                <el-select
                  v-model="pageInfo.modelDataSttusMtcd"
                  @change="changeCd"
                  placeholder="선택"
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
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="유형모델 명">
                <el-input
                  class="w-auto m-2"
                  v-model="pageInfo.searchName"
                  placeholder="검색어를 입력하세요."
                  @keydown.enter.prevent="getTypeModelList(1)"
                />
              </el-form-item>
            </el-col>
            <!-- 2023-07-27 정형모델 사용안함 
        <el-col :span="12">
          <el-form-item label="정형 모델 여부">
            <el-select 
              v-model="pageInfo.structdModelYn"
              @change="changeStructdModelYn"
              placeholder="선택">
              <el-option label="Y" value="Y"/>
              <el-option label="N" value="N"/>
            </el-select>
          </el-form-item>
        </el-col>
        -->
          </el-row>
        </el-form>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive } from "vue";

const emits = defineEmits(["searchTypeModelList"]);
const props = defineProps({
  dataStatusCdList: {
    type: Array,
    required: false,
  },
});

const pageInfo = reactive({
  searchMode: "type",
  modelDataSttusMtcd: "",
  searchAmdStDt: "",
  searchAmdEdDt: "",
  searchName: "",
  structdModelYn: "",
});

const getTypeModelList = (data) => {
  emits("searchTypeModelList", {
    curPage: data,
    pageInfo,
  });
};

const changeCd = (data) => {
  pageInfo.modelDataSttusMtcd = data;
};
const changeStructdModelYn = (data) => {
  pageInfo.structdModelYn = data;
};

const refresh = () => {
  pageInfo.searchAmdStDt = "";
  pageInfo.searchAmdEdDt = "";
  pageInfo.searchName = "";
  pageInfo.modelDataSttusMtcd = "";
  pageInfo.structdModelYn = "";
  getTypeModelList();
};

const disabledDate1 = (time) => {
  if (pageInfo.searchAmdEdDt == null || pageInfo.searchAmdEdDt == "")
    return (pageInfo.searchAmdEdDt = "");
  else return time.getTime() > new Date(pageInfo.searchAmdEdDt);
};
const disabledDate2 = (time) => {
  //시작일과 동일 날짜도 종료 검색일로 지정할 수 있게끔 설정 (meta 관련 검색)
  let searchAmdStDt = new Date(pageInfo.searchAmdStDt);
  new Date(searchAmdStDt.setDate(searchAmdStDt.getDate() - 1)); //지정날짜에서 - 1 day
  return (
    time.getTime() < new Date(searchAmdStDt.setDate(searchAmdStDt.getDate()))
  );
};
</script>