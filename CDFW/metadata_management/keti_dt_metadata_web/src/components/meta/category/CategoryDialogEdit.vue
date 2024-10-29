<template>
	<div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>카테고리 등록</h3>
      </div>

      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRef"
          :model="state.category"
          :rules="state.rules"
          label-width="200px"
          class="demo-ruleForm"
        >
          <el-form-item label="카테고리 ID" prop="ctgryId">
            <el-input v-model="state.category.ctgryId" placeholder="자동생성" disabled></el-input>
          </el-form-item>

					<el-form-item label="상위카테고리" prop="upCtgryNm">
						<div class="inline-area">
							<el-input style="width: 250px;" v-model="state.category.upCtgryNm" disabled />
							<el-button type="default" class="ml15" @click="dialogVisibleSearch = true"><el-icon class="icon icon-search"/></el-button>
							<el-button type="delete" @click="refreshCategory"><el-icon class="icon icon-refresh"/></el-button>
						</div>	
						<el-dialog v-model="dialogVisibleSearch" title="카테고리 검색">
							<CategoryDialogSearch @selectCategory="selectCategory" />
						</el-dialog>										
					</el-form-item>						

          <el-form-item label="카테고리명" prop="ctgryNm">
            <el-input v-model="state.category.ctgryNm"></el-input>
          </el-form-item>

		  <el-form-item label="카테고리 RDF 개념명" prop="ctgryRdfCncptNm">
		    <div class="inline-area">
				<el-input v-model="state.category.ctgryRdfCncptNm" placeholder="Camel Case 로 입력"></el-input>
				<el-button type="primary" class="ml15" @click="validate(true)">중복 확인</el-button>
            </div>
		  </el-form-item>
          <el-form-item label="카테고리 설명" prop="ctgryDesc">
            <el-input v-model="state.category.ctgryDesc"></el-input>
          </el-form-item>

          <el-form-item label="카테고리 영문명" prop="ctgryEngNm">
            <el-input v-model="state.category.ctgryEngNm"></el-input>
          </el-form-item>

          <el-form-item label="카테고리 영문설명" prop="ctgryEngDesc">
            <el-input v-model="state.category.ctgryEngDesc"></el-input>
          </el-form-item>

          <el-form-item label="카테고리 코드" prop="ctgryMappgCd">
            <el-input v-model="state.category.ctgryMappgCd"></el-input>
          </el-form-item>

					<el-form-item label="국가 코드">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-select 
								v-model="state.category.cntryCd"
								@change="changeCntryCd"
								placeholder="선택">
								<el-option
									v-for="item in countryCodeList"
									:key="item.cntryCd"
									:label="item.cntryNm"
									:value="item.cntryCd"
								/>
              </el-select>
            </el-col>
          </el-row>
        	</el-form-item>   

					<el-form-item label="카테고리 유형"> 
					<el-row :gutter="20">
						<el-col :span="24">
							<el-select 
								v-model="state.category.ctgryTypeMtcd"
								@change="changeCtgryTypeMtcd"
								placeholder="선택">
								<el-option
									v-for="item in ctgryTypeList"
									:key="item.mtcd"
									:label="item.mtcdNm"
									:value="item.mtcd"
								/>
							</el-select>
						</el-col>
					</el-row>
					</el-form-item> 					

					<el-form-item label="정렬 순서" prop="ctgrySortOdrg">
							<el-input v-model="state.category.ctgrySortOdrg" type="number" maxlength="5"></el-input>
					</el-form-item>				

					<el-form-item label="데이터 상태">
					<el-row :gutter="20">
						<el-col :span="24">
							<el-select 
								v-model="state.category.ctgryDataSttusMtcd"
								@change="changeCtgryDataSttusMtcd"
								placeholder="선택">
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
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditCategoryInfo">저장</el-button>
      <el-button type="default" @click="cancelDialog">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import CategoryDialogSearch from "@/components/meta/category/CategoryDialogSearch.vue";

import { ref, reactive, defineEmits, defineProps } from "vue";
import { useRoute } from "vue-router";
import { getLoginUserId } from "@/assets/js/auth.js";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const emits = defineEmits(["editCategoryInfo", "cancelDialog"]);

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);
const dialogVisibleSearch = ref(false);

const props = defineProps({
	countryCodeList: { // 국가코드
		type: Array,
		required: false,
	},
	dataStatusList: { // 카테고리 데이터 상태코드리스트
		type: Array,
		required: false,
	},
	ctgryTypeList: { //카테고리 유형 리스트
		type: Array,
		required: false,
	}
});

