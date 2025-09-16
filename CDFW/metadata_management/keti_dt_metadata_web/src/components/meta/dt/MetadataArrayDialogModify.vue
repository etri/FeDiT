<template>
	<div class="dialog-area">

		<!-- geoJson type data 편집 form -->
		<div v-if="'geoJson' === props.generalProperty.rangeDataTypeMtcd || metaConst.ARR_ETCJSON_DATATYPE.includes(props.generalProperty.rangeDataTypeMtcd)">
			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 값 정보</h3><!--json, geoJson -->
				</div>


				<div class="boxCnt">
					<div class="btnSec taR mb10" v-show="dataEditableYn == 'Y'">
						<el-button type="primary" @click="deleteMetadataInfoDataType" plain>삭제</el-button>
						<el-button type="primary" @click="initMetadata" plain>초기화</el-button>
						<el-button type="primary" @click="editMetadataInfoDataType">저장</el-button>
					</div>

					<el-form label-width="150px" label-position="right">
						<el-row>
							<el-col :span="24">
								<el-form-item label="메타데이터 값">
									<el-input type="textarea" v-model="state.writedMetadata.medataVal" :autosize="{minRows: 4, maxRows: 10}"></el-input>
								</el-form-item>
							</el-col>
						</el-row>
					</el-form>
				</div>
			</div>

			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 목록</h3><!--json, geoJson -->
				</div>

				<div v-if="'geoJson' === props.generalProperty.rangeDataTypeMtcd" class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<MetadataDialogSearchList 
							:metadataList="state.metadataList" 
							:totalPage="state.pageInfo.totalListSize"
							:curPage="state.pageInfo.curPage"
							:rangeModelTypeMtcd="props.generalProperty.rangeModelTypeMtcd"
							:rangeDataTypeMtcd="props.generalProperty.rangeDataTypeMtcd"
							@pageMove="pageMove" 
							@chooseMetadataFromGeoJson="chooseMetadataFromGeoJson" />
					</div>
				</div>

				<div v-if="metaConst.ARR_ETCJSON_DATATYPE.includes(props.generalProperty.rangeDataTypeMtcd)" class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<MetadataDialogSearchList 
							:metadataList="state.metadataList" 
							:totalPage="state.pageInfo.totalListSize"
							:curPage="state.pageInfo.curPage"
							:rangeModelTypeMtcd="props.generalProperty.rangeModelTypeMtcd"
							:rangeDataTypeMtcd="props.generalProperty.rangeDataTypeMtcd"
							@pageMove="pageMove" 
							@chooseMetadataFromEtcJson="chooseMetadataFromEtcJson"
							@goToDetailPage="goToDetailPage"  />
					</div>
				</div>

			</div>
		</div>

		<!-- property 목록과 편집 form (data_type 중 json 형식은 제외) -->
		<div v-if="'data_type' === props.generalProperty.rangeModelTypeMtcd 
			&& 'geoJson' !== props.generalProperty.rangeDataTypeMtcd
			&& !metaConst.ARR_ETCJSON_DATATYPE.includes(props.generalProperty.rangeDataTypeMtcd) ">

			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 값 정보</h3>
				</div>
				
				<div class="boxCnt">
					<div class="btnSec taR mb10" v-show="dataEditableYn == 'Y'">
						<el-button type="primary" @click="deleteMetadataInfoDataType" plain>삭제</el-button>
						<el-button type="primary" @click="initMetadata" plain>초기화</el-button>
						<el-button type="primary" @click="editMetadataInfoDataType">저장</el-button>
					</div>

					<el-form label-width="150px" label-position="right">
						<el-row v-show="'langString' === props.generalProperty.rangeDataTypeMtcd"><!-- langString 경우만 언어 선택 가능 -->
							<el-col :span="24">
								<el-form-item label="언어">
									<el-select v-model="state.writedMetadata.langMtcd" placeholder="선택">
										<!-- <el-option label="해당없음" value=""></el-option> -->
										<el-option v-for="item in langMtcdList" :key="item.mtcd" 
											:label="`[${item.mtcd}] ${item.mtcdNm}`"
											:value="item.mtcd" />
									</el-select>
								</el-form-item>
							</el-col>
						</el-row>
						<el-row>
							<el-col :span="24">
								<el-form-item label="메타데이터 값">

									<el-input type="textarea" v-model="state.writedMetadata.medataVal"></el-input>

								</el-form-item>
							</el-col>
						</el-row>
					</el-form>
				</div>
			</div>

			<!-- 메타데이터 검색 -->
			<MetadataDialogSearchForm :medataSetId="props.medataSetId" :prptyNm="props.generalProperty.prptyNm" :langMtcdList="langMtcdList"
				@searchMetadataList="searchMetadataList" />

			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 검색결과</h3>
				</div>
				<div class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<MetadataDialogSearchList 
							:metadataList="state.metadataList" 
							:totalPage="state.pageInfo.totalListSize"
							:curPage="state.pageInfo.curPage"
							@pageMove="pageMove" 
							@chooseMetadataFromDataType="chooseMetadataFromDataType" />
					</div>
				</div>
			</div>
		</div>

		<!-- property 목록과 편집 form  (object_type) -->
		<div v-if="'object_type' === props.generalProperty.rangeModelTypeMtcd"> 

			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 값 정보</h3>
				</div>

				<div class="boxCnt">
					<div class="btnSec taR mb10" v-show="dataEditableYn == 'Y'">
						<el-button type="primary" @click="deleteMetadataInfoObjectType" plain>삭제</el-button>
						<el-button type="primary" @click="dialogVisibleEdit = true">신규 추가</el-button>
						<el-button type="primary" @click="dialogVisibleSearchMetadataSet = true">선택 추가</el-button>
					</div>
					<!-- 신규 추가 시, 해당 modal을 통한 data create -->
					<el-dialog v-model="dialogVisibleEdit" title="메타데이터 셋 편집">
						<MetadataSetDialogEdit 
							:model="{
								/* 2023-07-04 다른 모델 선택할 수 있도록 유형 모델만 넘김
								   2023-09-19 표준 모델 정보가 있는 경우 기본값으로 선택되도록 설정
								 */
								typeModelId: props.generalProperty.rangeTypeModelId,
								typeModelNm: props.generalProperty.rangeTypeModelNm,
								modelId: props.generalProperty.stdModelId,
							  modelNm: props.generalProperty.stdModelNm
							}"							
							modelDisabledYn="Y"
						  :cnctInfo="{
								cnctMedataSetId: props.medataSetId,
								cnctMedataSetNm: props.medataSet.medataSetNm,
								cnctPrptyId: props.generalProperty.prptyId,
							}"
							cnctInfoDisabledYn="Y"
							:countryCodeList="countryCodeList" 
							:idSchmObjectList="idSchmObjectList"
							@cancelDialog="cancelDialog"
							@editMetadataSetInfo="editMetadataSetInfo" /> <!-- 해당 화면 내 셋ID와 프라퍼티ID는 신규 메타데이터 셋 등록 시, 상위 ID 로 이용 -->						
					</el-dialog>
					<!-- 선택 추가 시, 해당 modal을 통한 data create -->
					<el-dialog v-model="dialogVisibleSearchMetadataSet" title="메타데이터 셋 검색">
						<!-- 유형이 같은 모델을 선택할 수 있게 하자. 동일 모델만으로 요구 조건이 바뀔 경우는 다시 searchMode="model" 
						<MetadataSetDialogSearch 
						  searchSttusCd="" 
							searchMode="model"						
							:modelId="props.generalProperty.rangeModelId" 
							:modelNm="props.generalProperty.rangeModelNm" 				
							@selectedRow="createMetadataSetBySelectedInfo" />
							2023-09-19 표준 모델 정보가 있는 경우 기본값으로 검색되도록 모델명에 설정
						-->
						<MetadataSetDialogSearch 
						  searchSttusCd="" 
							searchMode="type"						
							:typeModelId="props.generalProperty.rangeTypeModelId" 
							:typeModelNm="props.generalProperty.rangeTypeModelNm"
							:modelNm="props.generalProperty.stdModelNm"
							:searchMetaTypeFix='true' :searchMetaTypeId="props.generalProperty.rangeTypeModelId" 
							@selectedRow="createMetadataSetBySelectedInfo" />						
					</el-dialog>

					<div class="ly-table">
						<el-form label-width="160px" label-position="right">
							<el-row>
								<el-col :span="12">
									<el-form-item label="메타데이터 셋 ID">{{ state.originValSet.medataSetId }}</el-form-item>
								</el-col>
								<el-col :span="12">
									<el-form-item label="메타데이터 상태">{{ state.originValSet.medataSetSttusMtcdNm }}</el-form-item>
								</el-col>
							</el-row>

							<el-row>
								<el-col :span="12">
									<el-form-item label="메타데이터 유형">{{ state.originValSet.typeModelNm }} {{	state.originValSet.typeModelLogicNm }}</el-form-item>
								</el-col>
								<el-col :span="12">
									<el-form-item label="메타데이터 모델">{{ state.originValSet.modelNm }} {{	state.originValSet.modelLogicNm }}</el-form-item>
								</el-col>
							</el-row>

							<el-row>
								<el-col :span="24">
									<el-form-item label="메타데이터 셋 명">{{ state.originValSet.medataSetNm }}</el-form-item>
								</el-col>
							</el-row>

							<el-row>
								<el-col :span="24">
									<el-form-item label="메타데이터 셋 논리명">{{ state.originValSet.medataSetLogicNm }}</el-form-item>
								</el-col>
							</el-row>

							<el-row>
								<el-col :span="24">
									<el-form-item label="메타데이터 설명">{{ state.originValSet.medataSetDesc }}</el-form-item>
								</el-col>
							</el-row>

						</el-form>
					</div>
				</div>

			</div>

			<!-- 메타데이터 검색 -->
			<MetadataObjectDialogSearchForm 
				:medataSetId="props.medataSetId" 
				:prptyNm="props.generalProperty.prptyNm"
				@searchMetadataObjectList="searchMetadataObjectList" />

			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 검색결과</h3>
				</div>
				<div class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<MetadataObjectDialogSearchList 
							:metadataObjectList="state.metadataObjectList"
							:totalPage="state.pageInfo.totalListSize" 
							:curPage="state.pageInfo.curPage"
							:rangeTypeModelId="props.generalProperty.rangeTypeModelId"
							:backPageName="props.backPageName"
							@chooseMetadataFromObjectType="chooseMetadataFromObjectType"
							@objectPageMove="objectPageMove" 
							@goToDetailPage="goToDetailPage" />
					</div>
				</div>
			</div>
		</div>

	</div>
