<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>검색 조건</h3>
      <div class="btnSec taR">
        <el-button type="primary" @click="getMetadataSetList(1)">검색</el-button>
      </div>
    </div>
    <div class="boxCnt">
      <div class="">
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
                    <div class="block">
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
                  </div>
                  <div class="date-picker-tilde">~</div>
                  <div class="demo-date-picker">
                    <div class="block">
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
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="제외 데이터">
                <el-select v-model="pageInfo.includeDisuseYn" placeholder="제외">
                  <el-option label="제외" value="" />
                  <el-option label="포함" value="Y" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="메타데이터 유형">
                <el-select
                  v-model="pageInfo.typeModelId"
                  @change="changeTypeModelId"
                >
                  <el-option label="전체" value="" />
                  <el-option
                    v-for="item in typeModelList"
                    :key="item.modelId"
                    :label="`${item.modelNm} ${item.modelLogicNm}`"
                    :value="item.modelId"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="상태">
                <el-select
                  v-model="pageInfo.medataSetSttusMtcd"
                  @change="changeCd"
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
            <el-col :span="24">
              <el-form-item label="메타데이터 모델">
                <el-input
                  v-model="props.modelId"
                  @keydown.enter.prevent="getMetadataSetList(1)"
                  style="width: 250px"
                  disabled
                />
                <el-button type="default" class="el-button--delete ml15" @click="refreshModelId"
                  ><el-icon class="icon icon-refresh"
                /></el-button>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="메타데이터 셋 명">
                <el-input
                  v-model="pageInfo.srchText"
                  placeholder=""
                  @keydown.enter.prevent="getMetadataSetList(1)"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="메타데이터 셋 ID">
                <el-input
                  v-model="pageInfo.medataSetId"
                  placeholder=""
                  @keydown.enter.prevent="getMetadataSetList(1)"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, defineEmits, defineExpose, defineProps, toRefs, watch } from "vue";

const emits = defineEmits(["searchMetadataSetList", "refreshModelId"]);

const props = defineProps({
  dataStatusList: {
    // 데이터 상태코드리스트 (MCG00001)
    type: Array,
    required: false,
  },
  typeModelList: {
    //메타데이터 모델 유형리스트
    type: Array,
    required: false,
  },
  modelId: {
    //tree에서 검색조건으로 선택한 modelId
    type: String,
    required: false,
    default: "",
  },
  typeModelId: {
    //tree에서 검색조건으로 선택한 typeModelId
    type: String,
    required: false,
    default: "",
  },
});

const pageInfo = reactive({
  srchStartDd: "",
  srchEndDd: "",
  modelId: props.modelId, //모델 ID
  typeModelId: props.typeModelId, //모델유형 id
  medataSetSttusMtcd: "", //메타데이터 셋 상태
  srchText: "", //메타데이터 셋 명
  medataSetId: "",
  includeDisuseYn: "", //제외(폐기) 포함 여부 ("" 제외 / "Y" 포함)
});

defineExpose({
  pageInfo: pageInfo
});

const propsRefs = toRefs(props);
watch(
  [propsRefs.modelId, propsRefs.typeModelId],
  () => {
    pageInfo.modelId = props.modelId;
    pageInfo.typeModelId = props.typeModelId;
  },
  { deep: true }
);

const getMetadataSetList = (data) => {
  emits("searchMetadataSetList", { curPage: data, pageInfo });
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

const changeCd = (data) => {
  pageInfo.medataSetSttusMtcd = data;
};

const changeTypeModelId = (data) => {
  pageInfo.typeModelId = data;
};

const refreshModelId = () => {
  emits("refreshModelId");
};
</script>
<style lang="scss"></style>