<template>
	<!-- <div class="boxLayout"> -->

		<div class="boxTit">
			<h3>[ {{ generalProperty.prptyNm }} ] {{ generalProperty.prptyLogicNm }} 프라퍼티 (총 {{ generalProperty.propertyListCnt
				? generalProperty.propertyListCnt : 0 }} 건)</h3>
			<div class="btnSec taR">
				<!-- 메타데이터 상세 조회 버튼 -->
				<el-button v-if="generalProperty.propertyListCnt >= props.minCntToDisplayButton
					&& 'geoJson' !== generalProperty.rangeDataTypeMtcd
					&& !metaConst.ARR_ETCJSON_DATATYPE.includes(generalProperty.rangeDataTypeMtcd)"
					type="primary" @click="dialogVisibleSearchMetadata = true">
					메타데이터 상세 조회
				</el-button>
				<!-- 장바구니 버튼 (digitalTwinObjectData 타입, 외부 검색 경로에서만 표시) -->
				<el-button v-if="showObjectDataCartButton"
					type="default" @click="handleAddToCartForObjectData">
					<img src="@/assets/images/meta/cart/icon_basket.png" alt="장바구니" class="btn-icon-basket" /> 담기
				</el-button>
				<!-- JSON 보기 버튼 -->
				<el-button v-if="metaConst.ARR_ETCJSON_DATATYPE.includes(generalProperty.rangeDataTypeMtcd) && generalProperty.propertyListCnt > 0"
					type="primary" @click="showJson(generalProperty.propertyList[0].medataVal)">
					JSON 보기
				</el-button>
			</div>
		</div>
		<!-- 프라퍼티 목록 상세 조회 modal -->
		<el-dialog v-model="dialogVisibleSearchMetadata" :title="`메타데이터 검색 - [ ${generalProperty.prptyNm} ] 프라퍼티`" width="80%" top="7vh">
			<MetadataDialogSearch
				:medataSetId="medataSet.medataSetId"
				:prptyNm="generalProperty.prptyNm"
				:rangeModelTypeMtcd="generalProperty.rangeModelTypeMtcd"
				:rangeDataTypeMtcd="generalProperty.rangeDataTypeMtcd"
				:backPageName="backPageName"
				:isPublicApi="isPublicApi" />
		</el-dialog>

		<!--해당 페이지 내에서는 미사용이나, test용 프라퍼티 목록 단건 조회 modal -->
		<el-dialog v-model="dialogVisibleSingleInfoMetadata" title="메타데이터 정보">
			<MetadataDialogSinglePropertyInfo :medataSetId="props.medataSet.medataSetId" :prptyNm="generalProperty.prptyNm"
				:rangeModelTypeMtcd="generalProperty.rangeModelTypeMtcd" :rangeDataTypeMtcd="generalProperty.rangeDataTypeMtcd" />
		</el-dialog>

		<!-- json 아닌 일반 data_type -->
		<div class="boxCnt" v-if="'geoJson' !== generalProperty.rangeDataTypeMtcd
			&& !metaConst.ARR_ETCJSON_DATATYPE.includes(generalProperty.rangeDataTypeMtcd)
			&& 'object_type' !== generalProperty.rangeModelTypeMtcd">
			<comn-list :tableHeader="arrTypePropertyTableHeader" :tableData="generalProperty.propertyList" :minHeight="100">
			</comn-list>
		</div>

		<!-- Object type -->
		<div class="boxCnt" v-if="'object_type' === generalProperty.rangeModelTypeMtcd">
			<comn-list :tableHeader="objTypePropertyTableHeader" :tableData="generalProperty.propertyList" :minHeight="100">
				<template v-slot:medataVal="slotData">
					<span @click="goToMetadataManagePage1(slotData.row)" class="link-text">
						{{ slotData.row.medataVal }}
					</span>
				</template>
				<!-- 장바구니 버튼 (digitalTwinObjects이고 iframe 모드일 때만) -->
				<template v-if="showCartButton" v-slot:cart="slotData">
					<el-button type="default" size="small" @click="handleAddToCartFromList(slotData.row)">
						<img src="@/assets/images/meta/cart/icon_basket.png" alt="장바구니" class="btn-icon-basket" /> 담기
					</el-button>
				</template>
			</comn-list>
		</div>

		<!-- geoJson type -->
		<div class="boxCnt" v-if="'geoJson' === generalProperty.rangeDataTypeMtcd">
			<div v-for="(item, index) in generalProperty.propertyList" :key="item">
				<el-input type="textarea" v-model="item.geodataVal" disabled :autosize="{ minRows: 4, maxRows: 10}"></el-input>
				<!-- 지도 -->
				<div v-if="kakaoMapShow" :id="`map_${generalProperty.prptyId}${index}`" class="mt5" style="width:100%;height:400px;border: var(--el-disabled-border-color) solid 1px;"></div>
			</div>
		</div>

		<!-- EtcJson type -->
		<div class="boxCnt" v-if="metaConst.ARR_ETCJSON_DATATYPE.includes(generalProperty.rangeDataTypeMtcd)" >
			<div v-for="item of generalProperty.propertyList" :key="item">
				<el-input	type="textarea"	v-model="item.medataVal" disabled :autosize="{ minRows: 4, maxRows: 10 }"></el-input>
			</div>
		</div>

	<!-- </div> -->
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import MetadataDialogSearch from "@/components/meta/retrievaldt/MetadataDialogSearch.vue";
import MetadataDialogSinglePropertyInfo from "@/components/meta/retrievaldt/MetadataDialogSinglePropertyInfo.vue";

