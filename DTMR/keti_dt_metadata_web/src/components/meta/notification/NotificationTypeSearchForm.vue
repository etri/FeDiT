<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>알림 유형 검색</h3> 
      <div class="btnSec taR">
        <el-button type="default" @click="resetSearchForm()">초기화</el-button>
        <el-button type="primary" @click="getNotifcTypeList()">검색</el-button>        
      </div>
    </div>
    <div class="boxCnt">
      <el-form label-position="left"
        :model="searchInfo"
        :inline="true"
        class="demo-form-inline search-form"
        label-width="150px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="알림 유형">
              <el-input
                v-model="searchInfo.searchTypeKeyword"
                placeholder="알림 유형 ID / 알림 유형명을 입력하세요."
                @keydown.enter.prevent="getNotifcTypeList()"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="알림 사용 여부">
              <el-select v-model="searchInfo.notifcUseYn" placeholder="전체">
                <el-option label="전체" value="null" />
                <el-option
                  v-for="item in useYnList"
                  :key="item.value"
                  :label="item.name"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="알림 메시지 템플릿">
              <el-input
                v-model="searchInfo.notifcMsgTmplt"
                placeholder=""
                @keydown.enter.prevent="getNotifcTypeList()"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="알림 대상자">
              <el-input
                v-model="searchInfo.searchTargetKeyword"
                placeholder=""
                @keydown.enter.prevent="getNotifcTypeList()"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import {
  ref,
  defineEmits,
} from "vue";

const emits = defineEmits(["searchNotificationType"]);

const searchInfo = ref({
  searchTypeKeyword: "", // notifcTypeId or notifcTypeNm
  searchTargetKeyword: "",  // ids, nms에 검색어가 포함된 대상에 대한 유형들만 검색?
  notifcUseYn: "",
  notifcMsgTmplt: "",
});

const useYnList = [
  { name: "Y", value: "Y" },
  { name: "N", value: "N" },
];

const getNotifcTypeList = () => {
  emits("searchNotificationType", searchInfo.value);
};

const resetSearchForm = () => {
  searchInfo.value = {};
};
</script>