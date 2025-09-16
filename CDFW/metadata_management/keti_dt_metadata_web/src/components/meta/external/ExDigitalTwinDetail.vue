<template>
	<div>
		<div class="btnSec taR mb10">
			<MetadataPopover :medataSet="medataSet" />
			<el-button type="primary" plain @click="metaCommon.Buttons.metadataResourcePage.click(medataSet.medataSetId)" >{{ metaCommon.Buttons.metadataResourcePage.label }}</el-button>

			<!-- regist / use / unused / disuse -->
			<el-button type="primary" plain @click="getRdfStr" >RDF 확인</el-button>
			<el-button type="primary" plain
				v-show="'regist' == medataSet.medataSetSttusMtcd" 
				@click="deleteMetadataSetWithMetadata" >삭제
			</el-button>
			<el-button type="primary"
				v-show="('regist' == medataSet.medataSetSttusMtcd || 'unused' == medataSet.medataSetSttusMtcd)"
				@click="goToDetailDialog" >셋 수정
			</el-button>
			<el-button type="primary"
				v-show="('regist' == medataSet.medataSetSttusMtcd || 'unused' == medataSet.medataSetSttusMtcd)"
				@click="requestChangeSttus('use')" >사용 (활성화)
			</el-button>
			<el-button type="primary" plain
				v-show="'use' == medataSet.medataSetSttusMtcd" 
				@click="requestChangeSttus('unused')" >미사용 (비활성화)
			</el-button>			
			<el-button type="primary" plain
				v-show="('use' == medataSet.medataSetSttusMtcd || 'unused' == medataSet.medataSetSttusMtcd)"
				@click="requestChangeSttus('disuse')" >폐기
			</el-button>


      <!-- 25.02.18 MetadataChangeHistory 를 MetadataDiffDialog로 교체 -->
			<el-button type="primary" plain
				v-show="'regist' != medataSet.medataSetSttusMtcd"
				@click="goToDiffDialog" >변경이력
			</el-button>
		  
			<el-button type="default" @click="gotoList">목록</el-button>			
		</div>

		<el-dialog v-model="dialogVisibleHistory" title="Diff" :key="diffDialogKey">
			<MetadataDiffDialog :medataSetId="route.query.medataSetId" :medataSetNm="medataSet.medataSetNm" />			
		</el-dialog>

		<el-dialog v-model="dialogVisibleModify" title="디지털트윈 편집">
			<ExDigitalTwinDialogModify
				:medataSetId="state.medataSet.medataSetId" 
				@cancelModifyDialog="cancelModifyDialog" 
				@modifyMetadataSetInfo="modifyMetadataSetInfo" />
		</el-dialog>

		<div>
			<el-dialog v-model="dialogVisibleRdfSearch" title="메타데이터 RDF 확인">
				<RdfViewPopupPage
					:searchParam="rdfSearchParam"
					:emptyPrptyShowYn="emptyPrptyShowYn"
					:refreshKey="refreshKey"
				/> 
			</el-dialog>
		</div>
	
		<div class="ly-table">
			<el-form label-width="160px" label-position="right">
				<el-row>
					<el-col :span="24">
						<el-form-item label="디지털트윈 ID">{{ medataSet.medataSetId }}</el-form-item>
					</el-col>
				</el-row>			
				<el-row>
					<el-col :span="12">
						<el-form-item label="메타데이터 유형">{{ medataSet.typeModelNm }} {{ medataSet.typeModelLogicNm }}</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="메타데이터 모델">{{ medataSet.modelNm }} {{ medataSet.modelLogicNm }}</el-form-item>
					</el-col>
				</el-row>				
				<el-row>
					<el-col :span="24">
						<el-form-item label="디지털트윈 명">{{ medataSet.medataSetNm }}</el-form-item>
					</el-col>
				</el-row>
				<el-row>
					<el-col :span="24">
						<el-form-item label="디지털트윈 논리명">{{ medataSet.medataSetLogicNm }}</el-form-item>
					</el-col>
				</el-row>
				<el-row>
					<el-col :span="24">
						<el-form-item label="디지털트윈 설명">{{ medataSet.medataSetDesc }}</el-form-item>
					</el-col>
				</el-row>
				<el-row>
					<el-col :span="12">
						<el-form-item label="메타데이터 상태">
							{{ medataSet.medataSetSttusMtcdNm }} <span v-if="medataSet.medataSetSttusWhy">(사유: {{ medataSet.medataSetSttusWhy }})</span>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="최신 리비전">{{ medataSet.medataSetNwstRvsn }}</el-form-item>
					</el-col>
				</el-row>
				<el-row>
					<el-col :span="12">
						<el-form-item label="등록정보">{{ medataSet.medataSetRegrId }} / {{ medataSet.medataSetRegDt }}</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="수정정보">{{ medataSet.medataSetAmdrId }} / {{ medataSet.medataSetAmdDt }}</el-form-item>
					</el-col>
				</el-row>
			</el-form>
		</div>

	</div>
