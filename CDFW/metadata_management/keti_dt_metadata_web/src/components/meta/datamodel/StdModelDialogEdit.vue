<template>
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>메타데이터 표준 모델 등록</h3>
      </div>

      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRef"
          :model="state.stdModel"
          :rules="state.rules"
          label-width="210px"
          class="demo-ruleForm"
        >
          <el-form-item label="모델 ID" prop="modelId">
            <el-input v-model="state.stdModel.modelId" placeholder="물리명과 동일하게 생성" disabled></el-input>
          </el-form-item>
					<el-form-item label="유형 모델" prop="typeModelLogicNm">
            <el-input v-model="state.stdModel.typeModelLogicExNm" disabled></el-input>
          </el-form-item>
					<el-form-item label="상위 모델" prop="upModelLogicNm">
            <el-input v-model="state.stdModel.upModelLogicExNm" disabled></el-input>
          </el-form-item>
					<el-form-item label="모델 데이터 URI" prop="modelDataUri">
            <el-input v-model="state.stdModel.modelDataUri" disabled></el-input>
          </el-form-item>
					<el-form-item label="모델 명(물리명)" prop="modelNm">
						<div class="inline-area">
							<el-input style="width: 250px;" v-model="state.stdModel.modelNm" placeholder="(대문자로 시작)"
								@input="changeModelNm" />
							<el-button type="primary" class="ml15" @click="modelNameCheck('alert')" @keydown.enter.prevent="modelNameCheck('alert')" >중복확인</el-button>
						</div>						
					</el-form-item>
          <el-form-item label="모델 논리명" prop="modelLogicNm">
            <el-input v-model="state.stdModel.modelLogicNm"></el-input>
          </el-form-item>
					<!-- 2023-09-04 추상 모델 여부 화면에서 숨김 
					<el-form-item label="추상 모델 여부" prop="abstrtModelYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select 
									v-model="state.stdModel.abstrtModelYn"
									@change="changeAbstrtModelYn"
									>
									<el-option label="Y" value="Y"/>
									<el-option label="N" value="N"/>
								</el-select>
							</el-col>
						</el-row>
					</el-form-item> -->
					<el-form-item label="모델 상태" prop="modelDataSttusMtcd">
						<el-row :gutter="20">
							<el-col :span="24">
								<!-- 모델 상태: 사용 -> 폐기 상태로 수정할 경우는 삭제 버튼을 사용하도록 disabled -->
								<el-select disabled
									v-model="state.stdModel.modelDataSttusMtcd"
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
						<el-input v-model="state.stdModel.modelSortOdrg" type="number" maxlength="5"></el-input>
					</el-form-item>	
					<el-form-item label="설명" prop="modelDesc">
            <el-input v-model="state.stdModel.modelDesc"></el-input>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="taR">
      <el-button type="primary" @click="editModel">저장</el-button>
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

const emits = defineEmits(["editModel", "cancelDialog"]);
const props = defineProps({
	dataStatusCdList: {
		type: Array,
		required: false,
	},
	stdModel: {
		type: Object,
		required: false
	}
});

const state = reactive({
  stdModel: {
		typeModelId:props.stdModel.typeModelId,
		upModelId:props.stdModel.modelId,
		typeModelLogicExNm: props.stdModel.typeModelLogicExNm,
		upModelLogicExNm: props.stdModel.modelLogicExNm,		
    modelDataUri: props.stdModel.modelDataUri,
    structdModelYn: props.stdModel.structdModelYn,
		abstrtModelYn: "N",
    modelDataSttusMtcd: "use",
    modelSortOdrg: 0,
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
		abstrtModelYn: [
      {
        required: true,
        message: "선택하세요.",
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

const editModel = async () => {
  let ruleForm = ruleFormRef.value;
  if (!ruleForm) return;
	await modelNameCheck('save'); 
	if(!nameCheck.value) return;

  await ruleForm.validate((valid, fields) => {
    if (valid) {
			state.stdModel.modelId = state.stdModel.modelNm;
      $axios
        .post($apiUrls.meta.data.std.createStdModel, state.stdModel)
        .then((res) => {
          alert("메타데이터 표준 모델 등록이 완료되었습니다.\n[id : "+ res.data.id + "]");
          resetStdModel();
          emits("editModel", { modelId : res.data.id });
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

const modelNameCheck = async (check) => {
	if(state.stdModel.modelNm == '') {
		alert("물리명을 입력해주세요."); 
		return false;
	}
	await $axios.get($apiUrls.meta.data.model.getModelCheck , {
			params: { searchMode: "modelName", searchName: state.stdModel.modelNm },
		})
		.then((res) => {
			if(res.data.duplicated) {
				alert('사용중인 물리명이 있습니다.');
				state.stdModel.modelNm = '';
				nameCheck.value = false;
			} else {
				if(check == 'alert') alert("사용가능합니다.");
				nameCheck.value = true;
			}
		}).catch((err) => {
			console.log(err);
		});
}

const resetStdModel = () => {
		state.stdModel={};
};

const changeAbstrtModelYn = (data) => {
	state.stdModel.abstrtModelYn = data;
}

const changeModelDataSttusMtcd = (data) => {
	state.stdModel.modelDataSttusMtcd = data;
}

const changeModelNm = () => {
	nameCheck.value = false; //중복체크 진행 유도 변수 (값 변경 시 중복체크를 다시 진행해야만 저장 버튼 활성화)
};

const cancelDialog = () => {
	resetStdModel();
  emits("cancelDialog");
};

</script>
<style lang="scss"></style>