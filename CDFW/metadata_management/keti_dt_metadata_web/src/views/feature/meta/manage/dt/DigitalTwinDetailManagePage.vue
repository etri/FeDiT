<template>
	<div class="cntSec">

		<div class="boxSectionTit" style="margin-top: 0">
			<h3>{{ medataSet.medataSetNm }}</h3>
		</div>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>디지털트윈 정보</h3>
			</div>
			<div class="boxCnt">
				<DigitalTwinDetail :medataSet="medataSet" :dataStatusList="dataStatusList"
					:rdfSearchParam="medataSet" :emptyPrptyShowYn="emptyPrptyShowYn" :isUnsavedData="isUnsavedData" />
			</div>
		</div>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 목록 {{ state.pageInfoForMetadataListWithSetId.totalListSize }} 건</h3>
			</div>
			<div class="boxCnt">
				<MetadataListForSave :dataEditableYn="state.dataEditableYn" 
				  :metadataListWithSetId="state.metadataListWithSetId"
					:medataSet="medataSet"
					:generalPropertyMap="state.generalPropertyMap"
					:refPropertyNmMap="state.refPropertyNmMap"
					:backPageName="'DigitalTwinDetailManagePage'"
					@modifyMetadataListForSaveInfo="modifyMetadataListForSaveInfo"
					@on-data-changed="onSingleDataChanged"
					/><!-- :totalPage="state.pageInfoForMetadataListWithSetId.totalListSize" -->
			</div>
		</div>

		<div class="boxLayout" v-for="prptyNm of state.geoJsonPropertyNmList" :key="prptyNm">
			<GeneralProperty :dataEditableYn="state.dataEditableYn" :generalProperty="state.arrayPropertyMap[prptyNm]"
				:medataSetId="medataSet.medataSetId" :medataSet="medataSet" @data-saved="generalPropertyDataSaved" />
		</div>

		<div class="boxLayout" v-for="prptyNm of state.jsonEtcPropertyNmList" :key="prptyNm">
			<GeneralProperty :dataEditableYn="state.dataEditableYn" :generalProperty="state.arrayPropertyMap[prptyNm]"
				:medataSetId="medataSet.medataSetId" :medataSet="medataSet" @data-saved="generalPropertyDataSaved" />
		</div>

		<div class="boxLayout" v-for="prptyNm of state.arrayPropertyNmList" :key="prptyNm">
			<GeneralProperty :dataEditableYn="state.dataEditableYn" :generalProperty="state.arrayPropertyMap[prptyNm]"
				:medataSetId="medataSet.medataSetId" :medataSet="medataSet" :backPageName="'DigitalTwinDetailManagePage'" @data-saved="generalPropertyDataSaved" />
		</div>

	</div>
</template>
<script setup>
import DigitalTwinDetail from "@/components/meta/dt/DigitalTwinDetail.vue";
import MetadataListForSave from "@/components/meta/dt/MetadataListForSave.vue";
import GeneralProperty from "@/components/meta/dt/GeneralProperty.vue";

import { reactive, ref, onMounted, getCurrentInstance, watch, onBeforeMount, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getGlobalProperties, isReadYn, isEmpty } from "@/assets/js/common.js";
import { useStore } from "vuex";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;
const store = useStore();
const route = useRoute();
const router = useRouter();

const dataStatusList = ref([]);
const medataSet = ref({});
const emptyPrptyShowYn = ref("N");
const isUnsavedData = ref(false);

const arrEditableSttus = ['regist', 'unused'];

const state = reactive({
	metadataListWithSetId: [],

	pageInfoForMetadataListWithSetId: {
		totalListSize: 0,		
	},

	arrayPropertyNmList: [], 
	generalPropertyMap: {},
	pageInfoGeneralProperty: {
		totalListSize: 0,
		modelDataSttusMtcdNm: '',
	},
	arrayPropertyMap: {},

	objPropertyList: [],
	pageInfoObjProperty: {
		totalListSize: 0,
	},

	geoJsonPropertyNmList: [],
	geoJsonPropertyMap: {},

	jsonEtcPropertyNmList: [],

	dataEditableYn: 'N',
	refPropertyNmMap: {},
});

watch(
	() => route.query.medataSetId,
	(cur, prev) => {
		if (!isEmpty(route.query.medataSetId)) initAllMetadataSetInfoExceptMtcd();
	},
	{ deep: true }
)

onBeforeMount(async () => {
	await router.isReady();
	let medataSetId = route.query.medataSetId;

});

onMounted(() => {
	getMetaCodeList();
	initAllMetadataSetInfoExceptMtcd();

	$emitter.on("initMetadataSetInfo", () => {
		initAllMetadataSetInfoExceptMtcd();
	});
	$emitter.on("modifyMetadataSetInfo", () => {
		getMetadataSetDetail();
		getMetadataListWithSetIdForSave();
	});

});

