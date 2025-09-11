<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>메타데이터 프라퍼티 검색</h3>
      <div class="btnSec taR">
          <el-button type="default" @click="refresh">초기화</el-button>
          <el-button type="primary" @click="getPropertyList(1)">검색</el-button>
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
                  v-model="pageInfo.prptyDataSttusMtcd"
                  @change="changeCd"
                  placeholder="전체"
                >
                  <el-option label="전체" value="" />
                  <el-option
                    v-for="item in dataStatusCdList"
                    :key="item.mtcdNm"
                    :label="item.mtcdNm"
                    :value="item.mtcd"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="프라퍼티 명">
                <el-input
                  class="w-auto m-2"
                  v-model="pageInfo.searchName"
                  placeholder="검색어를 입력하세요."
                  @keydown.enter.prevent="getPropertyList(1)"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="도메인 모델">
                <el-select
                  v-model="pageInfo.domnModelId"
                  @change="changeDomainModelId"
                  placeholder="전체"
                >
                  <el-option label="전체" value="" />
                  <el-option
                    v-for="item in domainModelList"
                    :key="item.modelNm"
                    :label="`${item.modelNm} ${item.modelLogicNm}`"
                    :value="item.modelNm"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="범위 모델">
                <div class="inline-area">
                  <el-input style="width: 250px;" v-model="pageInfo.rangeModelId" disabled	/>
                  <el-button type="default" class="ml15" @click="dialogVisibleModelSearch = true"><el-icon class="icon icon-search"/></el-button>
                  <el-button type="default" class="el-button--delete" @click="refreshRangeModel"><el-icon class="icon icon-refresh"/></el-button>
                </div>				
                <el-dialog v-model="dialogVisibleModelSearch" title="범위 모델 검색">
                  <MetaDataModelSearchPage
                    :searchSttusCd="searchSttusCd"
                    :searchMode="searchMode"
                    @selectedRow="selectedRangeModel"
                  /> 
                </el-dialog>	
              </el-form-item>
            </el-col>
            <el-col :span="12">
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
  </div>
</template>
<script setup>
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";
import { ref, reactive } from "vue";

const dialogVisibleModelSearch = ref(false);
const searchSttusCd = "";
const searchMode = "range";

const emits = defineEmits(["searchPropertyList"]);
const props = defineProps({
  dataStatusCdList: {
    type: Array,
    required: false,
  },
  domainModelList: {
    type: Array,
    required: false,
  },
});

const pageInfo = reactive({
  searchAmdStDt: "",
  searchAmdEdDt: "",
  searchName: "",
  prptyDataSttusMtcd: "",
  domnModelId: "",
  rangeModelId: ""
});

const getPropertyList = (data) => {
  emits("searchPropertyList", {
    curPage: data,
    pageInfo,
  });
};

const changeCd = (data) => {
  pageInfo.prptyDataSttusMtcd = data;
};
const changeDomainModelId = (data) => {
  pageInfo.domnModelId = data;
};

const refresh = () => {
  pageInfo.searchAmdStDt = "";
  pageInfo.searchAmdEdDt = "";
  pageInfo.searchName = "";
  pageInfo.prptyDataSttusMtcd = "";
  pageInfo.domnModelId = "";
  pageInfo.rangeModelId = "";
};

const disabledDate1 = (time) => {
  if (pageInfo.searchAmdEdDt == null || pageInfo.searchAmdEdDt == "")
    return (pageInfo.searchAmdEdDt = "");
  else return time.getTime() > new Date(pageInfo.searchAmdEdDt);
};
const disabledDate2 = (time) => {
  let searchAmdStDt = new Date(pageInfo.searchAmdStDt);
  new Date(searchAmdStDt.setDate(searchAmdStDt.getDate() - 1));
  return (
    time.getTime() < new Date(searchAmdStDt.setDate(searchAmdStDt.getDate()))
  );
};

const selectedRangeModel = (payload) => {
	pageInfo.rangeModelId=payload.rowData.modelId;
	dialogVisibleModelSearch.value = false;
};

const refreshRangeModel = () => {
  pageInfo.rangeModelId = "";
};
</script>