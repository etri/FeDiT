<template>
	<div class="cntSec">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 유형 모델 목록</h3>
			</div>
			<div class="boxCnt">
				<TypeModelPropertyList				
				  :typeModelList="state.typeModelList"
					@detailModel="detailModel" />
			</div>
		</div>

		<div class="boxSectionTit">
			<div v-if="!state.typeModelInfo.modelNm">
				<h3>메타데이터 유형을 선택하세요.</h3>
			</div>
			<div v-else>
				<h3>[{{ state.typeModelInfo.modelNm }}] &nbsp; {{ state.typeModelInfo.modelLogicNm }}</h3>
			</div>
		</div>
		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 유형 모델 정보</h3>
			</div>
			<div class="boxCnt">
				<div class="ly-table">
					<TypeModelPropertyInfo
						:typeModelInfo="state.typeModelInfo" />
				</div>
			</div>
		</div>
		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 유형 모델 프라퍼티 목록</h3>
			</div>
			<div class="boxCnt">
				<ModelPropertyList
				  typeModelYn = "Y"
					:typeModelList="state.typeModelList"
					:modelPropertyList="state.modelPropertyList"
					:mandCdList="mandCdList"
					:structdModelYn="state.structdModelYn"
					:modelId="state.typeModelInfo.modelId"
					@modifyModelProperty="modifyModelProperty"
					@getModelPropertyList="detailModel"
				/>
			</div>
		</div>
		<div class="boxLayout" style="height: auto;" v-show="state.modelPropertyDelHistList.length > 0">
			<div class="boxTit">
				<h3>메타데이터 유형 모델 프라퍼티 삭제 이력 ( {{delCount}} 건)</h3>
			</div>
				<ModelPropertyDeleteHistList
					:modelPropertyDelHistList="state.modelPropertyDelHistList"
				/>
		</div>
	</div>
</template>
<script setup>
import TypeModelPropertyList from "@/components/meta/datamodel/TypeModelPropertyList.vue";
import TypeModelPropertyInfo from "@/components/meta/datamodel/TypeModelPropertyInfo.vue";
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
const digitalTwin = ref("DigitalTwin");

onMounted(() => {
	getCodeList();
	getTypeModelList();
});

const state = reactive({
	typeModelList: [],
	modelPropertyList:[],
	modelPropertyDelHistList:[],
	typeModelInfo: {},
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
const getTypeModelList = () => {
	$axios
		.get($apiUrls.meta.data.type.getTypeModelList , {
			params: {
				isPaging: false,
				searchMode: "type",
				modelDataSttusMtcd:"use"
			},
		})
		.then((res) => {
			state.typeModelList = res.data.list;
		})
		.catch((err) => {
			console.log(err);
		});
};
const detailModel =(modelId) => {
	detailTypeModel(modelId);
	getModelPropertyList(modelId);
}

const detailTypeModel = (modelId) => { 
	$axios
	.get(util.format($apiUrls.meta.data.model.getModel, modelId))
	.then((res) => {
		state.structdModelYn = res.data.structdModelYn;
		if(res.data.structdModelYn == 'N') { 			
			res.data.structdModelYn += " (비정형)";
		} else {
			res.data.structdModelYn += " (정형)";
		}
		state.typeModelInfo = res.data;
	})
	.catch((err) => {
		console.log(err);
	});
}

const getModelPropertyList = (modelId) => {	
	state.modelPropertyList.length = 0;
	state.modelPropertyDelHistList.length = 0;
	delCount.value=0;
	$axios
		.get(util.format($apiUrls.meta.data.typemodelproperty.getTypeModelPropertyList ,modelId), {
			params: {
				modelPrptyDelYn: ""
			}
		})
		.then((res) => {
			let rownum1 = 0;
			let rownum2 = 0;			
			res.data.list.map((data) => {
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
			.put(util.format($apiUrls.meta.data.typemodelproperty.modifyModelProperty, state.typeModelInfo.modelId), modelProperty)
			.then(() => {
				alert("수정이 완료되었습니다.");
				detailModel(state.typeModelInfo.modelId);
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