</template>
<script setup>
import MetadataDialogSearchForm from "@/components/meta/retrievaldt/MetadataDialogSearchForm.vue";
import MetadataDialogSearchList from "@/components/meta/retrievaldt/MetadataDialogSearchList.vue";
import MetadataObjectDialogSearchForm from "@/components/meta/retrievaldt/MetadataObjectDialogSearchForm.vue";
import MetadataObjectDialogSearchList from "@/components/meta/retrievaldt/MetadataObjectDialogSearchList.vue";
import MetadataSetDialogEdit from "@/components/meta/dataset/MetadataSetDialogEdit.vue";
import MetadataSetDialogSearch from "@/components/meta/dt/MetadataSetDialogSearch.vue";

import { reactive, onMounted, defineProps, ref, getCurrentInstance, defineExpose, defineEmits } from "vue";
import { useStore } from "vuex";
import { getGlobalProperties, isEmpty } from "@/assets/js/common.js";
import util from "util";
import metaConst from "@/assets/js/metaConst.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
  getCurrentInstance().appContext.config.globalProperties.$emitter;
const store = useStore();

const langMtcdList = ref([]); //언어코드 리스트
const countryCodeList = ref([]);
const idSchmObjectList = ref([]);

const dialogVisibleEdit = ref(false); //메타데이터 셋 편집 modal(object type 신규 등록)
const dialogVisibleSearchMetadataSet = ref(false); //메타데이터 셋 검색 modal (object type 선택 등록)

