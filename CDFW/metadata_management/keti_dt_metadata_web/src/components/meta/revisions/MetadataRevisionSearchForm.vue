<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>검색 조건</h3>
      <div class="btnSec taR">
        <el-button type="default" @click="refresh">초기화</el-button>
        <el-button type="primary" @click="getMetadataRevisionyList(1)">검색</el-button>
      </div>
    </div>
    <div class="boxCnt">
      <div>
        <el-form 
          label-position="left" 
          :inline="true" 
          :model="pageInfo" 
          class="demo-form-inline search-form"
          label-width="200px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="시간 범위" required>
                <div class="inline-area">
                  <div class="demo-date-picker">
                    <div class="block">
                      <el-date-picker
                        v-model="pageInfo.srchStartDd" 
                        type="date" placeholder="시작일" 
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD" 
                        :disabled-date="disabledDate1" />
                    </div>
                  </div>
                  <div class="date-picker-tilde">~</div>
                  <div class="demo-date-picker">
                    <div class="block">
                      <el-date-picker 
                        v-model="pageInfo.srchEndDd" 
                        type="date" placeholder="종료일" 
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD" 
                        :disabled-date="disabledDate2" />
                    </div>
                  </div>
                </div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="메타데이터 셋 ID">
                <el-input class="w-auto m-2" v-model="pageInfo.medataSetId" placeholder="ID를 입력하세요."
                  @keydown.enter.prevent="getMetadataRevisionyList(1)" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
  </div>
</template>
<script setup>
import { reactive, onMounted } from "vue";

const emits = defineEmits(["searchMetadataRevisionList"]);

const pageInfo = reactive({
  srchEndDd: "",
  srchStartDd: "",
  medataSetId: ""
});

onMounted(() => {
  initializeTimeRange();
  getMetadataRevisionyList();
});

const initializeTimeRange = () => {
  let startDay = new Date(new Date().setDate(new Date().getDate() -6)).toISOString().split("T")[0];
  let endDay = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0];
  pageInfo.srchStartDd = startDay;
  pageInfo.srchEndDd = endDay;
};

const getMetadataRevisionyList = (data) => {
  emits("searchMetadataRevisionList", {
    curPage: data,
    pageInfo,
  });
};

const refresh = () => {
  initializeTimeRange();
  pageInfo.medataSetId = "";
};

const disabledDate1 = (time) => {
  if (pageInfo.srchEndDd == null || pageInfo.srchEndDd == "")
    return (pageInfo.srchEndDd = "");
  else return time.getTime() > new Date(pageInfo.srchEndDd);
};
const disabledDate2 = (time) => {
  let srchStartDd = new Date(pageInfo.srchStartDd);
  new Date(srchStartDd.setDate(srchStartDd.getDate() - 1));
  return (
    time.getTime() < new Date(srchStartDd.setDate(srchStartDd.getDate()))
  );
};

</script>
<style lang="scss">
</style>