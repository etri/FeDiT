<template>
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>{{ curTitle }}</h3>
      </div>

      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRef"
          :model="dataTypeModel"
          :rules="rules"
          label-width="200px"
          class="demo-ruleForm"
        >
          <el-form-item label="모델 ID" prop="modelId">
            <el-input v-model="dataTypeModel.modelId" disabled></el-input>
          </el-form-item>
					<el-form-item label="모델 명(물리명)" prop="modelNm" >
						<el-row :gutter="20">
							<el-col :span="24">
								<el-input class="w-20 m-2" style="width: 250px" v-model="dataTypeModel.modelNm" disabled></el-input>
							</el-col>
						</el-row>
					</el-form-item>
          <el-form-item label="모델 논리명" prop="modelLogicNm">
            <el-input v-model="dataTypeModel.modelLogicNm" v-bind:disabled="curPage != 'modify'"></el-input>
          </el-form-item>
					<el-form-item label="데이터 유형 매핑" prop="dataTypeMtcd">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select class="w50" 
									v-model="dataTypeModel.dataTypeMtcd"
									@change="changeDataTypeMtcd"
                  v-bind:disabled="curPage != 'modify'"
									placeholder="선택">
									<el-option
											v-for="item in dataTypeCdList"
											:key="item.mtcd"
											:label="`[${item.mtcd}] ${item.mtcdNm}`"
											:value="item.mtcd"
									/>
								</el-select>
							</el-col>
						</el-row>
					</el-form-item> 
          <el-form-item label="값 설명(예제)" prop="dataTypeValExam">
            <el-input v-model="dataTypeModel.dataTypeValExam" v-bind:disabled="curPage != 'modify'"></el-input>
          </el-form-item>
					<el-form-item label="코드그룹ID" prop="mtcdGrpId">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select class="w50"
									v-model="dataTypeModel.mtcdGrpId"
									@change="changeMetaCodeGroupId"
                  v-bind:disabled="curPage != 'modify'"
									placeholder="해당없음">
									<el-option value="" label="해당없음" />
									<el-option
											v-for="item in metaCodeGroupList"
											:key="item.mtcdGrpId"
											:label="`[${item.mtcdGrpId}] ${item.mtcdGrpNm}`"
											:value="item.mtcdGrpId"
									/>
								</el-select>
							</el-col>
						</el-row>
					</el-form-item> 
					<el-form-item label="사용 언어" prop="useLangMtcd">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select class="w50"
									v-model="dataTypeModel.useLangMtcd"
									@change="changeUseLangMtcd"
                  v-bind:disabled="curPage != 'modify'"
									placeholder="해당없음">
									<el-option value="" label="해당없음" />
									<el-option
											v-for="item in useLangCdList"
											:key="item.mtcd"
											:label="`[${item.mtcd}] ${item.mtcdNm}`"
											:value="item.mtcd"
									/>
								</el-select>
							</el-col>
						</el-row>
					</el-form-item> 
					<el-form-item label="모델 상태" prop="modelDataSttusMtcd">
						<el-row :gutter="20">
							<el-col :span="24">
                <!-- 모델 상태: 사용 -> 폐기 상태로 수정할 경우는 삭제 버튼을 사용하도록 disabled -->
								<el-select v-bind:disabled="dataTypeModel.modelDataSttusMtcd === 'use' || curPage != 'modify'"
                  class="w50" 
									v-model="dataTypeModel.modelDataSttusMtcd"
									@change="changeModelDataSttusMtcd"
									placeholder="선택">
									<el-option
											v-for="item in dataStatusCdList"
											:key="item.mtcd"
											:label="item.mtcdNm"
											:value="item.mtcd"
									/>
								</el-select>
							</el-col>
						</el-row>
					</el-form-item> 
					<el-form-item label="정렬 순서" prop="modelSortOdrg">
						<el-input v-model="dataTypeModel.modelSortOdrg" type="number" v-bind:disabled="curPage != 'modify'" maxlength="5"></el-input>
					</el-form-item>	
					<el-form-item label="설명" prop="modelDesc">
            <el-input v-model="dataTypeModel.modelDesc" v-bind:disabled="curPage != 'modify'"></el-input>
          </el-form-item>
					<el-form-item label="등록정보" >
            <el-input v-model="dataTypeModel.regrInfo" disabled></el-input>

          </el-form-item>
					<el-form-item label="수정정보" >
            <el-input v-model="dataTypeModel.amdrInfo" disabled></el-input>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary"
        v-if="isAmdYn(route.meta.auth) && curPage == 'modify'"       
        @click="modifyDataTypeModel"
        >저장</el-button
      >

      <el-button type="primary" plain
        v-if="isDelYn(route.meta.auth) && curPage == 'modify'"
        @click="deleteDataTypeModel"
        >삭제</el-button
      >
      <el-button type="default" @click="cancelDialog">취소</el-button>
    </div>
  </div>
</template>
<script setup>

import { ref, reactive} from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties, isAmdYn, isDelYn } from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const ruleFormRef = ref(null);
const nameCheck = ref(false);

const emits = defineEmits([
  "cancelModifyDialog",
  "modifyDataTypeModel",
  "deleteDataTypeModel",
]);
const props = defineProps({
  dataTypeModel : {
    type: Object,
    required: true
  },
	dataStatusCdList: {
		type: Array,
		required: false
	},
	dataTypeCdList: {
		type: Array,
		required: false
	},
	metaCodeGroupList: {
		type: Array,
		required: false
	},
	useLangCdList: {
		type: Array,
		required: false
	},
  curPage: {
    type: String,
    required: false
  },
  curTitle: {
    type: String,
    required: false
  }
});

//상위모델id와 유형모델id는 insert할 때 고정되어있음
const rules = ref({  
  modelNm: [
    {
      required: true,
      message: "내용을 입력하세요.",
      trigger: "blur",
    }
  ],
  modelLogicNm: [
    {
      required: true,
      message: "내용을 입력하세요.",
      trigger: "blur",        
    }
  ],
  dataTypeMtcd: [
    {
      required: true,
      message: "데이터 유형 매핑을 선택하세요.",
      trigger: "blur",
    }
  ],
  modelDataSttusMtcd: [
    {
      required: true,
      message: "모델 상태를 선택하세요.",
      trigger: "blur",
    }
  ],
  modelSortOdrg: [
		{
		required: true,
		message: "내용을 입력하세요.",
		trigger: "blur",
		},
		{
		validator: (rule, value) => {
			const parsedValue = parseInt(value, 10);
			if (value && value.length > 5) {
			return Promise.reject("5자 이하만 가능합니다.");
			} else if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 99999) {
			return Promise.reject("0 ~ 99999 사이의 값만 입력할 수 있습니다.");
			} else {
			return Promise.resolve();
			}
		},
		trigger: "blur",
		}
	]
});

const changeModelDataSttusMtcd = (data) => {
	props.dataTypeModel.modelDataSttusMtcd = data;
}
const changeDataTypeMtcd = (data) => {
	props.dataTypeModel.dataTypeMtcd = data;
}
const changeMetaCodeGroupId = (data) => {
	props.dataTypeModel.mtcdGrpId = data;
}
const changeUseLangMtcd = (data) => {
	props.dataTypeModel.useLangMtcd = data;
}

const cancelDialog = () => {
  emits("cancelModifyDialog");
};

const modifyDataTypeModel = async () => {
  emits("modifyDataTypeModel", { data: props.dataTypeModel, ruleFormRef });
};

const deleteDataTypeModel = () => {
  emits("deleteDataTypeModel", { data: props.dataTypeModel.modelId });
};

</script>
<style lang="scss"></style>