const emits = defineEmits(["goToDetailPage"]);
const props = defineProps({
	dataEditableYn: {
		type: String,
		required: true,
	},
	medataSetId: {
		type: String,
		required: true,
	},
	medataSet: {
		type: Object,
		required: true,
	},
	generalProperty: {
		type: Object,
		required: true,
	},
	backPageName: {
		type: String,
		required: false,
	}
});

const state = reactive({
	originMetadata: {},
	originValSet: {}, // object type 경우 상단 메타데이터 값 정보
	metadataList: [], //object type이 아닌 부분만 따로 담은 목록
	metadataObjectList: [], //object type 에 해당하는 부분만 따로 담은 목록
	pageInfo: {
		medataSetId: "",
		prptyNm: "",
		sortOrder: "",
		sortField: "",
		medataVal: "",
		langMtcd: "",
		medataValNm: "",
		curPage: 1,
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	},

	writedMetadata: {}, //수정 요청하려는 input value
	isDataSaved: false,
	newMetadataValList: [],
	delMetadataValList: [],
});

onMounted(() => {
	getMetaCodeList();
	getCountryCodeList();
	getIdSchmObjectList();
	if ('data_type' === props.generalProperty.rangeModelTypeMtcd) {
		getMetadataList();
	} else {
		getMetadataObjectList();
	}
});

