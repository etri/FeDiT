<template>
    <el-form label-position="left"
      :inline="true"
      :model="pageInfo"
      class="demo-form-inline"
      label-width="200px"
    >  
        <el-form-item label="수정일">
          <el-row :gutter="20">
            <el-col :span="11">
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
            </el-col>
            <el-col :span="1"><span>~</span></el-col>
            <el-col :span="8">
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
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="메타데이터 셋 상태">
          <el-row :gutter="20">
            <el-col :span="17">
              <el-select 
								v-model="pageInfo.medataSetSttusMtcd"
								@change="changeCd"
								placeholder="선택">
								<el-option label="전체" value="" />
								<el-option
									v-for="item in dataStatusList"
									:key="item.mtcd"
									:label="item.mtcdNm"
									:value="item.mtcd"
								/>
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>        
  
    </el-form>   
  
    <el-form label-position="right"
      :inline="true"
      :model="pageInfo"
      class="demo-form-inline"
      label-width="200px"
    >

        <el-form-item label="모델 명">
          <el-row :gutter="20">
            <el-col :span="20">
              <el-input
                class="w-50 m-2"
                v-model="pageInfo.agntModelNm"
                placeholder="모델 명을 입력하세요."
                @keydown.enter.prevent="getAgentList(1)" /></el-col
          ></el-row>
        </el-form-item>

      <el-form-item label="검색어">
        <el-row :gutter="20">
          <el-col :span="9">
            <el-select v-model="pageInfo.searchType" placeholder="선택">
              <!-- <el-option label="선택" value="0" /> -->
              <el-option label="대리인 명" value="1" />
              <el-option label="대리인 ID" value="2" />
            </el-select>
          </el-col>
          <el-col :span="11">
            <el-input
              class="w-50 m-2"
              v-model="pageInfo.searchWord"
              placeholder="검색어를 입력하세요."
              @keyup.enter="getAgentList(1)" /></el-col
        ></el-row>
      </el-form-item>      


    </el-form>
    <div class="btnSec taR">
      <el-button type="primary" @click="getAgentList(1)">검색</el-button>
      <el-button type="default" @click="refresh">초기화</el-button>
    </div>
  </template>
  <script setup>
  import { reactive, defineEmits } from "vue";
  const emits = defineEmits(["searchAgent"]);
  
  const pageInfo = reactive({
    srchStartDd: "",
    srchEndDd: "",
    medataSetSttusMtcd: "",
    agntModelId: "",
    agntModelNm: "",
    searchType: "1",
    searchWord: "",    
  });

	const props = defineProps({
		dataStatusList: {
			type: Array,
			required: false,
		}
	});
  
  const getAgentList = (data) => {
    emits("searchAgent", {
      curPage: data,
      pageInfo,
    });
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

  const refresh = () => {
    pageInfo.srchStartDd = "";
    pageInfo.srchEndDd = "";
    pageInfo.medataSetSttusMtcd = "";
    pageInfo.agntModelId = "";
		pageInfo.agntModelNm = "";
    pageInfo.searchType = "1";
    pageInfo.searchWord = "";      
  };
  
  </script>
  <style lang="scss"></style>
  