onUnmounted(() => {
	$emitter.off("initMetadataSetInfo");
	$emitter.off("modifyMetadataSetInfo");
})

const initAllMetadataSetInfoExceptMtcd = () => {
	getModelInfoBySetId();
	getMetadataSetDetail();
	getMetadataListWithSetIdForSave();
};

const getMetadataSetDetail = () => {
	let medataSetId = route.query.medataSetId;
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataSet, medataSetId))
		.then((res) => {
			medataSet.value = res.data;

			if (arrEditableSttus.findIndex(x => x === res.data.medataSetSttusMtcd) != -1) {
				state.dataEditableYn = 'Y';
			} else {
				state.dataEditableYn = 'N';
			}
		})
		.catch((err) => {
			console.log(err);
		});
};

const getMetadataListWithSetIdForSave = () => {
	let medataSetId = route.query.medataSetId;
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadatasetListForSave, medataSetId), {
			params: {
				cntPrptyYn: "N"
			}
		})
		.then((res) => {
			let list = res.data;
			state.metadataListWithSetId = JSON.parse(JSON.stringify(list));
			state.pageInfoForMetadataListWithSetId.totalListSize = res.data.length;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getModelInfoBySetId = async () => {
	let medataSetId = route.query.medataSetId;
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getModelInfoBySetId, medataSetId))
		.then((res) => {

			state.refPropertyNmMap = res.data.refPropertyNmMap;
			state.arrayPropertyNmList = res.data.arrayPropertyNmList;
			state.generalPropertyMap = res.data.propertyMap;
			state.geoJsonPropertyNmList = res.data.geoJsonPropertyNmList;
			state.jsonEtcPropertyNmList = res.data.jsonEtcPropertyNmList;

			propertySet(state.geoJsonPropertyNmList, state.generalPropertyMap);
			propertySet(state.arrayPropertyNmList, state.generalPropertyMap);
			propertySet(state.jsonEtcPropertyNmList, state.generalPropertyMap);

		}).catch((err) => {
			console.log(err);
		});
};

const propertySet = (arrayPropertyNmList, generalPropertyMap) => {

	let medataSetId = route.query.medataSetId;

	for (let propertyNm of arrayPropertyNmList) {

		for (let property in generalPropertyMap) {

			if (propertyNm === generalPropertyMap[property].prptyId) {

				let arrTypeProperty = { ...generalPropertyMap[property], propertyList: [], propertyListCnt: 0 };
				propertyListSetByPrptNm(medataSetId, propertyNm, arrTypeProperty);
			}
		}
	}
};

const propertyListSetByPrptNm = (medataSetId, propertyNm, arrTypeProperty) => {

	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataListBySetPropertyNm, medataSetId, propertyNm))
		.then((res) => {
			state.arrayPropertyMap[propertyNm].propertyList = res.data.list;
			state.arrayPropertyMap[propertyNm].propertyListCnt = res.data.page.totalListSize;	
		})
		.catch((err) => {
			console.log(err);
		});

	state.arrayPropertyMap[propertyNm] = { ...arrTypeProperty };
};

const getMetaCodeList = async () => {
	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00001"],
		},
	});

	const List = store.getters["MetaStore/getStoreMetaCodeList"]("MCG00001");
	dataStatusList.value = List;
};

const modifyMetadataListForSaveInfo = (payload) => {
	let medataSetId = route.query.medataSetId;
	$axios
		.put(
			util.format($apiUrls.meta.resource.metadatasets.modifyMetadataByMulti, medataSetId),
			payload.data
		)
		.then(() => {
			isUnsavedData.value = false;
			alert("저장되었습니다.");
			getMetadataListWithSetIdForSave();
		})
		.catch((err) => {
			console.log(err);
			if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
				alert(err.response.data.message);
			} else {
				alert("저장에 실패하였습니다.");
			}
		});
};

const generalPropertyDataSaved = (payload) => {
	const { prptyId, prptyNm } = payload;
	let arrTypeProperty = state.arrayPropertyMap[prptyNm];
	propertyListSetByPrptNm(medataSet.value.medataSetId, prptyNm, arrTypeProperty);
}

const onSingleDataChanged = (currList) => {
	let isChanged = false;
	for (let i = 0; i < state.metadataListWithSetId.length; i++) {
		let originData = state.metadataListWithSetId[i];
		let currData   = currList[i];
		if (currData.medataVal == '') {
			if (originData.medataVal == '') {
				currData.medataVal = '';				
			} else {
				currData.medataVal = null;
			}
		}
		if (originData.medataVal != currData.medataVal) {
			isChanged = true;
			break;
		}
	}

	isUnsavedData.value = isChanged;
}

</script>
<style lang="scss"></style>