const goToDetailPage = () => {
	emits("goToDetailPage");
}

const getMetaCodeList = async () => {
	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00006"], // 언어코드
		},
	});

	const List = store.getters["MetaStore/getStoreMetaCodeList"]("MCG00006");  // 언어코드
	langMtcdList.value = List;
};

const getCountryCodeList = async () => {
  await store.dispatch("MetaStore/getCountryCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
  });

  const CountryCodeList = store.getters["MetaStore/getStoreCountryCodeList"];
  countryCodeList.value = CountryCodeList;
};

const getIdSchmObjectList = async () => {

await store.dispatch("MetaStore/getMetaCodeList", {
	axios: $axios,
	apiUrls: $apiUrls,
	params: {
		mtcdGrpIdList: ["MCG00029"],
	},
});

const List = store.getters["MetaStore/getStoreMetaCodeList"]("MCG00029");
idSchmObjectList.value = [];
for(var i=0; i < List.length; i++) {
	if(List[i].upMtcd === "id_schm_object") {
		idSchmObjectList.value.push(List[i]);
	}
}
};

const searchMetadataList = (payload) => {
	state.pageInfo.medataSetId = props.medataSetId;
	state.pageInfo.prptyNm = props.generalProperty.prptyNm;
	state.pageInfo.sortOrder = payload.pageInfo.sortOrder;
	state.pageInfo.medataVal = payload.pageInfo.medataVal;
	state.pageInfo.langMtcd = payload.pageInfo.langMtcd;
	getMetadataList();
};

const searchMetadataObjectList = (payload) => {
	state.pageInfo.medataSetId = props.medataSetId;
	state.pageInfo.prptyNm = props.generalProperty.prptyNm;
	state.pageInfo.sortOrder = payload.pageInfo.sortOrder;
	state.pageInfo.sortField = payload.pageInfo.sortField;
	state.pageInfo.medataVal = payload.pageInfo.medataVal;
	state.pageInfo.medataValNm = payload.pageInfo.medataValNm;
	getMetadataObjectList();
};

