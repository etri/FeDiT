<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="propertyList"
    >
      <template v-slot:btn="slotData" v-if="isAmdYn(route.meta.auth)">
        <el-button type="primary" size="small" @click="goToDetailDialog(slotData)">수정</el-button>
      </template>
      <template v-slot:btn="slotData" v-else-if="!isAmdYn(route.meta.auth) && isReadYn(route.meta.auth)">
        <el-button type="default" size="small" @click="goToDetailDialog(slotData)">조회</el-button>
      </template>
    </comn-list>
    <el-dialog v-model="dialogVisibleModify" v-bind:title="curTitle" :key="dialogKeyByEdit">
      <PropertyDialogModify
				:property="state.property"
				:propertyDef="state.propertyDef"
        :propertyChgHistList="state.propertyChgHistList"
				:curPage="curPage"
        :curTitle="curTitle"
        :dataStatusCdList="dataStatusCdList"
        :metaCodeGroupList="metaCodeGroupList"
        :domainModelList="domainModelList"
        @cancelModifyDialog="cancelModifyDialog"
        @modifyProperty="modifyProperty"
        @modifyPropertyDef="modifyPropertyDef"        
      />
    </el-dialog>
    <ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
  </div>   
</template>

<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import PropertyDialogModify from "@/components/meta/datamodel/PropertyDialogModify.vue";

import { isAmdYn, isReadYn, getGlobalProperties, nowTimestamp } from "@/assets/js/common.js";

