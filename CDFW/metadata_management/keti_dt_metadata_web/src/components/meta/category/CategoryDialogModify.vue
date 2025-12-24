<template>
  <div class="dialog-area" id="codePopup">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>{{ curTitle }}</h3>
      </div>
      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRef"
          :model="category"
          :rules="rules"
          label-width="200px"
          class="demo-ruleForm"
        >
          <el-form-item label="카테고리 ID" prop="ctgryId">
            <el-input
              v-model="category.ctgryId"
              disabled
            ></el-input>
          </el-form-item>

					<el-form-item label="상위카테고리" prop="upCtgryNm">
						<div class="inline-area">
							<el-input style="width: 250px;" v-model="category.upCtgryNm" disabled />
							<el-button type="default" class="ml15" @click="dialogVisibleSearch = true"><el-icon class="icon icon-search"/></el-button>
							<el-button type="default" class="el-button--delete" @click="refreshCategory"><el-icon class="icon icon-refresh"/></el-button>
						</div>
						<el-dialog v-model="dialogVisibleSearch" title="카테고리 검색">
							<CategoryDialogSearch @selectCategory="selectCategory" />
						</el-dialog>								
					</el-form-item>					

          <el-form-item label="카테고리명" prop="ctgryNm">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="category.ctgryNm"
            ></el-input>
          </el-form-item>


		  <el-form-item label="카테고리 RDF 개념명" prop="ctgryRdfCncptNm">
			<div class="inline-area">
			  <el-input v-bind:disabled="curPage != 'modify'" v-model="category.ctgryRdfCncptNm"></el-input>
			  <el-button type="primary" class="ml15" @click="validate(true)">중복 확인</el-button>
			</div>
		  </el-form-item>

          <el-form-item label="카테고리 설명" prop="ctgryDesc">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="category.ctgryDesc"
            ></el-input>
          </el-form-item>

          <el-form-item label="카테고리 영문명" prop="ctgryEngNm">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="category.ctgryEngNm"
            ></el-input>
          </el-form-item>

          <el-form-item label="카테고리 영문설명" prop="ctgryEngDesc">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="category.ctgryEngDesc"
            ></el-input>
          </el-form-item>

          <el-form-item label="카테고리 코드" prop="ctgryMappgCd">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="category.ctgryMappgCd"
            ></el-input>
          </el-form-item>

					<el-form-item label="국가 코드">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-select 
								v-bind:disabled="curPage != 'modify'"
								v-model="category.cntryCd"
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
								v-bind:disabled="curPage != 'modify'"
								v-model="category.ctgryTypeMtcd"
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
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="category.ctgrySortOdrg"
			  type="number"
			  maxlength="5"
            ></el-input>
          </el-form-item>

					<el-form-item label="데이터 상태">
					<el-row :gutter="20">
						<el-col :span="24">
							<el-select 
								v-bind:disabled="curPage != 'modify'"
								v-model="category.ctgryDataSttusMtcd"
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
      <el-button type="primary"
        v-if="isAmdYn(route.meta.auth) && curPage == 'modify'"
        @click="modifyCategoryInfo"
        >저장</el-button
      >
      <el-button type="primary" plain
        v-if="isDelYn(route.meta.auth) && curPage == 'modify'"
        @click="deleteCategoryInfo"
        >삭제</el-button
      >
      <el-button type="default" @click="cancelDialog">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import CategoryDialogSearch from "@/components/meta/category/CategoryDialogSearch.vue";

import { ref, defineProps, defineEmits } from "vue";
import { useRoute } from "vue-router";
import { isAmdYn, isDelYn, getGlobalProperties } from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const route = useRoute();

const props = defineProps({
  category: {
    type: Object,
    required: true,
  },  
  curPage: {
    type: String,
    required: false,
  },
  curTitle: {
    type: String,
    required: false,
  },

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

const emits = defineEmits([
  "cancelModifyDialog",
  "modifyCategoryInfo",
  "deleteCategoryInfo",
]);

const ruleFormRef = ref(null);
const dialogVisibleSearch = ref(false);

const rules = ref({
	ctgryNm: [
		{
			required: true,
			message: "내용을 입력하세요.",
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
	
});

const changeCntryCd = (data) => {
	props.category.cntryCd = data;
};

const changeCtgryDataSttusMtcd = (data) => {
	props.category.ctgryDataSttusMtcd = data;
}

const changeCtgryTypeMtcd = (data) => {
	props.category.ctgryTypeMtcd = data;
}

const cancelDialog = () => {
  emits("cancelModifyDialog");
};

const modifyCategoryInfo = async () => {
  emits("modifyCategoryInfo", { data: props.category, ruleFormRef });
};

const deleteCategoryInfo = () => {
  emits("deleteCategoryInfo", { data: props.category });
};

const selectCategory = (payload) => {
	dialogVisibleSearch.value = false;
	//검색결과(상위카테고리ID) == 현재 창의 카테고리ID
	if (payload.data.ctgryId == props.category.ctgryId) {
		alert('현재의 카테고리ID와 동일한 카테고리ID를 상위카테고리 ID로 할 수 없습니다.');
		return;
	}

	props.category.upCtgryId = payload.data.ctgryId;
	props.category.upCtgryNm = payload.data.ctgryNm;
};

const refreshCategory = () => {
	props.category.upCtgryId = "";
	props.category.upCtgryNm = "";
};

const isCamelCase = (word) => {
	return /^[a-z][a-zA-Z0-9]*$/.test(word);
}

const validate = (alertYn) => {
	let camelCaseYn = isCamelCase(props.category.ctgryRdfCncptNm);
	if (!camelCaseYn) {
		alert("Camel Case로 입력하세요.");
		return false;
	}
	let duplicateYn = null;
	$axios
		.get($apiUrls.meta.resource.category.checkCtgryRdfCncptNm, {
			params: { 
				ctgryRdfCncptNm: props.category.ctgryRdfCncptNm,
				ctgryId:  props.category.ctgryId
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