const state = reactive({
  category: {

		ctgryId: "",
		upCtgryId: "",
		upCtgryNm: "",
		ctgryNm: "",
		ctgryRdfCncptNm: "",
		ctgryDataSttusMtcd: "use", //등록 시, use default
		ctgrySortOdrg: 0,
		ctgryDesc: "",
		ctgryEngNm: "",
		ctgryEngDesc: "",
		ctgryMappgCd: "",
		cntryCd: "KR", //등록 시, 한국 default
		ctgryTypeMtcd: ""
  },
  rules: {
    ctgryNm: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
			{
				max: 128,
				message: "128자 이하만 가능합니다.",
				trigger: "blur",
			}
		],

		ctgryRdfCncptNm: [
			{
				required: true,
				message: "내용을 입력하세요.",
				trigger: "blur",
			},
			{
				validator: (rule, value) => {
					if (!isCamelCase(value)) {
						return Promise.reject("Camel Case로 입력하세요.");
					}
					return Promise.resolve();
				},
				trigger: "blur",
			}
    ],
    ctgryDataSttusMtcd: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",        
      }
    ],
	ctgrySortOdrg: [
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
	],
	ctgryDesc: [
		{
			max: 1000,
			message: "1000자 이하만 가능합니다.",
			trigger: "blur",
		}
	],
	ctgryEngNm: [
		{
			max: 128,
			message: "128자 이하만 가능합니다.",
			trigger: "blur",
		}
	],
	ctgryEngDesc: [
		{
			max: 1000,
			message: "1000자 이하만 가능합니다.",
			trigger: "blur",
		}
	],
	ctgryMappgCd: [
		{
			max: 32,
			message: "32자 이하만 가능합니다.",
			trigger: "blur",
		}
	],
	cntryCd: [
		{
			max: 2,
			message: "2자 이하만 가능합니다.",
			trigger: "blur",
		}
	],
	ctgryTypeMtcd: [
		{
			max: 64,
			message: "64자 이하만 가능합니다.",
			trigger: "blur",
		}
	]	
  },
});

const EditCategoryInfo = async () => {
  let ruleForm = ruleFormRef.value;
  if (!ruleForm) return;
  let result = validate(false);
  if (result == true) {
 	return;
  }
  await ruleForm.validate((valid, fields) => {
    if (valid) {

      let categoryInfo = {
        ...state.category,
        regr: getLoginUserId(),
      };

      $axios
        .post($apiUrls.meta.resource.category.createCategory, categoryInfo)
        .then(() => {
          alert("카테고리 등록이 완료되었습니다.");
          resetCategoryData();
          emits("editCategoryInfo");
        })
        .catch((err) => {

          console.log(err);
					if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
						alert(err.response.data.message);
					} else {
						alert("카테고리 등록에 실패하였습니다.");
					}
        });
    } else {
      alert("입력 정보를 다시 한번 확인해주세요.");
    }
  });
};

const resetCategoryData = () => {

	state.category.ctgryId = "";
	state.category.upCtgryId = "";
	state.category.upCtgryNm = "";
	state.category.ctgryNm = "";
	state.category.ctgryRdfCncptNm = "";
	state.category.ctgryDataSttusMtcd = "use"; //등록 시, use default
	state.category.ctgrySortOdrg = 0;
	state.category.ctgryDesc = "";
	state.category.ctgryEngNm = "";
	state.category.ctgryEngDesc = "";
	state.category.ctgryMappgCd = "";
	state.category.cntryCd = "KR"; //등록 시, 한국 default
	state.category.ctgryTypeMtcd = "";
};

const changeCntryCd = (data) => {
	state.category.cntryCd = data;
};

const changeCtgryDataSttusMtcd = (data) => {
	state.category.ctgryDataSttusMtcd = data;
}

const changeCtgryTypeMtcd = (data) => {
	state.category.ctgryTypeMtcd = data;
}

const selectCategory = (payload) => {
  dialogVisibleSearch.value = false;
	state.category.upCtgryId = payload.data.ctgryId;
	state.category.upCtgryNm = payload.data.ctgryNm;	
};

const refreshCategory = () => {
	state.category.upCtgryId = "";
	state.category.upCtgryNm = "";
};

const cancelDialog = () => {
	emits("cancelDialog");
};

const isCamelCase = (word) => {
	return /^[a-z][a-zA-Z0-9]*$/.test(word);
}

// 카멜케이스 & 중복
const validate = (alertYn) => {
	let camelCaseYn = isCamelCase(state.category.ctgryRdfCncptNm);
	if (!camelCaseYn) {
		alert("Camel Case로 입력하세요.");
		return false;
	}
	let duplicateYn = null;
	$axios
		.get($apiUrls.meta.resource.category.checkCtgryRdfCncptNm, {
			params: {
				ctgryRdfCncptNm: state.category.ctgryRdfCncptNm,
				ctgryId: ""
			}
		})
		.then((res) => {
			duplicateYn = res.data.duplicated;
			if (duplicateYn == true) {
				alert("카테고리 RDF 개념명이 중복됩니다.");
			} else {
				if (alertYn) {
					alert("사용 가능합니다.");
				}
			}
		})
		.catch((err) => {
			console.log(err);
		});
	return duplicateYn;
}

</script>
<style lang="scss"></style>