import { ref, reactive, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import util from "util";
const route = useRoute();
const router = useRouter();
const curPage = ref("");
const curTitle = ref("");
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const dialogVisibleModify = ref(false);
const dialogKeyByEdit = ref('');
const $emitter = getCurrentInstance().appContext.config.globalProperties.$emitter;
const emits = defineEmits(["pageMove"]);
const props = defineProps({
	propertyList: {
		type: Array,
		required: true
	},
  dataStatusCdList: {
    type: Array,
    required: true
  },
  metaCodeGroupList: {
    type: Array,
    required: true
  },
	totalPage: {
		type: Number,
		required: true
	},
  curPage: {
    type: Number,
    required: true,
  },
  domainModelList: {
		type: Array,
		required: false,
	}
});

const state = reactive({
	property:{},
	propertyDef:{},
  propertyChgHistList: [],
	pageInfo: {
			curPage: 1,
			totalListSize: 0,
			pageListSize: 10,
			blockSize: 5,    
	}
});

const goToDetailDialog = (node) => {
  // state.property = {};
  // state.propertyDef = {};  
	if (isReadYn(route.meta.auth)) {
		$axios
			.get(util.format($apiUrls.meta.data.property.getProperty, node.row.prptyId))
			.then((res)=> {
        state.property.index = node.$index;
        state.property.prptyId = node.row.prptyId;
        state.property.upPrptyId = res.data.upPrptyId;
        state.property.upPrptyNm = res.data.upPrptyNm;
        state.property.prptyNm = res.data.prptyNm;
        state.property.prptyLogicNm = res.data.prptyLogicNm;
        state.property.cntPrptyYn = res.data.cntPrptyYn;
        state.property.cntModelId = res.data.cntModelId;
        state.property.dataArrayYn = res.data.dataArrayYn;
        state.property.prptyScrnIndcYn = res.data.prptyScrnIndcYn;
        state.property.prptyDataSttusMtcd = res.data.prptyDataSttusMtcd;
        state.property.prptySortOdrg = res.data.prptySortOdrg;
        state.property.prptyDesc = res.data.prptyDesc;
        state.property.regrInfo = res.data.prptyRegrId + " / " + res.data.prptyRegDt;
        state.property.amdrInfo = res.data.prptyAmdrId + " / " + res.data.prptyAmdDt;
        state.propertyDef.prptyId = res.data.prptyId;
        state.propertyDef.domnModelId = res.data.domnModelId;
        state.propertyDef.domnModelLogicNm = res.data.domnModelLogicNm;
        state.propertyDef.rangeModelId = res.data.rangeModelId;
        state.propertyDef.rangeModelNm = res.data.rangeModelNm;
        state.propertyDef.rangeMtcdGrpId = res.data.rangeMtcdGrpId;
        state.propertyDef.refPrptyId = res.data.refPrptyId;
        state.propertyDef.dataTypeMtcd = res.data.dataTypeMtcd;
        state.propertyDef.regrInfo = res.data.prptyDefRegrId + " / " + res.data.prptyDefRegDt;
        state.propertyDef.amdrInfo = res.data.prptyDefAmdrId + " / " + res.data.prptyDefAmdDt;
        res.data.prptyDefChgList.map((chg)=>{
          if(chg.prptyDefChgWhy !== null && chg.prptyDefChgWhy !== ""){
            chg.chgInfo = chg.prptyDefChgDt + " 사유 : " + chg.prptyDefChgWhy;
          }
          else{
            chg.chgInfo = chg.prptyDefChgDt;
          }
        })
        state.propertyChgHistList = res.data.prptyDefChgList;
			})
			.catch((err)=>{
				console.log(err);
			});

			if (isAmdYn(route.meta.auth)) {
				curPage.value = "modify";
				curTitle.value = "메타데이터 프라퍼티 편집"      
				} else {
				curPage.value = "detail";
				curTitle.value = "메타데이터 상세조회";
			}
			dialogVisibleModify.value = true;
      dialogKeyByEdit.value = nowTimestamp();
	} else {
    dialogVisibleModify.value = false;
    alert("읽기 권한이 없습니다.");
  }

};

const tableHeader = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 45,
    align: "center"
  },
  {
    prop: "prptyNm",
    label: "프라퍼티 명",
    width: 100,
  },
  {
    prop: "prptyLogicNm",
    label: "프라퍼티 논리명",
    width: 100,
  },
  {
    prop: "dataArrayYn",
    label: "데이터 배열 여부",
    width: 90,
  },
  {
    prop: "prptyDesc",
    label: "설명",
    width: 120,
  },
  {
    prop: "prptyDataSttusMtcdNm",
    label: "상태",
    width: 60,
  },
  {
    prop: "prptyAmdDt",
    label: "수정일",
    width: 80,
  },
  {
    prop: "domnModelNm",
    label: "도메인 모델",
    width: 100,
  },
  {
    prop: "rangeModelNm",
    label: "범위 모델",
    width: 100,
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

const modifyProperty = async (payload) => {
  let ruleForm = payload.ruleForm.value;
	if (!ruleForm) return;

	await ruleForm.validate((valid, fields) => {		
		if (valid) {
			let result = confirm("수정 하시겠습니까?");
			if (result) {
				let property = {
					...payload.data
				};
				$axios
					.put(util.format($apiUrls.meta.data.property.modifyProperty, props.propertyList[state.property.index].prptyId), property)
					.then(() => {
						alert("수정이 완료되었습니다.");
						dialogVisibleModify.value = false;
						$emitter.emit("initPropertyList");
					})
					.catch((err) => {
						console.log(err);
						if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
							alert(err.response.data.message);
						} else {
							alert("메타데이터 프라퍼티 수정에 실패하였습니다.");
						}						
					});
			}
		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
}
const modifyPropertyDef = async (payload) => {
  let ruleFormDef = payload.ruleFormDef.value;
	if (!ruleFormDef) return;

	await ruleFormDef.validate((valid, fields) => {
		if (valid) {
			let result = confirm("수정 하시겠습니까?");
			if (result) {
				let propertyDef = {
					...payload.data
				};
				$axios
					.put(util.format($apiUrls.meta.data.property.modifyPropertyDef, props.propertyList[state.property.index].prptyId), propertyDef)
					.then(() => {
						alert("수정이 완료되었습니다.");
						dialogVisibleModify.value = false;
						$emitter.emit("initPropertyList");
					})
					.catch((err) => {
						console.log(err);
						if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
							alert(err.response.data.message);
						} else {
							alert("메타데이터 프라퍼티 정의 수정에 실패하였습니다.");
						}						
					});
			}
		} else {
			alert("입력 정보를 다시 한번 확인해주세요.");
		}
	});
}
const cancelModifyDialog = () => {
  dialogVisibleModify.value = false;
}

</script>
<style lang="scss"></style>