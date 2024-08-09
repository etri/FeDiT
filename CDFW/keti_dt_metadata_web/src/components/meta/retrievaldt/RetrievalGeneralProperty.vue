<template>
	<!-- <div class="boxLayout"> -->

		<div class="boxTit">
			<h3>[ {{ generalProperty.prptyNm }} ] {{ generalProperty.prptyLogicNm }} 프라퍼티 (총 {{ generalProperty.propertyListCnt
				? generalProperty.propertyListCnt : 0 }} 건)</h3>
			<!-- 10건 이상의 경우 페이징 처리를 위해, 상세 조회 modal 내에서 프라퍼티 목록을 조회. -->
			<div v-if="generalProperty.propertyListCnt >= props.minCntToDisplayButton
				&& 'geoJson' !== generalProperty.rangeDataTypeMtcd
				&& 'json' !== generalProperty.rangeDataTypeMtcd" class="btnSec taR">
				<el-button type="primary" @click="dialogVisibleSearchMetadata = true" >메타데이터 상세 조회</el-button>
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

		<div class="boxCnt" v-if="'geoJson' !== generalProperty.rangeDataTypeMtcd
			&& 'json' !== generalProperty.rangeDataTypeMtcd
			&& 'object_type' !== generalProperty.rangeModelTypeMtcd">
			<comn-list :tableHeader="arrTypePropertyTableHeader" :tableData="generalProperty.propertyList" :minHeight="100">
			</comn-list>
		</div>

		<div class="boxCnt" v-if="'geoJson' !== generalProperty.rangeDataTypeMtcd
			&& 'json' !== generalProperty.rangeDataTypeMtcd
			&& 'data_type' !== generalProperty.rangeModelTypeMtcd">
			<comn-list :tableHeader="objTypePropertyTableHeader" :tableData="generalProperty.propertyList" :minHeight="100">
				<template v-slot:medataVal="slotData">
					<span @click="goToMetadataManagePage1(slotData.row)" class="link-text">
						{{ slotData.row.medataVal }}
					</span>
				</template>
			</comn-list>
		</div>

		<!-- geoJson type -->
		<div class="boxCnt" v-if="'geoJson' === generalProperty.rangeDataTypeMtcd">
			<div v-for="(item, index) in generalProperty.propertyList" :key="item">
				<el-input type="textarea" v-model="item.geodataVal" disabled :autosize="{ minRows: 4, maxRows: 10}"></el-input>
				<!-- 지도 -->
				<div :id="`map_${generalProperty.prptyId}${index}`" class="mt5" style="width:100%;height:400px;border: var(--el-disabled-border-color) solid 1px;"></div>
			</div>
		</div>

		<!-- EtcJson type -->
		<div class="boxCnt" v-if="'json' === generalProperty.rangeDataTypeMtcd">
			<div v-for="item of generalProperty.propertyList" :key="item">
				<el-input type="textarea" v-model="item.medataVal" disabled	:autosize="{ minRows: 4 , maxRows: 10}"></el-input>
			</div>
		</div>

	<!-- </div> -->
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import MetadataDialogSearch from "@/components/meta/retrievaldt/MetadataDialogSearch.vue";
import MetadataDialogSinglePropertyInfo from "@/components/meta/retrievaldt/MetadataDialogSinglePropertyInfo.vue";

import { defineProps, nextTick, ref, onMounted, watch } from "vue";
import metaCommon from "@/assets/js/metaCommon.js";

const dialogVisibleSearchMetadata = ref(false); //메타데이터 검색 modal 
const dialogVisibleSingleInfoMetadata = ref(false); //메타데이터 단건 프라퍼티 정보 modal (test용)

const shapesMap = ref(new Map()); // Map

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

// object type property용 헤더
const objTypePropertyTableHeader = ref([
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
]);

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
		backPageName: props.backPageName
	});
}

const initMap = () => {
	if ('geoJson' != props.generalProperty.rangeDataTypeMtcd) return;

	if (!metaCommon.existKakaoMapApi()) return;

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

</script>
<style lang="scss" scoped></style>