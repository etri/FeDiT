<template>
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>{{ curTitle }}</h3>
      </div>

      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRef"
          :model="typeModel"
          :rules="rules"
          label-width="210px"
          class="demo-ruleForm"
        >
          <el-form-item label="모델 ID" prop="modelId">
            <el-input v-model="typeModel.modelId" placeholder="물리명과 동일하게 생성" disabled></el-input>
          </el-form-item>
					<el-form-item label="모델 명(물리명)" prop="modelNm">
						<el-row :gutter="20">
							<el-col :span="4">
								<el-input class="w-20 m-2" style="width: 250px" v-model="typeModel.modelNm" disabled></el-input>
							</el-col>
						</el-row>
					</el-form-item>
          <el-form-item label="모델 논리명" prop="modelLogicNm">
            <el-input v-model="typeModel.modelLogicNm"></el-input>
          </el-form-item>
					<!-- 2023-07-27 정형모델 사용안함 
					<el-form-item label="정형 모델 여부/정형 모델" prop="structdModelYn">
						<el-row :gutter="20">
							<el-col :span="3">
								<el-select 
									v-model="typeModel.structdModelYn"
									@change="changeStructdModelYn"									
									>
									<el-option label="Y" value="Y"/>
									<el-option label="N" value="N"/>
								</el-select>
							</el-col>

							<el-col :span="17">
								<el-select 
									v-model="typeModel.structdModelSchmaMtcd"
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
							<el-input style="width: 250px;" v-model="typeModel.modelDataUri" placeholder="/samples" v-bind:disabled="structdEnable"/>
							<el-button type="primary" class="ml15" @click="modelDataUriCheck('alert')" @keydown.enter.prevent="modelDataUriCheck('alert')" 
							  v-show ="structdEnable==false"
							  >중복확인</el-button>
						</div>							
					</el-form-item>
					<el-form-item label="모델 상태" prop="modelDataSttusMtcd">
						<el-row :gutter="20">
							<el-col :span="17">
								<!-- 모델 상태: 사용 -> 폐기 상태로 수정할 경우는 삭제 버튼을 사용하도록 disabled -->
								<el-select :disabled="typeModel.modelDataSttusMtcd === 'use'" style="width: 250px" 
									v-model="typeModel.modelDataSttusMtcd"
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
						<el-input v-model="typeModel.modelSortOdrg" type="number" maxlength="5"></el-input>
					</el-form-item>	
					<el-form-item label="설명" prop="modelDesc">
            <el-input v-model="typeModel.modelDesc"></el-input>
          </el-form-item>
					<!-- 2023-06-09 우선 사용하지 않아서 주석 처리.
					<el-form-item label="생성되는 메타데이터 셋 ID Prefix" prop="modelDataIdPfix">
						<el-input v-model="typeModel.modelDataIdPfix"></el-input>
					</el-form-item>	
				  -->
					<el-form-item label="등록정보" >
            <el-input v-model="typeModel.regrInfo" disabled></el-input>
          </el-form-item>
					<el-form-item label="수정정보" >
            <el-input v-model="typeModel.amdrInfo" disabled></el-input>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary"
        v-if="isAmdYn(route.meta.auth) && curPage == 'modify'"        
        @click="modifyTypeModel"
        >저장</el-button
      >
      <el-button type="primary" plain
        v-if="isDelYn(route.meta.auth) && curPage == 'modify'"
        @click="deleteTypeModel"
        >삭제</el-button
      >
      <el-button type="default" @click="cancelDialog">취소</el-button>
    </div>
  </div>
</template>
<script setup>

import { ref, reactive, watch } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties, isAmdYn, isDelYn } from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const ruleFormRef = ref(null);
const uriCheck = ref(false);
const structdEnable = ref(false);

const emits = defineEmits([
  "cancelModifyDialog",
  "modifyTypeModel",
  "deleteTypeModel",
]);

const props = defineProps({
  typeModel : {
    type: Object,
    required: true
  },
	dataStatusCdList: {
		type: Array,
		required: false,
	},
	structdModelSchmaList: {
		type: Array,
		required: false,
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

const rules = ref({  
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
});

const modelDataUriCheck = async (check) => {
	if(props.typeModel.modelDataUri == '') {		
		uriCheck.value = false;
		return;
	}
	await $axios
		.get($apiUrls.meta.data.model.getModelCheck , {
			params: { searchMode: "modelDataUri", searchName: props.typeModel.modelDataUri },
		})
		.then((res) => {
			if(res.data.duplicated && props.typeModel.modelDataUri != props.typeModel.orgModelDataUri) {
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

const changeModelDataSttusMtcd = (data) => {
	props.typeModel.modelDataSttusMtcd = data;
}
const changeStructdModelSchmaMtcd = (data) => {
	props.typeModel.structdModelSchmaMtcd = data;
	props.typeModel.modelDataUri= (data ? '/' + data : '');
}
const changeStructdModelYn = (data) => {
	props.typeModel.structdModelYn = data;
	if(data == 'Y') {
		structdEnable.value=true;		
	} else {
		structdEnable.value=false;
		props.typeModel.structdModelSchmaMtcd = "";
	}
}

const cancelDialog = () => {
  emits("cancelModifyDialog");
};

const modifyTypeModel = async () => {
  emits("modifyTypeModel", { data: props.typeModel, ruleFormRef });
};

const deleteTypeModel = () => {
  emits("deleteTypeModel", { data: props.typeModel.modelId });
};

</script>
<style lang="scss"></style>