<template>
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>메타데이터 표준 모델 수정</h3>
      </div>

      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRef"
          :model="stdModel"
          :rules="rules"
          label-width="210px"
          class="demo-ruleForm"
        >
          <el-form-item label="모델 ID" prop="modelId">
            <el-input v-model="stdModel.modelId" placeholder="물리명과 동일하게 생성" disabled></el-input>
          </el-form-item>
					<el-form-item label="유형 모델" prop="typeModelLogicNm">
            <el-input v-model="stdModel.typeModelLogicExNm" disabled></el-input>
          </el-form-item>
					<el-form-item label="상위 모델" prop="upModelLogicNm">
            <el-input v-model="stdModel.upModelLogicExNm" disabled></el-input>
          </el-form-item>
					<el-form-item label="모델 데이터 URI" prop="modelDataUri">
            <el-input v-model="stdModel.modelDataUri" disabled></el-input>
          </el-form-item>
					<el-form-item label="모델 명(물리명)" prop="modelNm">
						<el-input v-model="stdModel.modelNm" disabled/>
					</el-form-item>
          <el-form-item label="모델 논리명" prop="modelLogicNm">
            <el-input v-model="stdModel.modelLogicNm"></el-input>
          </el-form-item>
					<!-- 2023-09-04 추상 모델 여부 화면에서 숨김 
					<el-form-item label="추상 모델 여부" prop="abstrtModelYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select 
									v-model="stdModel.abstrtModelYn"
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
								<el-select :disabled="stdModel.modelDataSttusMtcd === 'use'"
									v-model="stdModel.modelDataSttusMtcd"
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
						<el-input v-model="stdModel.modelSortOdrg" type="number" maxlength="5"></el-input>
					</el-form-item>	
					<el-form-item label="설명" prop="modelDesc">
            <el-input v-model="stdModel.modelDesc"></el-input>
          </el-form-item>
					<el-form-item label="등록정보" >
            <el-input v-model="stdModel.regrInfo" disabled></el-input>
          </el-form-item>
					<el-form-item label="수정정보" >
            <el-input v-model="stdModel.amdrInfo" disabled></el-input>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" v-if="isAmdYn(route.meta.auth)" @click="modifyModel">저장</el-button>
      <el-button type="primary" plain v-if="isDelYn(route.meta.auth)" @click="deleteModel">삭제</el-button>
      <el-button type="default" @click="cancelDialog">취소</el-button>
    </div>
  </div>
</template>
<script setup>

import { ref, reactive, getCurrentInstance} from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties, isAmdYn, isDelYn  } from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const ruleFormRef = ref(null);
const $emitter = getCurrentInstance().appContext.config.globalProperties.$emitter;

const emits = defineEmits(["modifyModel", "cancelDialog", "deleteModel"]);
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

const rules = reactive({
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
});

const modifyModel = async () => {
  let ruleForm = ruleFormRef.value;
  if (!ruleForm) return;

  await ruleForm.validate((valid, fields) => {
    if (valid) {
      $axios
				.put(util.format($apiUrls.meta.data.std.modifyStdModel,props.stdModel.modelId), props.stdModel)
        .then((res) => {
					alert("수정이 완료되었습니다.");
					emits("modifyModel");
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

const deleteModel = async ()=> {
	// 2023-06-30 모델 삭제 로직 변경.let result = confirm("삭제하시겠습니까?\n삭제가 불가능한 경우 폐기 상태로 처리됩니다.");
	let result = confirm("삭제하시겠습니까?");
	if (result) {
		$axios.
			delete(util.format($apiUrls.meta.data.std.deleteStdModel, props.stdModel.modelId))
			.then(() => {
				alert("삭제 완료하였습니다.");
				emits("deleteModel");
        resetStdModel();
			})
			.catch((err) => {
				console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("표준 모델 삭제에 실패하였습니다.");
				}
			});
	}
}

const resetStdModel = () => {
	props.stdModel={};
};

const changeAbstrtModelYn = (data) => {
	props.stdModel.abstrtModelYn = data;
}

const changeModelDataSttusMtcd = (data) => {
	props.stdModel.modelDataSttusMtcd = data;
}

const cancelDialog = () => {
	resetStdModel();
  emits("cancelDialogModify");
};

</script>
<style lang="scss"></style>