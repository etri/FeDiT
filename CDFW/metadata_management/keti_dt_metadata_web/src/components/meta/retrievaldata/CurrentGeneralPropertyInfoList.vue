<template>
	<div>
		<!-- 복수 건 property 조회 (json, geoJson) -->
		<div
			v-if="'geoJson' === props.generalProperty.rangeDataTypeMtcd || metaConst.ARR_ETCJSON_DATATYPE.includes(props.generalProperty.rangeDataTypeMtcd)">
			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 목록</h3><!--json, geoJson -->
				</div>

				<div v-if="'geoJson' === props.generalProperty.rangeDataTypeMtcd" class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<MetadataDialogSearchList :metadataList="state.metadataList" :totalPage="state.pageInfo.totalListSize"
							:curPage="state.pageInfo.curPage" :rangeModelTypeMtcd="props.generalProperty.rangeModelTypeMtcd"
							:rangeDataTypeMtcd="props.generalProperty.rangeDataTypeMtcd" @pageMove="pageMove" />
					</div>
				</div>

				<div v-if="metaConst.ARR_ETCJSON_DATATYPE.includes(props.generalProperty.rangeDataTypeMtcd)" class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<MetadataDialogSearchList :metadataList="state.metadataList" :totalPage="state.pageInfo.totalListSize"
							:curPage="state.pageInfo.curPage" :rangeModelTypeMtcd="props.generalProperty.rangeModelTypeMtcd"
							:rangeDataTypeMtcd="props.generalProperty.rangeDataTypeMtcd" @pageMove="pageMove" />
					</div>
				</div>
			</div>
		</div>

		<!-- 복수 건 property 조회 (data_type) -->
		<div v-if="'data_type' === props.generalProperty.rangeModelTypeMtcd
			&& 'geoJson' !== props.generalProperty.rangeDataTypeMtcd
			&& !metaConst.ARR_ETCJSON_DATATYPE.includes(props.generalProperty.rangeDataTypeMtcd) ">
			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 검색</h3>
				</div>
				<div class="boxCnt">
					<MetadataDialogSearchForm :medataSetId="props.medataSetId" :prptyNm="props.generalProperty.prptyNm"
						:langMtcdList="langMtcdList" @searchMetadataList="searchMetadataList" />
				</div>
			</div>
			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 검색결과</h3>
				</div>
				<div class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<MetadataDialogSearchList :metadataList="state.metadataList" :totalPage="state.pageInfo.totalListSize"
							:curPage="state.pageInfo.curPage" @pageMove="pageMove" />
					</div>
				</div>
			</div>
		</div>

		<!-- 복수 건 property 조회 (object_type) -->
		<div v-if="'object_type' === props.generalProperty.rangeModelTypeMtcd">
			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 검색</h3>
				</div>
				<div class="boxCnt">
					<MetadataObjectDialogSearchForm :medataSetId="props.medataSetId" :prptyNm="props.generalProperty.prptyNm"
						@searchMetadataObjectList="searchMetadataObjectList" />
				</div>
			</div>
			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 검색결과</h3>
				</div>
				<div class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<MetadataObjectDialogSearchList :metadataObjectList="state.metadataObjectList"
							:totalPage="state.pageInfo.totalListSize" :curPage="state.pageInfo.curPage" :backPageName="backPageName"
							@objectPageMove="objectPageMove" />
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

import { reactive, onMounted, defineProps, ref, watch } from "vue";
import { useStore } from "vuex";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";
import metaConst from "@/assets/js/metaConst.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const store = useStore();

const langMtcdList = ref([]); //언어코드 리스트

const props = defineProps({
	medataSetId: {
		type: String,
		required: true,
	},
	generalProperty: {
		type: Object,
		reqruied: true
	},

	backPageName: {
		type: String,
		required: false,
	}
});

const state = reactive({
	metadata: {},
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
	}
});

onMounted(() => {
	getMetaCodeList();
	initAllMetadataInfo();
});

watch(
	() => props.generalProperty,
	() => {
		initAllMetadataInfo();
	},
	{ deep: true }
)

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

const initAllMetadataInfo = () => {
	getMetadataList();
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
			//페이지네이션이 적용되는 목록 컴포넌트에 필요한 번호 컬럼 속성을 set
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
			//페이지네이션이 적용되는 목록 컴포넌트에 필요한 번호 컬럼 속성을 set
			state.metadataObjectList = res.data.list.map((item, idx) => {
				item.rownum = state.pageInfo.pageListSize * (state.pageInfo.curPage - 1) + idx + 1;
				return item;
			});
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
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

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getMetadataList();
};

const objectPageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getMetadataObjectList();
};

</script>
<style lang="scss"></style>