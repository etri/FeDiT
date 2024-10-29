<template>
	<div class="dialog-area">
		<!-- 페이징 필요한 property 목록 (data_type) -->
		<div v-if="'data_type' === props.rangeModelTypeMtcd
			&& 'geoJson' !== props.rangeDataTypeMtcd && 'json' !== props.rangeDataTypeMtcd">
			<!-- 메타데이터 검색 -->
			<MetadataDialogSearchForm :medataSetId="props.medataSetId" :prptyNm="props.prptyNm" :langMtcdList="langMtcdList"
				@searchMetadataList="searchMetadataList" />
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
		<!-- 페이징 필요한 property 목록 (object_type) -->
		<div v-if="'object_type' === props.rangeModelTypeMtcd">
			<!-- 메타데이터 검색 -->
			<MetadataObjectDialogSearchForm :medataSetId="props.medataSetId" :prptyNm="props.prptyNm"
				@searchMetadataObjectList="searchMetadataObjectList" />
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

import { reactive, onMounted, defineProps, ref } from "vue";
import { useStore } from "vuex";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const store = useStore();

const langMtcdList = ref([]); //언어코드 리스트

const props = defineProps({
	medataSetId: {
		type: String,
		required: true,
	},
	prptyNm: {
		type: String,
		required: true,
	},
	rangeModelTypeMtcd: { // (data_type or object_type)
		type: String,
		required: true,
	},
	rangeDataTypeMtcd: {
		type: String,
		required: false, //rangeModelTypeMtcd == object_type 의 경우, null 임.
	},
	backPageName: {
		type: String,
		required: false
	},
	isPublicApi: {
		type: Boolean,
		required: false,
		default: false
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
	getMetadataList();
	getMetadataObjectList();
});

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

const searchMetadataList = (payload) => {
	state.pageInfo.medataSetId = props.medataSetId;
	state.pageInfo.prptyNm = props.prptyNm;
	state.pageInfo.sortOrder = payload.pageInfo.sortOrder;
	state.pageInfo.medataVal = payload.pageInfo.medataVal;
	state.pageInfo.langMtcd = payload.pageInfo.langMtcd;
	getMetadataList();
};

const searchMetadataObjectList = (payload) => {
	state.pageInfo.medataSetId = props.medataSetId;
	state.pageInfo.prptyNm = props.prptyNm;
	state.pageInfo.sortOrder = payload.pageInfo.sortOrder;
	state.pageInfo.sortField = payload.pageInfo.sortField;
	state.pageInfo.medataVal = payload.pageInfo.medataVal;
	state.pageInfo.medataValNm = payload.pageInfo.medataValNm;
	getMetadataObjectList();
};

const getMetadataList = () => {
	let medataSetId = props.medataSetId;
	let propertyNm = props.prptyNm;
	let getUrl = $apiUrls.meta.resource.metadatasets.getMetadataListBySetPropertyNm;
	if (props.isPublicApi) getUrl = $apiUrls.publicpage.meta.resource.metadatasets.getMetadataListBySetPropertyNm;

	$axios
		.get(util.format(getUrl, medataSetId, propertyNm), {
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
			//페이징을 적용하면서, 번호 컬럼을 보여주기 위해 정렬된 목록 내 object에 번호 속성 부여
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
	let propertyNm = props.prptyNm;
	let getUrl = $apiUrls.meta.resource.metadatasets.getMetadataListBySetPropertyNm;
	if (props.isPublicApi) getUrl = $apiUrls.publicpage.meta.resource.metadatasets.getMetadataListBySetPropertyNm;

	$axios
		.get(util.format(getUrl, medataSetId, propertyNm), {
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
			//페이징을 적용하면서, 번호 컬럼을 보여주기 위해 정렬된 목록 내 object에 번호 속성 부여
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