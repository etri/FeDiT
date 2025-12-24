<template>
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>메타데이터 유형 모델 등록</h3>
      </div>

      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRef"
          :model="state.typeModel"
          :rules="state.rules"
          label-width="210px"
          class="demo-ruleForm"
        >
          <el-form-item label="모델 ID" prop="modelId">
            <el-input v-model="state.typeModel.modelId" placeholder="물리명과 동일하게 생성" disabled></el-input>
          </el-form-item>
					<el-form-item label="모델 명(물리명)" prop="modelNm">
						<div class="inline-area">
							<el-input style="width: 250px;" v-model="state.typeModel.modelNm" placeholder="(대문자로 시작 - 64자 이하)"
								@input="changeModelNm" />
							<el-button type="primary" class="ml15" @click="modelNameCheck('alert')" @keydown.enter.prevent="modelNameCheck('alert')" >중복확인</el-button>
						</div>						
					</el-form-item>
          <el-form-item label="모델 논리명" prop="modelLogicNm">
            <el-input v-model="state.typeModel.modelLogicNm"></el-input>
          </el-form-item>
					<!-- 2023-07-27 정형모델 사용안함 
					<el-form-item label="정형 모델 여부/정형 모델" prop="structdModelYn">
						<el-row :gutter="20">
							<el-col :span="3">
								<el-select 
									v-model="state.typeModel.structdModelYn"
									@change="changeStructdModelYn"									
									>
									<el-option label="Y" value="Y"/>
									<el-option label="N" value="N"/>
								</el-select>
							</el-col>

							<el-col :span="17">
								<el-select 
									v-model="state.typeModel.structdModelSchmaMtcd"
									@change="changeStructdModelSchmaMtcd"
									v-bind:disabled="structdEnable==false"
									>
									<el-option label="해당없음" value="" />
									<el-option
											v-for="item in structdModelSchmaList"
											:key="item.mtcd"
											:label="item.mtcdNm"
											:value="item.mtcd"
									/>
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>
				  -->
					<el-form-item label="모델 데이터 URI" prop="modelDataUri">
						<div class="inline-area">
							<el-input style="width: 250px;" v-model="state.typeModel.modelDataUri" placeholder="/samples" v-bind:disabled="structdEnable" />
							<el-button type="primary" class="ml15" @click="modelDataUriCheck('alert')" @keydown.enter.prevent="modelDataUriCheck('alert')" 
								v-show ="structdEnable==false"
							  >중복확인</el-button>
						</div>							
					</el-form-item>
					<el-form-item label="모델 상태" prop="modelDataSttusMtcd">
						<el-row :gutter="20">
							<el-col :span="17">
								<!-- 모델 상태: 사용 -> 폐기 상태로 수정할 경우는 삭제 버튼을 사용하도록 disabled -->
								<el-select disabled style="width: 250px;"
									v-model="state.typeModel.modelDataSttusMtcd"
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
						<el-input v-model="state.typeModel.modelSortOdrg" type="number" maxlength="5"></el-input>
					</el-form-item>	
					<el-form-item label="설명" prop="modelDesc">
            <el-input v-model="state.typeModel.modelDesc"></el-input>
          </el-form-item>
					<!-- 2023-06-09 우선 사용하지 않아서 주석 처리.
					<el-form-item label="생성되는 메타데이터 셋 ID Prefix" prop="modelDataIdPfix">
						<el-input v-model="state.typeModel.modelDataIdPfix"></el-input>
					</el-form-item>
					-->
        </el-form>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="editTypeInfo">저장</el-button>
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
const uriCheck = ref(false);
const structdEnable = ref(false);

const emits = defineEmits(["editTypeInfo", "cancelDialog"]);
const props = defineProps({
	dataStatusCdList: {
		type: Array,
		required: false,
	},
	structdModelSchmaList: {
		type: Array,
		required: false,
	},
});