const getMetadataList = () => {

	let medataSetId = props.medataSetId;
	let propertyNm = props.generalProperty.prptyNm;

	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataListBySetPropertyNm, medataSetId, propertyNm), {
			params: {
				curPage: state.pageInfo.curPage,
				medataSetId: medataSetId,
				prptyNm: propertyNm,
				sortOrder: state.pageInfo.sortOrder,
				medataVal: state.pageInfo.medataVal,
				langMtcd: state.pageInfo.langMtcd,
			},
		})
		.then((res) => {
			state.metadataList = res.data.list.map((item, idx) => {
				item.rownum = state.pageInfo.pageListSize * (state.pageInfo.curPage - 1) + idx + 1;
				return item;
			});
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getMetadataObjectList = () => {
	let medataSetId = props.medataSetId;
	let propertyNm = props.generalProperty.prptyNm;

	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataListBySetPropertyNm, medataSetId, propertyNm), {
			params: {
				curPage: state.pageInfo.curPage,
				medataSetId: medataSetId,
				prptyNm: propertyNm,
				sortOrder: state.pageInfo.sortOrder,
				sortField: state.pageInfo.sortField,
				medataVal: state.pageInfo.medataVal,
				medataValNm: state.pageInfo.medataValNm,
			},
		})
		.then((res) => {
			state.metadataObjectList = res.data.list.map((item, idx) => {
				item.rownum =  state.pageInfo.pageListSize * (state.pageInfo.curPage - 1) + idx + 1;
				return item;
			});
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getMetadatasetBySetId = (setId) => {
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataSet, setId))
		.then((res) => {
			state.originValSet = res.data;
		})
		.catch((err) => {
			console.log(err);
		});
};

const editMetadataInfoDataType = async () => {
	let valid = false;

	try {
		let rangeModelTypeMtcd = props.generalProperty.rangeModelTypeMtcd;
		let rangeDataTypeMtcd = props.generalProperty.rangeDataTypeMtcd;
		valid = await validationMetadataFormDataType(state.writedMetadata, rangeModelTypeMtcd, rangeDataTypeMtcd);
	} catch (error) {
		console.log(error);
		return;
	}

	if (valid) {
		let modeType = (!state.originMetadata.medataId?.trim()) ? "등록" : "저장";
		let result = confirm(`메타데이터를 ${modeType} 하시겠습니까?`);

		if (result) {

			let medataSetId = props.medataSetId;
			let prptyId = props.generalProperty.prptyId;

			let metadataInfo = {
				...state.writedMetadata,
				medataSetId,
				prptyId
			};
			let params = [];
			params.push(metadataInfo);

			$axios
				.put(
					util.format($apiUrls.meta.resource.metadatasets.modifyMetadataByMulti, medataSetId),
					params
				)
				.then(() => {
					state.isDataSaved = true;
					alert(`${modeType}되었습니다.`);
					getMetadataList();
					initMetadata();
				})
				.catch((err) => {
					console.log(err);
					if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
						alert(err.response.data.message);
					} else {
						alert(`${modeType}에 실패하였습니다.`);
					}
				});
		}


	} else {
		alert("입력 정보를 다시 한번 확인해주세요.");
	}
};

const deleteMetadataInfoDataType = () => {
	let medataId = state.originMetadata.medataId;
	if (!medataId?.trim()) {
		alert('삭제할 메타데이터를 선택해주세요.');
		return;
	}

	let result = confirm("삭제하시겠습니까?");
	if (result) {
		$axios.
			delete(util.format($apiUrls.meta.resource.metadatasets.deleteMetadata, medataId))
			.then(() => {
				state.isDataSaved = true;
				alert("삭제되었습니다.");
				getMetadataList();
				initMetadata();
			})
			.catch((err) => {
				console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("삭제에 실패하였습니다.");
				}
			});
	}
};

const deleteMetadataInfoObjectType = () => {
	let medataId = state.originMetadata.medataId;
	if (!medataId?.trim()) {
		alert('삭제할 메타데이터를 선택해주세요.');
		return;
	}

	let result = confirm("삭제하시겠습니까?");
	if (result) {
		$axios.
			delete(util.format($apiUrls.meta.resource.metadatasets.deleteMetadata, medataId))
			.then(() => {
				const delData = {
					medataSetId: props.medataSetId,
					prptyId: props.generalProperty.prptyId,
					medataVal: state.originValSet.medataSetId,
					medataValNm: state.originValSet.medataValNm
				};
				state.delMetadataValList.push(delData);					
				state.isDataSaved = true;
				alert("삭제되었습니다.");
				getMetadataObjectList();
				initMetadata();
			})
			.catch((err) => {
				console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("삭제에 실패하였습니다.");
				}
			});
	}
};

function validationMetadataFormDataType(payload, rangeModelTypeMtcd, rangeDataTypeMtcd) {
	return new Promise((resolve, reject) => {
		if (!payload.medataVal?.trim()) {
			alert('메타데이터 값은 필수값입니다.');
			reject();
		}

		// data_type
		if ('data_type' === rangeModelTypeMtcd) {

			if ('langString' === rangeDataTypeMtcd) {
			
				if (isEmpty(payload.langMtcd)) {
					alert('언어 코드를 선택해 주세요.');
					reject();
				}			
				// if (!isEmpty(payload.langMtcd) && payload.langMtcd.length > 64) { //언어 코드 값이 빈 값이 아닐 때만 길이 체크
				// 	alert('언어 코드는 64자 이하여야 합니다.');
				// 	reject();
				// }			
				
			} else if ('geoJson' === rangeDataTypeMtcd) {

				//todo: 지리데이터 관련 validation 요구사항 생길 시 추가
 
			} 

		// object_type	
		} else {

		}

		resolve(true);
	});
}

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getMetadataList();
};

const objectPageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getMetadataObjectList();
};

const chooseMetadataFromGeoJson = (payload) => {

	state.writedMetadata = JSON.parse(JSON.stringify(payload.data));
	state.originMetadata = JSON.parse(JSON.stringify(payload.data));
	// geoJson의 경우, create or update 시, medataVal 속성에 매핑된 value가 추후 geodataVal 속성으로 조회된다.
	state.writedMetadata.medataVal = payload.data.geodataVal;//formattedGeoJson; 
};

const chooseMetadataFromEtcJson = (payload) => {
	state.writedMetadata = JSON.parse(JSON.stringify(payload.data));
	state.originMetadata = JSON.parse(JSON.stringify(payload.data));
};

const chooseMetadataFromDataType = (payload) => {
	state.writedMetadata = JSON.parse(JSON.stringify(payload.data));
	state.originMetadata = JSON.parse(JSON.stringify(payload.data));
	//console.log('writedMetadata ===>', state.writedMetadata);
};

const chooseMetadataFromObjectType = (payload) => {
	state.writedMetadata = JSON.parse(JSON.stringify(payload.data));
	state.originMetadata = JSON.parse(JSON.stringify(payload.data));
	//console.log('writedMetadata ===>', state.writedMetadata);
	//object type은 셀 클릭 시, 선택한 medataId로 메타데이터 조회 
	//getMetadataForObjectType(state.originMetadata.medataId);
	//todo: 추가적으로 노출 필요한 data를 같이 조회하여야 함
	getMetadatasetBySetId(state.writedMetadata.medataVal);
};

const initMetadata = () => {
	state.writedMetadata = {};
	state.originMetadata = {};
	state.originValSet   = {};
};

const editMetadataSetInfo = (medataSetId, medataSetNm) => {
	const newData = {
		medataSetId: props.medataSetId,
		prptyId: props.generalProperty.prptyId,
		medataVal: medataSetId,
		medataValNm: medataSetNm
	};
	state.newMetadataValList.push(newData);
	state.isDataSaved = true;
	dialogVisibleEdit.value = false;
	getMetadataObjectList();
}

const cancelDialog = () => {
	dialogVisibleEdit.value = false;
};

const createMetadataSetBySelectedInfo = (payload) => {
	//destructuring select value
	let { medataSetId, medataSetNm } = payload.rowData;
	let selectedMetadataSet = {
		medataSetId: props.medataSetId,
		prptyId: props.generalProperty.prptyId,
		medataVal: medataSetId
	};

	$axios
		.put(util.format($apiUrls.meta.resource.metadatasets.putMetadatasetsForRelation, props.medataSetId), selectedMetadataSet)
		.then(() => {
			const newData = {
				medataSetId: props.medataSetId,
				prptyId: props.generalProperty.prptyId,
				medataVal: medataSetId,
				medataValNm: medataSetNm
			};
			state.newMetadataValList.push(newData);			
			state.isDataSaved = true;
			alert("추가 등록되었습니다.");
			getMetadataObjectList(); //등록 후 object_type 목록 재검색
		})
		.catch((err) => {
			console.log(err);
			if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
				alert(err.response.data.message);
			} else {
				alert("등록에 실패하였습니다.");
			}
		});

	dialogVisibleSearchMetadataSet.value = false;
};

const isDataSaved = () => {
	return state.isDataSaved;
}

const getNewDataList = () => {
	return state.newMetadataValList;
}

const getDelDataList = () => {
	return state.delMetadataValList;
}

const initDialogData = () => {
	state.isDataSaved = false;
	state.newMetadataValList = [];
	state.delMetadataValList = [];
	initMetadata();
}

defineExpose({
	isDataSaved,
	getNewDataList,
	getDelDataList,
	initDialogData,
});

</script>
<style lang="scss" scoped></style>