</template>
<script setup>
import ExDigitalTwinDialogModify from "@/components/meta/external/ExDigitalTwinDialogModify.vue";
import MetadataChangeHistory from "@/components/meta/dataset/MetadataChangeHistory.vue";
import MetadataDiffDialog from "@/components/meta/dataset/MetadataDiffDialog.vue";
import RdfViewPopupPage from "@/views/feature/meta/setting/rdfmapping/RdfViewPopupPage.vue";
import MetadataPopover from "@/components/meta/dataset//MetadataPopover.vue";

import { useRoute, useRouter } from "vue-router";
import { defineProps, reactive, ref, getCurrentInstance } from "vue";
import { isAmdYn, isReadYn, getCookie, routerPush, nowTimestamp } from "@/assets/js/common.js";
import { getGlobalProperties } from "@/assets/js/common.js";
import metaCommon from "@/assets/js/metaCommon.js";

import util from "util";
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;
const route = useRoute();
const router = useRouter();

const dialogVisibleModify = ref(false);
const dialogVisibleHistory = ref(false);
const dialogVisibleRdfSearch = ref(false);
const dialogKey = ref('');
const refreshKey = ref({
  nowDate:  Date.now()
});

const props = defineProps({
	medataSet: {
		type: Object,
		required: true,
	},
	dataStatusList: {
		type: Array,
		required: false,
	},
	emptyPrptyShowYn: "",
	rdfSearchParam: {
		type: Object,
	},
	isUnsavedData: {
		type: Boolean,
		default: false,
	},
});

const state = reactive({
	medataSet: {},
});

const getRdfStr = () => {
	refreshKey.value.nowDate = Date.now();
	dialogVisibleRdfSearch.value = true;
};


const dialogHistory = ()=> {
	dialogVisibleHistory.value = true;
	dialogKey.value = nowTimestamp();
}

// diff dialog
const dialogVisibleDiff = ref(false);
const diffDialogKey = ref('');
const goToDiffDialog = () => {
  dialogVisibleDiff.value = true;
  diffDialogKey.value = nowTimestamp();
};

const modifyMetadataSetInfo = () => {
	dialogVisibleModify.value = false;
	$emitter.emit("modifyMetadataSetInfo");
}

const deleteMetadataSetWithMetadata = () => {
	let result = confirm("해당 메타데이터 셋과 메타데이터가 모두 삭제됩니다. 삭제하시겠습니까?")
	if (result) {
		let medataSetId = props.medataSet.medataSetId;
		$axios.
			delete(util.format($apiUrls.meta.resource.metadatasets.deleteMetadataSetAndMetadata, medataSetId))
			.then(() => {
				alert("삭제 완료하였습니다.");
				let platform = getCookie("pltfrmId");
				let query = null;
				let routeName = "DigitalTwinListPage";
				if(typeof route.query.backPageName !== "undefined" && route.query.backPageName !== null) {
					routeName = route.query.backPageName;
				}
				routerPush(platform, routeName, query);
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

const requestChangeSttus = (medataSetSttusMtcd) => {
	if (props.isUnsavedData) {
		alert("저장되지 않은 데이터가 있습니다. 먼저 [저장]을 해주세요.");
		return;
	}

	let confirmMsg = '';
	if (medataSetSttusMtcd === 'use') {
		confirmMsg = "해당 메타데이터 셋의 상태를 [사용]으로 변경합니다.\n하위의 메타데이터 셋들이 전부 [사용] 상태여야 변경이 가능합니다.\n변경하시겠습니까?\n(하위 셋들이 많으면 시간이 오래 걸릴 수 있습니다.)";
	} else if (medataSetSttusMtcd === 'unused') {
		confirmMsg = "해당 메타데이터 셋의 상태를 [미사용]으로 변경합니다. 변경하시겠습니까?";
	} else if (medataSetSttusMtcd === 'disuse') {
		confirmMsg = "해당 메타데이터 셋의 상태를 [폐기]로 변경합니다. 변경하시겠습니까?";
	} else {
		alert('상태코드가 잘못되었습니다.');
		return;
	}

	if (!confirm(confirmMsg)) return;

	let medataSetId = props.medataSet.medataSetId;
	let modelId = props.medataSet.modelId;
	let medataSetInfo = {
		medataSetSttusMtcd,
		medataSetId,
		modelId
	};
		
	$axios.
		patch(util.format($apiUrls.meta.resource.metadatasets.modifyMetadataSetStatus, medataSetId), medataSetInfo)
		.then(() => {
			alert("변경되었습니다.");
			$emitter.emit("initMetadataSetInfo"); //props data reset
		})
		.catch((err) => {

			console.log(err);
			if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
				alert(err.response.data.message);
			} else {
				alert("변경 처리에 실패하였습니다.");
			}
		});
};

const goToDetailDialog = () => {
	state.medataSet = props.medataSet;
	dialogVisibleModify.value = true;
};

const cancelModifyDialog = () => {
	dialogVisibleModify.value = false;
};

const gotoList = () => {
	if (props.isUnsavedData) {
		if (!confirm("저장되지 않은 데이터가 있습니다. 목록으로 이동하시겠습니까?")) return;
	}

	router.push({
		path: '/loginpass',
		query: {
			to: `/meta/exmanage/dt`,
		}
	});
};

</script>
<style lang="scss"></style>