const state = reactive({
  typeModel: {
    modelId: "",
    modelNm: "",
    modelLogicNm: "",
    modelDesc: "",
    modelDataSttusMtcd: "use",
    modelSortOdrg: 0,
    structdModelYn: "N",
		structdModelSchmaMtcd:"",
    modelDataUri: "",
    modelDataIdPfix: ""
  },
  rules: {
    modelNm: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
	  {
		max: 64,
		message: "64자 이하만 가능합니다.",
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
		structdModelYn: [
      {
        required: true,
        message: "선택하세요.",
        trigger: "blur",        
      }
    ],
		modelDataUri: [
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			}
		],
		modelDataSttusMtcd: [
			{
				required: true,
				message: "선택하세요.",
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

const editTypeInfo = async () => {
  let ruleForm = ruleFormRef.value;
  if (!ruleForm) return;

	let isFormValid = false;
  await ruleForm.validate((valid) => { isFormValid = valid; });
	if (!isFormValid) {
		alert("입력 정보를 다시 한번 확인해주세요.");
		return;
	}

	await modelNameCheck('save'); 
	if(!nameCheck.value) return;
	await modelDataUriCheck('save'); 
	if(!uriCheck.value) return;

	state.typeModel.modelId = state.typeModel.modelNm;
	await $axios
		.post($apiUrls.meta.data.type.createTypeModel, state.typeModel)
		.then((res) => {
			alert("메타데이터 유형 모델 등록이 완료되었습니다.\n[id : "+ res.data.id + "]");
			resetTypeModel();
			emits("editTypeInfo");
		})
		.catch((err) => {
			console.log(err);
			if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
				alert(err.response.data.message);
			} else {
				alert("모델 등록에 실패하였습니다.");
			}
		});	
};

const modelNameCheck = async (check) => {
	let ruleForm = ruleFormRef.value;
	try {
		await ruleForm.validateField('modelNm');
	} catch (e) {
		ruleForm.scrollToField?.('modelNm');
		return false;
	}
	if(state.typeModel.modelNm == '') {
		alert("물리명을 입력해주세요."); 
		nameCheck.value = false;
		return;
	}
	await $axios
		.get($apiUrls.meta.data.model.getModelCheck , {
			params: { searchMode: "modelName", searchName: state.typeModel.modelNm },
		})
		.then((res) => {
			if(res.data.duplicated) {
				alert('사용중인 물리명이 있습니다.');
				nameCheck.value = false;
			} else {
				if(check == 'alert') alert("사용가능합니다.");
				nameCheck.value = true;
			}
		}).catch((err) => {
			console.log(err);
		});
}

const modelDataUriCheck = async (check) => {
	if(state.typeModel.modelDataUri == '') {
		alert("모델 데이터 URI를 입력해주세요."); 
		uriCheck.value = false;
		return;
	}
	await $axios
		.get($apiUrls.meta.data.model.getModelCheck , {
			params: { searchMode: "modelDataUri", searchName: state.typeModel.modelDataUri },
		})
		.then((res) => {
			if(res.data.duplicated) {
				alert('사용중인 모델 데이터 URI가 있습니다.');
				uriCheck.value = false;
			} else {
				if(check == 'alert') alert("사용가능합니다.");
				uriCheck.value = true;
			}
		}).catch((err) => {
			console.log(err);
		});
}

const resetTypeModel = () => {
		state.typeModel.modelId="",
    state.typeModel.modelNm="",
    state.typeModel.modelLogicNm="",
    state.typeModel.modelDesc="",
    state.typeModel.modelDataSttusMtcd="use",
    state.typeModel.modelSortOdrg="0",
    state.typeModel.structdModelYn="N",
    state.typeModel.structdModelSchmaMtcd="",
    state.typeModel.modelDataUri="",
    state.typeModel.modelDataIdPfix=""
};

const changeModelDataSttusMtcd = (data) => {
	state.typeModel.modelDataSttusMtcd = data;
}
const changeStructdModelSchmaMtcd = (data) => {
	state.typeModel.structdModelSchmaMtcd = data;
	state.typeModel.modelDataUri= (data ? '/' + data : '');
}
const changeStructdModelYn = (data) => {
	state.typeModel.structdModelYn = data;
	if(data == 'Y') {
		structdEnable.value=true;		
	} else {
		structdEnable.value=false
		state.typeModel.structdModelSchmaMtcd = "";
	}
}

const changeModelNm = () => {
	nameCheck.value = false; //중복체크 진행 유도 변수 (값 변경 시 중복체크를 다시 진행해야만 저장 버튼 활성화)
};

const cancelDialog = () => {
	resetTypeModel();
  emits("cancelDialog");
};

</script>
<style lang="scss"></style>