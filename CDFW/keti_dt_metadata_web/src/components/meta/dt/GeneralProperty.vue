<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>
				[ {{ generalProperty.prptyNm }} ] {{ generalProperty.prptyLogicNm }}
				프라퍼티 (총 {{ generalProperty.propertyListCnt ? generalProperty.propertyListCnt : 0 }} 건)
			</h3>
			<div class="btnSec taR">
				<el-button type="primary" @click="dialogVisibleModifyMetadata = true">
					값 {{ dataEditableYn == 'Y' ? '편집' : '조회' }}
				</el-button>
			</div>
		</div>
		<div class="boxCnt">

			<el-dialog v-model="dialogVisibleModifyMetadata"
				:title="`메타데이터 값 ${dataEditableYn == 'Y' ? '편집' : '조회'} - [ ${generalProperty.prptyNm} ] 프라퍼티`"
				:before-close="onBeforeCloseDialogModifyMetadata">
				<MetadataArrayDialogModify ref="dialogModifyMetadataRef" :dataEditableYn="dataEditableYn"
					:medataSetId="medataSetId" :medataSet="medataSet" :generalProperty="generalProperty"
					:backPageName="backPageName" 
					@goToDetailPage="dialogVisibleModifyMetadata = false;" />
			</el-dialog>

			<div class="ly-table">
				<el-form label-width="160px" label-position="right">
					<el-row>
						<el-col :span="12">
							<el-form-item label="필수 구분">{{ generalProperty.modelPrptyMandMtcdNm }}</el-form-item>
						</el-col>
						<el-col :span="12">
							<el-form-item label="범위 모델">{{ generalProperty.rangeModelNm }}</el-form-item>
						</el-col>
					</el-row>
					<el-row>
						<el-col :span="24">
							<el-form-item label="값 설명(예제)">{{ generalProperty.modelPrptyValExam }}</el-form-item>
						</el-col>
					</el-row>
				</el-form>
			</div>

			<!-- json 형식이 아닌 array data type -->
			<div class="mt10" v-if="'geoJson' !== generalProperty.rangeDataTypeMtcd
				&& 'json' !== generalProperty.rangeDataTypeMtcd
				&& 'object_type' !== generalProperty.rangeModelTypeMtcd">
				<comn-list :tableHeader="arrTypePropertyTableHeader" :tableData="generalProperty.propertyList" :minHeight="100">
				</comn-list>
			</div>

			<!-- Object type -->
			<div class="mt10" v-if="'geoJson' !== generalProperty.rangeDataTypeMtcd
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

			<!-- GeoJson type -->
			<div v-if="'geoJson' === generalProperty.rangeDataTypeMtcd" class="mt10">
				<div v-for="item of generalProperty.propertyList" :key="item">
					<el-form label-position="right">
						<el-row>
							<el-col :span="24">
								<el-form-item label="">
									<el-input type="textarea" v-model="item.geodataVal" disabled :autosize="{ minRows: 4 , maxRows: 10}"></el-input>
								</el-form-item>
							</el-col>
						</el-row>
					</el-form>
				</div>
			</div>

			<!-- EtcJson type -->
			<div v-if="'json' === generalProperty.rangeDataTypeMtcd" class="mt10">
				<div v-for="item of generalProperty.propertyList" :key="item">
					<el-form label-position="right">
						<el-row>
							<el-col :span="24">
								<el-form-item label="">
									<el-input type="textarea" v-model="item.medataVal" disabled :autosize="{ minRows: 4 , maxRows: 10}"></el-input>
								</el-form-item>
							</el-col>
						</el-row>
					</el-form>
				</div>
			</div>

		</div>
	</div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import MetadataArrayDialogModify from "@/components/meta/dt/MetadataArrayDialogModify.vue";

import { defineProps, reactive, ref, onMounted, getCurrentInstance } from "vue";
import metaCommon from "@/assets/js/metaCommon.js";

const emits = defineEmits(["dataSaved"]);

const dialogVisibleModifyMetadata = ref(false); //메타데이터 배열 편집 팝업
const dialogModifyMetadataRef = ref(null);

const props = defineProps({
	dataEditableYn: {
		type: String,
		requiest: true,
	},
	generalProperty: {
		type: Object,
		required: true
	},
	medataSetId: {
		type: String,
		required: false,
	},
	medataSet: {
		type: Object,
		required: true
	},
	backPageName: {
		type: String,
		required: false,
	}
});

// array type 중 object 형식이 아닌 property용 헤더
const arrTypePropertyTableHeader = ref([
	{
		prop: "",
		label: "번호",
		width: 45,
		align: "center",
		type: "index", // pagination 적용없이 10개 이하 목록에 한해서 적용하는 번호 column
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
	}
]);

// object type property용 헤더
const objTypePropertyTableHeader = ref([
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
]);

const goToMetadataManagePage1 = (payload) => {
	metaCommon.goToMetadataManagePage({
		medataSetId: payload.medataVal,
		typeModelId: props.generalProperty.rangeTypeModelId,
		backPageName: props.dataEditableYn == 'Y' ? 'MetadataDetailManagePage' : 'RetrievalMetadataSetPage'
	});
}

const onBeforeCloseDialogModifyMetadata = (done) => {
	if (dialogModifyMetadataRef.value.isDataSaved()) {
		emits("dataSaved", { prptyId: props.generalProperty.prptyId, prptyNm: props.generalProperty.prptyNm });
		dialogModifyMetadataRef.value.initDialogData();
	}
	done(); // close
}

</script>
<style lang="scss" scoped></style>