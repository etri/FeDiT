<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="categoryList"
    >
      <template v-slot:btn="slotData" v-if="isAmdYn(route.meta.auth)">
        <el-button type="primary" size="small" @click="goToDetailDialog(slotData)" >수정</el-button>
      </template>
      <template v-slot:btn="slotData" v-else-if="!isAmdYn(route.meta.auth) && isReadYn(route.meta.auth)">
        <el-button type="default" size="small" @click="goToDetailDialog(slotData)">조회</el-button>
      </template>
    </comn-list>

    <el-dialog v-model="dialogVisibleModify" v-bind:title="curTitle">
      <CategoryDialogModify
        :category="state.category"
        :curPage="curPage"
        :curTitle="curTitle"
				:countryCodeList="countryCodeList"
				:dataStatusList="dataStatusList"
				:ctgryTypeList="ctgryTypeList"
        @cancelModifyDialog="cancelModifyDialog"
        @modifyCategoryInfo="modifyCategoryInfo"
        @deleteCategoryInfo="deleteCategoryInfo"
      />
    </el-dialog>		

    <ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
  </div>   
</template>

<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import CategoryDialogModify from "@/components/meta/category/CategoryDialogModify.vue";

import { ref, reactive, defineProps, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getUser, getLoginUserId } from "@/assets/js/auth.js";
import { 
  getGlobalProperties,
  isAmdYn, 
  isReadYn 
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
  getCurrentInstance().appContext.config.globalProperties.$emitter;
const user = getUser();

const curPage = ref("");
const curTitle = ref("");
const dialogVisibleModify = ref(false);

const emits = defineEmits(["pageMove"]);
const props = defineProps({
	categoryList: {
		type: Array,
		required: true,
	},
	totalPage: {
		type: Number,
		required: true,
	},
  curPage: {
    type: Number,
    required: true,
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

const state = reactive({
	categoryList: [],
	category: {},
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,    
  }
});

const tableHeader = ref([
  {
    prop: "upCtgryNm",
    label: "상위 카테고리 명",
    width: 100,
  },
  {
    prop: "upCtgryRdfCncptNm",
    label: "상위 카테고리 RDF 개념명",
    width: 100,
  },
  {
    prop: "ctgryNm",
    label: "카테고리 명",
    width: 100,
  },
  {
    prop: "ctgryRdfCncptNm",
    label: "카테고리 RDF 개념명",
    width: 100,
  },
  /** {
    prop: "ctgryMappgCd",
    label: "카테고리 코드",
    width: 100,
  }, */
  {
    prop: "ctgryId",
    label: "카테고리 ID",
    width: 100,
  },
  {
    prop: "ctgryDataSttusMtcdNm",
    label: "상태",
    width: 50,
  },
  {
    prop: "ctgryAmdDt",
    label: "수정일",
    width: 70,
  },
	{
    prop: "btn",
    label: "",
    width: 50,
    columnType: "custom",
  }
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const goToDetailDialog = (node) => {
  
  if (isReadYn(route.meta.auth)) {

		const index = node.$index;
		state.category.index = index;

		state.category.ctgryId = node.row.ctgryId;
		state.category.upCtgryId = node.row.upCtgryId;
		state.category.ctgryNm = node.row.ctgryNm;
		state.category.ctgryRdfCncptNm = node.row.ctgryRdfCncptNm;
		state.category.ctgryDesc = node.row.ctgryDesc;
		state.category.ctgryEngNm = node.row.ctgryEngNm;
		state.category.ctgryEngDesc = node.row.ctgryEngDesc;
		state.category.ctgryMappgCd = node.row.ctgryMappgCd;
		state.category.cntryCd = node.row.cntryCd;
		state.category.ctgryTypeMtcd = node.row.ctgryTypeMtcd;
		state.category.ctgrySortOdrg = node.row.ctgrySortOdrg;
		state.category.ctgryDataSttusMtcd = node.row.ctgryDataSttusMtcd;

    if (!isAmdYn(route.meta.auth)) {
      curPage.value = "detail";
      curTitle.value = "카테고리 상세조회";
    } else {
      curPage.value = "modify";
      curTitle.value = "카테고리 편집"      
    }
    dialogVisibleModify.value = true;

  } else {
    dialogVisibleModify.value = false;
    alert("읽기 권한이 없습니다.");
  }
};

const modifyCategoryInfo = async (payload) => {

	let ruleForm = payload.ruleFormRef.value;
	if (!ruleForm) return;
	let result = validate(true);
	if (result == true) {
		return;
	}
	await ruleForm.validate((valid, fields) => {
		if (valid) {
			let result = confirm("수정 하시겠습니까?");
			if (result) {

				let ctgryId = payload.data.ctgryId;

				let categoryInfo = {
					...payload.data,
					ctgryAmdrId: getLoginUserId(),
				};

				$axios
					.put(
						util.format($apiUrls.meta.resource.category.modifyCategory, ctgryId),
						categoryInfo
					)
					.then(() => {
						alert("수정이 완료되었습니다.");
						dialogVisibleModify.value = false;
						$emitter.emit("initCategoryList");
					})
					.catch((err) => {

						console.log(err);
						if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
							alert(err.response.data.message);
						} else {
							alert("카테고리 수정에 실패하였습니다.");
						}						
					});
			}
		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
};

const deleteCategoryInfo = (payload) => {

	let result = confirm("삭제하시겠습니까?")
	if (result) {
		
		let ctgryId = payload.data.ctgryId;
		$axios.
			delete(util.format($apiUrls.meta.resource.category.deleteCategory, ctgryId))
			.then(() => {
				alert("삭제 완료하였습니다.");
				dialogVisibleModify.value = false;
				$emitter.emit("initCategoryList");
			})
			.catch((err) => {

				console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("카테고리 삭제에 실패하였습니다.");
				}
			});
	}
};

const cancelModifyDialog = () => {
  dialogVisibleModify.value = false;
};

const isCamelCase = (word) => {
	return /^[a-z][a-zA-Z0-9]*$/.test(word);
}

const validate = (alertYn) => {
	let camelCaseYn = isCamelCase(state.category.ctgryRdfCncptNm);
	if (!camelCaseYn) {
		alert("Camel Case로 입력하세요.");
		return false;
	}
	let duplicateYn = null;
	$axios
		.get($apiUrls.meta.resource.category.checkCtgryRdfCncptNm, {
			params: { ctgryRdfCncptNm: state.category.ctgryRdfCncptNm }
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