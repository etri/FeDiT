<template>
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>DataType 모델 등록</h3>
      </div>

      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRef"
          :model="state.dataTypeModel"
          :rules="state.rules"
          label-width="200px"
          class="demo-ruleForm"
        >
          <el-form-item label="모델 ID" prop="modelId">
            <el-input v-model="state.dataTypeModel.modelId" placeholder="물리명과 동일하게 생성" disabled></el-input>
          </el-form-item>
					<el-form-item label="모델 명(물리명)" prop="modelNm">
						<div class="inline-area">
							<el-input style="width: 250px;" v-model="state.dataTypeModel.modelNm" placeholder="(소문자로 시작)"
								@input="changeModelNm" />
							<el-button type="primary" class="ml15" @click="modelNameCheck('alert')" @keydown.enter.prevent="modelNameCheck('alert')" >중복확인</el-button>
						</div>						
					</el-form-item>
          <el-form-item label="모델 논리명" prop="modelLogicNm">
            <el-input v-model="state.dataTypeModel.modelLogicNm"></el-input>
          </el-form-item>
					<el-form-item label="데이터 유형 매핑" prop="dataTypeMtcd">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select class="w50"
									v-model="state.dataTypeModel.dataTypeMtcd"
									@change="changeDataTypeMtcd"
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
            <el-input v-model="state.dataTypeModel.dataTypeValExam"></el-input>
          </el-form-item>
					<el-form-item label="코드그룹ID" prop="mtcdGrpId">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select class="w50"
									v-model="state.dataTypeModel.mtcdGrpId"
									@change="changeMetaCodeGroupId"
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
									v-model="state.dataTypeModel.useLangMtcd"
									@change="changeUseLangMtcd"
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
								<el-select class="w50" disabled
									v-model="state.dataTypeModel.modelDataSttusMtcd"
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
						<el-input v-model="state.dataTypeModel.modelSortOdrg" type="number" maxlength="5"></el-input>
					</el-form-item>	
					<el-form-item label="설명" prop="modelDesc">
            <el-input v-model="state.dataTypeModel.modelDesc"></el-input>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="editDataTypeInfo">저장</el-button>
      <el-button type="default" @click="cancelDialog">취소</el-button>
    </div>
  </div>
</template>
<script setup>

import { ref, reactive} from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const ruleFormRef = ref(null);
const nameCheck = ref(false);

const emits = defineEmits(["editDataTypeInfo", "cancelDialog"]);
const props = defineProps({
	dataStatusCdList: {
		type: Array,
		required: false,
	},
	dataTypeCdList: {
		type: Array,
		required: false,
	},
	metaCodeGroupList: {
		type: Array,
		required: false,
	},
	useLangCdList: {
		type: Array,
		required: false,
	}
});

const state = reactive({
  dataTypeModel: {
    modelId: "",
    modelNm: "",
    modelLogicNm: "",
    modelDesc: "",
    modelDataSttusMtcd: "use",
    modelSortOdrg: 0,
    dataTypeMtcd: "",
    dataTypeValExam: "",
    mtcdGrpId: "",
    useLangMtcd: ""
  },
  rules: {
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
   	
  },
});

const editDataTypeInfo = async () => {
  let ruleForm = ruleFormRef.value;
  if (!ruleForm) return;
	modelNameCheck('save'); 
	if(!nameCheck.value) return;

  await ruleForm.validate((valid, fields) => {
    if (valid) {
			state.dataTypeModel.modelId = state.dataTypeModel.modelNm;
      $axios
        .post($apiUrls.meta.data.datatype.createDataTypeModel, state.dataTypeModel)
        .then((res) => {
          alert("DataType 모델 등록이 완료되었습니다.\n[id : "+ res.data.id + "]");
          resetDataTypeModel();
          emits("editDataTypeInfo");
        })
        .catch((err) => {
          console.log(err);
					if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
						alert(err.response.data.message);
					} else {
						alert("모델 등록에 실패하였습니다.");
					}
        });
    } else {
      alert("입력 정보를 다시 한번 확인해주세요.");
    }
  });
};

const modelNameCheck = (check) => {
	if(state.dataTypeModel.modelNm == '') {
		alert("물리명을 입력해주세요."); 
		return false;
	}
	$axios
		.get($apiUrls.meta.data.model.getModelCheck , {
			params: { searchMode: "modelName", searchName: state.dataTypeModel.modelNm },
		})
		.then((res) => {
			if(res.data.duplicated) {
				alert('사용중인 물리명이 있습니다.');
				state.dataTypeModel.modelNm = '';
				nameCheck.value = false;
			} else {
				if(check == 'alert') alert('사용 가능한 물리명 입니다.');
				nameCheck.value = true;
			}
		}).catch((err) => {
			console.log(err);
		});
}

const resetDataTypeModel = () => {
		state.dataTypeModel.modelId="",
    state.dataTypeModel.modelNm="",
    state.dataTypeModel.modelLogicNm="",
    state.dataTypeModel.modelDesc="",
    state.dataTypeModel.modelDataSttusMtcd="use",
    state.dataTypeModel.modelSortOdrg="",
    state.dataTypeModel.dataTypeMtcd="",
    state.dataTypeModel.dataTypeValExam="",
    state.dataTypeModel.mtcdGrpId="",
    state.dataTypeModel.useLangMtcd=""
};

const changeModelDataSttusMtcd = (data) => {
	state.dataTypeModel.modelDataSttusMtcd = data;
}
const changeDataTypeMtcd = (data) => {
	state.dataTypeModel.dataTypeMtcd = data;
}
const changeMetaCodeGroupId = (data) => {
	state.dataTypeModel.mtcdGrpId = data;
}
const changeUseLangMtcd = (data) => {
	state.dataTypeModel.useLangMtcd = data;
}

const changeModelNm = () => {
	nameCheck.value = false; //중복체크 진행 유도 변수 (값 변경 시 중복체크를 다시 진행해야만 저장 버튼 활성화)
};

const cancelDialog = () => {
  emits("cancelDialog");
};

</script>
<style lang="scss"></style>