import { defineProps, nextTick, ref, computed, onMounted, watch } from "vue";
import metaCommon from "@/assets/js/metaCommon.js";
import metaConst from "@/assets/js/metaConst.js";
import { getGlobalProperties } from "@/assets/js/common.js";
import { addToCart, useFeditCart } from "@/assets/js/feditUtil.js";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const { isCartEnabled } = useFeditCart();

const dialogVisibleSearchMetadata = ref(false); //메타데이터 검색 modal
const dialogVisibleSingleInfoMetadata = ref(false); //메타데이터 단건 프라퍼티 정보 modal (test용)

const kakaoMapShow = ref(false);
const shapesMap = ref(new Map()); // Map

const emits = defineEmits(["selectedProperty"]);

const props = defineProps({
	generalProperty: {
		type: Object,
		required: true
	},
	medataSet: {
		type: Object,
		required: true,
	},
	medataSetId: {
		type: String,
		required: false,
	},
	backPageName: {
		type: String,
		required: false,
		default: 'RetrievalMetadataSetPage'
	},
	isPublicApi: {
		type: Boolean,
		required: false,
		default: false
	},
	minCntToDisplayButton: {
		type: Number,
		required: false,
		default: 10
	}
});

// digitalTwinObjects 프로퍼티 여부 확인
const isDigitalTwinObjects = computed(() => props.generalProperty.prptyNm === 'digitalTwinObjects');

// digitalTwinObjectData 프로퍼티 여부 확인
const isDigitalTwinObjectData = computed(() => props.generalProperty.prptyNm === 'digitalTwinObjectData');

// 장바구니 버튼 표시 여부 (외부 검색 경로 + 해당 프로퍼티 타입)
const showCartButton = computed(() => isCartEnabled.value && isDigitalTwinObjects.value);
const showObjectDataCartButton = computed(() => isCartEnabled.value && isDigitalTwinObjectData.value);

// array type 중 object 형식이 아닌 property용 헤더
const arrTypePropertyTableHeader = ref([
  {
    prop: "",
    label: "번호",
    width: 45,
    align: "center",
		type: "index", // pagination없이 사용 가능한 번호 column
  },
	{
		prop: "medataVal",
		label: "메타데이터 값",
		width: 450,
	},
	{
		prop: "langMtcd",
		label: "언어",
		width: 100,
	},
]);

// object type property용 헤더 (장바구니 버튼 조건부 포함)
const objTypePropertyTableHeader = computed(() => {
	const baseHeaders = [
		{
			prop: "",
			label: "번호",
			width: 45,
			align: "center",
			type: "index",
		},
		{
			prop: "medataVal",
			label: "메타데이터 값",
			width: 150,
			columnType: "custom",
		},
		{
			prop: "medataValNm",
			label: "값의 메타데이터 셋 명",
			width: 200,
		},
		{
			prop: "medataValSttusMtcdNm",
			label: "상태",
			width: 100,
		},
		{
			prop: "medataValAmdDt",
			label: "수정일",
			width: 100,
		}
	];

	// digitalTwinObjects일 때만 장바구니 컬럼 추가
	if (showCartButton.value) {
		baseHeaders.push({
			prop: "cart",
			label: "장바구니",
			width: 80,
			align: "center",
			columnType: "custom",
		});
	}

	return baseHeaders;
});

