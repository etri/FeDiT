<template>
	<div class="popWrap">
		<div class="popHeader">
			<span class="popTit">메타데이터 모델 프라퍼티 보기</span>
		</div>
		<div class="popBody">
			<div class="popCntSec">

				<div class="boxSectionTit" style="margin-top: 0">
					<h3>[{{ state.modelInfo.modelNm }}] &nbsp; {{ state.modelInfo.modelLogicNm }} </h3>
				</div>

				<div class="boxLayout">
					<div class="boxTit">
						<h3>모델 프라퍼티 목록 ({{ state.modelPropertyTotalListSize }} 건 - 필수: {{ state.modelPrptyRequireCount }} 건)</h3>
					</div>
					<div class="boxCnt">
						<comn-list :tableHeader="tableHeader" :tableData="state.modelPropertyList" highlight-current-row
							:defaultSort="{ prop: 'rownum', order: 'ascending' }">

							<template v-slot:prptyNm="slotData">
								<span :class="[isDisuseText(slotData.row, 'prptyNm')]">{{ slotData.row.prptyNm }}</span>
							</template>
							<template v-slot:prptyLogicNm="slotData">
								<span :class="[isDisuseText(slotData.row, '')]">{{ slotData.row.prptyLogicNm }}</span>
							</template>
							<template v-slot:domnModelNm="slotData">
								<span :class="[isDisuseText(slotData.row, '')]">{{ slotData.row.domnModelNm }}</span>
							</template>
							<template v-slot:rangeModelNm="slotData">
								<span :class="[isDisuseText(slotData.row, 'rangeModelNm')]">{{ slotData.row.rangeModelNm }}</span>
							</template>
							<template v-slot:modelPrptyMandMtcdNm="slotData">
								<span :class="[isDisuseText(slotData.row, '')]">{{ slotData.row.modelPrptyMandMtcdNm }}</span>
							</template>
							<template v-slot:tblColnMappgNm="slotData">
								<span :class="[isDisuseText(slotData.row, '')]">{{ slotData.row.tblColnMappgNm }}</span>
							</template>

						</comn-list>
					</div>
				</div>

			</div>
		</div>
	</div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";

import { routerPush, getCookie, isEmpty, getGlobalProperties } from "@/assets/js/common.js";
import { ref, reactive, getCurrentInstance, onMounted, onBeforeMount, watch } from "vue";
import util from "util";
import { useRoute, useRouter } from "vue-router";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const route = useRoute();
const router = useRouter();
const modelId = ref(route.query.modelId);
const typeModelYn = ref(route.query.typeModelYn);
const structdModelYn = ref(route.query.structdModelYn);

const state = reactive({
	modelGubunNm: "",

	typeModelList: [],
	modelPropertyList: [],
	modelPropertyTotalListSize: 0,
	modelPrptyRequireCount: 0,
	modelInfo: {},
	structdModelYn: "",
});

onMounted(() => {
	showColTblColnMappgNm();
	state.modelGubunNm = typeModelYn.value === 'Y' ? '유형' : '표준';
	initAllInfo();
});

onBeforeMount(async () => {
	await router.isReady();
	let modelId = route.query.modelId;
});

watch(
	() => route.query.modelId,
	(cur, prev) => {
		if (!isEmpty(route.query.modelId)) initAllInfo();
	},
	{ deep: true }
);

const initAllInfo = () => {
	getModelPropertyList();
	getDetailModel();
};

const showColTblColnMappgNm = () => {
	if (structdModelYn.value == 'Y') {
		let idx = tableHeader.value.findIndex(x => x.prop == 'tblColnMappgNm');
		if (idx == -1) {
			tableHeader.value.splice(7, 0, {
				prop: "tblColnMappgNm",
				label: "테이블 칼럼매핑명",
				width: 100,
				columnType: "custom"
			})
		}
	} else {
		let idx = tableHeader.value.findIndex(x => x.prop == 'tblColnMappgNm');
		if (idx != -1) tableHeader.value.splice(idx, 1);
	}
};

const tableHeader = ref([
	{
		prop: "rownum",
		label: "번호",
		width: 40,
		align: "center",
	},
	{
		prop: "prptyNm",
		label: "프라퍼티 명",
		width: 100,
		align: "left",
		columnType: "custom",
	},
	{
		prop: "prptyLogicNm",
		label: "프라퍼티 논리명",
		width: 100,
		align: "left",
		columnType: "custom",
	},
	{
		prop: "domnModelNm",
		label: "도메인 모델",
		width: 100,
		align: "left",
		columnType: "custom",
	},
	{
		prop: "rangeModelNm",
		label: "범위모델",
		width: 100,
		align: "left",
		columnType: "custom",
	},
	{
		prop: "modelPrptyMandMtcdNm",
		label: "필수구분",
		width: 80,
		align: "left",
		columnType: "custom"
	},
	{
		prop: "tblColnMappgNm",
		label: "테이블 칼럼매핑명",
		width: 100,
		columnType: "custom"
	},
]);
const isDisuseText = (row, prop) => {
	if (row.prptyDataSttusMtcd === 'disuse' && prop === 'prptyNm') return 'disuse-text-cause';
	if (row.rangeModelDataSttusMtcd === 'disuse' && prop === 'rangeModelNm') return 'disuse-text-cause';
	if (row.prptyDataSttusMtcd === 'disuse' || row.rangeModelDataSttusMtcd === 'disuse') return 'disuse-text';
	return '';
};

const getModelPropertyList = () => {
	state.modelPropertyTotalListSize = 0;
	state.modelPrptyRequireCount = 0;
	$axios
		.get(util.format($apiUrls.meta.data.model.getModelPropertyList, modelId.value), {
			params: {
				isPaging: false
			},
		})
		.then((res) => {
			let rownum1 = 0;
			res.data.list.map((data, idx) => {
				if (data.modelPrptyDelYn == 'N') {
					data.rownum = ++rownum1;
					data.modelPrptySortOdrg = data.rownum;
					data.structdModelYn = state.structdModelYn;
					state.modelPropertyList.push(data);
					state.modelPropertyTotalListSize++;
					if ('required' === data.modelPrptyMandMtcd) state.modelPrptyRequireCount++;
				}
			});
		})
		.catch((err) => {
			console.log(err);
		});
};

const getDetailModel = () => {
	$axios
		.get(util.format($apiUrls.meta.data.model.getModel, modelId.value))
		.then((res) => {
			if (res.data.structdModelYn == 'N') {
				res.data.structdModelExYn = res.data.structdModelYn + " (비정형)";
			} else {
				res.data.structdModelExYn = res.data.structdModelYn + " (정형)";
			}
			state.modelInfo = res.data;
		})
		.catch((err) => {
			console.log(err);
		});
}

</script>
<style lang="scss"></style>