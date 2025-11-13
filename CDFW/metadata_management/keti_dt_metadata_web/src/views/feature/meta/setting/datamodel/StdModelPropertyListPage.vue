<template>
	<div class="cntSec">
		<div class="boxSectionTit" style="margin-top: 0">
			<h3>[{{ state.modelInfo.modelNm }}] &nbsp; {{ state.modelInfo.modelLogicNm }}</h3>
		</div>
		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 표준 모델 프라퍼티 목록</h3>
			</div>
			<div class="boxCnt">
				<ModelPropertyList
				  typeModelYn = "N"
					:stdModelPrev=true
					:typeModelList="state.typeModelList"
					:modelPropertyList="state.modelPropertyList"
					:mandCdList="mandCdList"
					:modelId="route.query.modelId"
					:structdModelYn="state.structdModelYn"
					@modifyModelProperty="modifyModelProperty"
					@getModelPropertyList="detailModel"
				/>
			</div>
		</div>
		<div class="boxLayout" style="height: auto;" v-show="state.modelPropertyDelHistList.length > 0">
			<div class="boxTit">
				<h3>메타데이터 표준 모델 프라퍼티 삭제 이력 ( {{delCount}} 건)</h3>
			</div>
				<ModelPropertyDeleteHistList
					:modelPropertyDelHistList="state.modelPropertyDelHistList"
				/>
		</div>
	</div>
</template>
<script setup>
import ModelPropertyList from "@/components/meta/datamodel/ModelPropertyList.vue";
import ModelPropertyDeleteHistList from "@/components/meta/datamodel/ModelPropertyDeleteHistList.vue";

import { getGlobalProperties,	isWriteYn } from "@/assets/js/common.js";
import { ref, reactive, onMounted, getCurrentInstance, computed } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";

const store = useStore();
const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const dialogVisibleEdit = ref(false);
const delCount = ref(null);

onMounted(() => {
	getCodeList();
	detailModel(route.query.modelId);
});

const state = reactive({
	typeModelList: [],
	modelPropertyList:[],
	modelPropertyDelHistList:[],
	modelInfo: {},
	structdModelYn: ""
});

const getCodeList = async () => {
	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00004"]
		},
	});
};

const mandCdList = computed(()=> store.getters["MetaStore/getStoreMetaCodeList"]("MCG00004"));
const detailModel =(modelId) => {
	getModel(modelId);
	getModelPropertyList(modelId);
}

const getModel = (modelId) => {
	$axios
		.get(util.format($apiUrls.meta.data.model.getModel, modelId))
		.then((res)=> {
			state.modelInfo = res.data;
		})
		.catch((err)=>{
			console.log(err);
		});
};

const getModelPropertyList = (modelId) => {
	state.modelPropertyList.length = 0;
	state.modelPropertyDelHistList.length = 0;
	delCount.value=0;
	$axios
		.get(util.format($apiUrls.meta.data.std.getStdModelPropertyList ,modelId), {
			params: {
				modelPrptyDelYn: ""
			}
		})
		.then((res) => {
			let rownum1 = 0;
			let rownum2 = 0;
			res.data.list.map((data, idx) => {
				if(data.modelPrptyDelYn == 'N') {
					data.rownum = ++rownum1;
					data.modelPrptySortOdrg = data.rownum;
					data.structdModelYn = state.structdModelYn;
					state.modelPropertyList.push(data);
				} else {
					data.rownum = ++rownum2;					
					delCount.value = delCount.value + 1;
					state.modelPropertyDelHistList.push(data);
				}
			});
			if(delCount.value == null) delCount.value = 0;
		})
		.catch((err) => {
			console.log(err);
		});
};

const modifyModelProperty = async (payload) => {
	let result = confirm("수정 하시겠습니까?");
	if (result) {
		if(state.structdModelYn == 'Y') {
			if(!payload.data.every(element => element.modelPrptyMandMtcd=='required' && (element.tblColnMappgNm == '' || element.tblColnMappgNm == null))) {	//필수구분이 필수고 테이블 칼럼매핑명이 없으면
				alert("정형모델의 경우 테이블 칼럼매핑명은 필수입니다.");
				return;
			}
		}
		let modelProperty = [];
		payload.data.map((data)=>{modelProperty.push(data)});
		$axios
			.put(util.format($apiUrls.meta.data.typemodelproperty.modifyModelProperty, route.query.modelId), modelProperty)
			.then(() => {
				alert("수정이 완료되었습니다.");
				detailModel(route.query.modelId);
			})
			.catch((err) => {
				console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("모델 프라퍼티 수정에 실패하였습니다.");
				}						
		})
	}
}

</script>
<style lang="scss"></style>