onMounted(() => {
	initInfo();
});

watch (() => props.generalProperty.propertyList,
  (cur, prev) => {
    //console.log(`props.generalProperty.propertyList watch`, props.generalProperty.propertyList);
    initInfo();
  },
  { deep: true }
);

const initInfo = () => {
	if ('geoJson' === props.generalProperty.rangeDataTypeMtcd) {
		nextTick(() => {
			initMap();
		});
	}
}

const goToMetadataManagePage1 = (payload) => {
	metaCommon.goToMetadataManagePage({
		medataSetId: payload.medataVal,
		typeModelId: props.generalProperty.rangeTypeModelId,
		backPageName: props.backPageName,
	});
}

const initMap = () => {
	if ('geoJson' != props.generalProperty.rangeDataTypeMtcd) return;

	if (!metaCommon.existKakaoMapApi()) return;
	if (kakaoMapShow.value === false) kakaoMapShow.value = true;

	for (let idx in props.generalProperty.propertyList) {
		// console.log(`initMap --------- idx: ${idx}`);
		let item = props.generalProperty.propertyList[idx];
		// console.log(item.geodataVal);
		const geometryObj = JSON.parse(item.geodataVal);
		const shapesId = `${item.prptyId}${idx}`;

		// 지도 생성
		const mapId = `map_${item.prptyId}${idx}`;
		const map = metaCommon.createKakaoMapWithGeo(mapId, geometryObj);
		// console.log(`initMap --------- mapId: ${mapId} zoomLevel: ${map.getLevel()}`);

		// 도형 그리기
		metaCommon.drawShapesOnMap(map, shapesMap.value, shapesId, geometryObj);

		// 줌 레벨에 따라 크기 조절
		kakao.maps.event.addListener(map, 'zoom_changed', () => {
			const zoomLevel = map.getLevel();
			// console.log(`mapId:${mapId} zoom_changed -----  zoomLevel: ${zoomLevel} shapesId:${shapesId}`);
			metaCommon.clearShapes(shapesMap.value, shapesId);
			metaCommon.drawShapesOnMap(map, shapesMap.value, shapesId, geometryObj);
		});
	}
}

const showJson = (json) => {
	emits("selectedProperty", JSON.parse(json));
};

// digitalTwinObjectData 타입용 핸들러 (EtcJson 버튼)
const handleAddToCartForObjectData = async () => {
	const dtoid = props.medataSet.medataSetId;
	const name = props.medataSet.medataSetNm;
	const digitalTwinId = '';
	const digitalTwinName = '';

	await addToCartWithSchema({ dtoid, name, digitalTwinId, digitalTwinName });
};

// digitalTwinObjects 목록용 핸들러 (테이블 행)
const handleAddToCartFromList = async (row) => {
	const dtoid = row.medataVal;
	const name = row.medataValNm;
	const digitalTwinId = props.medataSet.medataSetId;
	const digitalTwinName = props.medataSet.medataSetNm;

	await addToCartWithSchema({ dtoid, name, digitalTwinId, digitalTwinName });
};

// 공통 장바구니 추가 로직
const addToCartWithSchema = async ({ dtoid, name, digitalTwinId, digitalTwinName }) => {
	try {
		// jsonSchema 조회 (해당 DO의 다운로드 > JSON과 동일한 API)
		const schemaResponse = await $axios.get(
			util.format($apiUrls.meta.resource.metadataapi.getDataMapFromMetadataSet, dtoid),
			{ params: { arrayDataLimitYn: "N" } }
		);
		const jsonSchema = schemaResponse.data;

		// 장바구니에 추가
		const success = addToCart({
			jsonSchema,
			dtoid,
			name,
			digitalTwinId,
			digitalTwinName,
		});

		if (success) {
			alert('장바구니에 추가되었습니다.');
		} else {
			alert('장바구니 추가에 실패했습니다.');
		}
	} catch (err) {
		console.error('[addToCartWithSchema] 오류:', err);
		alert('장바구니 추가 중 오류가 발생했습니다.');
	}
};

</script>
<style lang="scss" scoped>
/* 버튼 내 커스텀 아이콘 이미지 */
.btn-icon-basket {
    width: 16px;
    height: 16px;
    vertical-align: middle;
    margin-right: 6px;
    display: inline-block;
}
.el-button.is-circle .btn-icon-basket {
    margin-right: 0;
    width: 14px;
    height: 14px;
}
</style>
