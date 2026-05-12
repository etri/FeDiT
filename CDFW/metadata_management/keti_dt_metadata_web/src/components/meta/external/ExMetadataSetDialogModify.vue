<template>
	<div class="dialog-area">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>메타데이터 셋 편집</h3>
			</div>
			<div class="boxCnt">

				<div class="btnSec taR mb10">
					<el-button type="primary" @click="modifyMetadataSetInfo">저장</el-button>
				</div>

				<el-form ref="ruleFormRef" :model="state.metadataSet" :rules="state.rules"
					label-width="200px" class="demo-ruleForm" label-position="right">

					<el-form-item label="메타데이터 셋 ID" prop="medataSetId">
						<el-input v-model="state.metadataSet.medataSetId" disabled></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 유형" prop="typeModelNm">
						<el-input v-model="state.metadataSet.typeModelNm" disabled></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 모델" prop="modelNm">
						<el-input v-model="state.metadataSet.modelNm" disabled></el-input>
					</el-form-item>

					<el-form-item label="식별체계 - 국가코드" prop="idSchmCntryCd" v-show="IdSchmUseYn === 'Y' && idSchmTypeModelIds.includes(state.metadataSet.typeModelId)">
						<div class="inline-area">
							<el-input v-model="state.metadataSet.idSchmCntryCd" disabled style="width: 180px"></el-input>
							<el-input v-model="state.metadataSet.idSchmCntryNm" disabled style="width: 300px; margin-left: 5px;"></el-input>
						</div>
					</el-form-item>

					<el-form-item label="식별체계 - 분류코드 종류" prop="idSchmType" v-show="IdSchmUseYn === 'Y' && idSchmTypeModelIds.includes(state.metadataSet.typeModelId)">
						<el-input v-model="state.metadataSet.idSchmType" disabled style="width: 180px"></el-input>
						<el-input v-model="state.metadataSet.idSchmTypeNm" disabled style="width: 300px; margin-left: 5px;"></el-input>
					</el-form-item>

					<el-form-item label="식별체계 - 코드" prop="idSchmCd" v-show="IdSchmUseYn === 'Y' && idSchmTypeModelIds.includes(state.metadataSet.typeModelId)">
						<div class="inline-area">
							<el-input v-model="state.metadataSet.idSchmCd" disabled style="width: 180px"></el-input>
							<el-input v-model="state.metadataSet.idSchmCdNm" disabled style="width: 300px; margin-left: 5px;"></el-input>
						</div>
					</el-form-item>

					<el-form-item label="식별체계 - 3D 모델 객체 분류" prop="idSchmCd2" v-show="IdSchmUseYn === 'Y' && isIdSchmVmField">
						<div class="inline-area">
							<el-input v-model="state.metadataSet.idSchmCd2" disabled style="width: 180px"></el-input>
							<el-input v-model="state.metadataSet.idSchmCd2Nm" disabled style="width: 300px; margin-left: 5px;"></el-input>
						</div>
					</el-form-item>

					<el-form-item label="메타데이터 셋 명" prop="medataSetNm">
						<el-input v-model="state.metadataSet.medataSetNm"></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 셋 논리명" prop="medataSetLogicNm">
						<el-input v-model="state.metadataSet.medataSetLogicNm"></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 셋 설명" prop="medataSetDesc">
						<el-input v-model="state.metadataSet.medataSetDesc"></el-input>
					</el-form-item>

					<el-form-item label="메타데이터 상태" prop="medataSetSttusMtcd">
						<el-input v-model="state.metadataSet.medataSetSttusMtcdNm" disabled></el-input>
					</el-form-item>
				</el-form>
			</div>

		</div>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>연결 메타데이터 셋 프라퍼티 (상위로 연결)</h3>
			</div>

			<div class="boxCnt">
				<div class="btnSec taR mb10">
					<el-button type="primary" plain @click="deleteSelectedUpperMetadata">삭제</el-button>
					<el-button type="primary" plain @click="refreshSearchMetadataSetInfo">초기화</el-button>
					<el-button type="primary" @click="modifyMetadataSetBySelectedInfo" v-show="!state.cnctInfo.medataId">저장</el-button>
				</div>

				<el-form ref="ruleFormRef2" :model="state.cnctInfo" :rules="state.rules2"
					label-width="200px" class="demo-ruleForm" label-position="right">

					<el-form-item label="연결 메타데이터 셋" prop="cnctMedataSetNm">
						<div class="inline-area">
							<el-input v-model="state.cnctInfo.cnctMedataSetNm" disabled style="width: 250px" />
							<el-button type="default" class="ml15" @click="popDialog('SearchMetadataSet')" v-show="props.cnctInfoDisabledYn !== 'Y'">
								<el-icon class="icon icon-search"></el-icon>
							</el-button>
							<el-button type="default" class="el-button--delete" @click="refreshSearchMetadataSetInfo" v-show="props.cnctInfoDisabledYn !== 'Y'">
								<el-icon class="icon icon-refresh" />
							</el-button>
						</div>
						<!-- 메타데이터 셋 검색 dialog : 전체 상태 , 해당 유형 모델만 조회 -->
						<el-dialog v-model="dialogVisibleSearchMetadataSet" title="메타데이터 셋 검색">
							<MetadataSetDialogSearch
								searchSttusCd=""
								searchMode="all"
								@selectedRow="initUpperMetadataSetBySelectedInfo" />
						</el-dialog>
					</el-form-item>

					<el-form-item label="연결 프라퍼티" prop="cnctPrptyId">
						<el-select
							v-model="state.cnctInfo.cnctPrptyId"
							placeholder="선택"
							:disabled="props.cnctInfoDisabledYn === 'Y'" >
							<el-option v-for="item in state.selectedUpperPrptyList"
								:key="item.prptyId"
								:label="`${item.prptyNm} ${item.prptyLogicNm}`"
								:value="item.prptyId" />
						</el-select>
					</el-form-item>

				</el-form>

			</div>
		</div>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>내가 속한(연결된) 메타데이터 셋 목록</h3>
			</div>
			<div class="boxCnt">
				<div style="overflow-x: hidden; overflow-y: auto">
					<DigitalTwinDialogUpperDigitalTwinList
						:upperMetadataSetDtwListBySubSetId="state.upperMetadataSetDtwListBySubSetId"
						@chooseUpperMetadataSetDtw="chooseUpperMetadataSetDtw" />
				</div>
			</div>
		</div>

	</div>
</template>
<script setup>
import MetadataSetDialogSearch from "@/components/meta/dt/MetadataSetDialogSearch.vue";
import DigitalTwinDialogUpperDigitalTwinList from "@/components/meta/dataset/DigitalTwinDialogUpperDigitalTwinList.vue";
import metaIdSchmSettings from "@/assets/json/metaIdSchmSettings.json";

import { ref, toRefs, defineProps, defineEmits, reactive, onMounted, watch, getCurrentInstance, computed } from "vue";
import { useStore } from "vuex";
import { getGlobalProperties, isEmpty } from "@/assets/js/common.js";
import util from 'util';

const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);
const ruleFormRef2 = ref(null);
const IdSchmUseYn = ref(process.env.VUE_APP_METADATA_ID_SCHM_USE_YN);
const idSchmTypeModelIds = [metaIdSchmSettings.id_schm_object.typeModelId, metaIdSchmSettings.id_schm_object_vm.typeModelId];
// 2025-09-09 시각화모델 일 때만 보이는 필드
const isIdSchmVmField = computed(() => IdSchmUseYn.value === 'Y' && metaIdSchmSettings.id_schm_object_vm.typeModelId == state.metadataSet.typeModelId);

const dialogVisibleSearchMetadataSet = ref(false);

const emits = defineEmits(["modifyMetadataSetInfo", "cancelModifyDialog"]);

const props = defineProps({
	medataSetId: {
		type: String,
		required: true,
	},
	cnctInfo: { // 연결 정보
		type: Object,
		required: false,
		default: () => { return {
				cnctMedataSetId: "",
				cnctMedataSetNm: "",
				cnctPrptyId: "",
			};
		}
	},
	cnctInfoDisabledYn: {
		type: String,
		required: false,
		default: 'N',
	},
});

const propsSetId = toRefs(props).medataSetId;
watch(propsSetId, () => {
	if (ruleFormRef.value) { ruleFormRef.value.resetFields(); } // 밸리데이션 초기화
	init();
});

const state = reactive({
	metadataSet: {}, //메타데이터 셋 정보 (단일)
	cnctInfo: {
		medataId: "", // 삭제시 사용.
		cnctMedataSetId: "",
		cnctMedataSetNm: "",
		cnctPrptyId: "",
	},
	selectedUpperPrptyList: [], // 선택한 상위 메타데이터 셋에 연결된 프라퍼티 목록
	upperMetadataSetDtwListBySubSetId: [], //해당 메타데이터 셋 id로 조회한 상위 디지털트윈 목록

	rules: {
		medataSetNm: [
			{
				required: true,
        message: "메타데이터 셋 명을 입력하세요.",
        trigger: "blur",
			},
			{
				max: 128,
				message: "128자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		medataSetLogicNm: [
			{
				max: 128,
				message: "128자 이하만 가능합니다.",
				trigger: "blur",
			}
		],
		medataSetDesc: [
			{
				required: true,
				message: "메타데이터 셋 설명을 입력하세요.",
				trigger: "blur",
			},
			{
				max: 1000,
				message: "1000자 이하만 가능합니다.",
				trigger: "blur",
			}
		]
	},
	rules2: {
    cnctMedataSetNm: [
      {
        required: true,
        message: "연결 메타데이터 셋을 선택하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "연결 메타데이터 셋 선택",
        trigger: "blur",
      },
    ],
		cnctPrptyId: [
			{
				required: true,
        message: "연결 프라퍼티를 선택하세요.",
        trigger: "blur",
			},
		],
	}
});

onMounted(() => {
	init();
});

const init = () => {
	getMetaCodeList();
	getMetadataSetDetail();
	getUpperMetadataSetDtwListBySubSetId();
}

const getMetaCodeList = async () => {
	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00030"],
		},
	});
};
const idSchm3dCdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00030")
);

const getMetadataSetDetail = () => {
	let medataSetId = props.medataSetId;
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataSet, medataSetId))
		.then((res) => {
			state.metadataSet = res.data;
			if(IdSchmUseYn.value === 'Y' && idSchmTypeModelIds.includes(state.metadataSet.typeModelId)) {
				if(res.data.idSchmType === "1") {
					getIdSchemeProductCode(res.data.idSchmCd);
				}
				if(res.data.idSchmType === "2") {
					getIdSchemeFacilityCode(res.data.idSchmCd);
				}
				if(res.data.idSchmCd2) {
					state.metadataSet.idSchmCd2Nm = idSchm3dCdList.value.find(x => x.mtcd === res.data.idSchmCd2)?.mtcdNm ?? '';
				}
			}
		})
		.catch((err) => {
			console.log(err);
		});
};

const getIdSchemeProductCode = (idSchmCd) => {
	$axios
		.get(util.format($apiUrls.meta.schema.idschemecode.getIdSchemeProductCode, idSchmCd))
		.then((res) => {
			state.metadataSet.idSchmCdNm = res.data.idSchmCdNm;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getIdSchemeFacilityCode = (idSchmCd) => {
	$axios
		.get(util.format($apiUrls.meta.schema.idschemecode.getIdSchemeFacilityCode, idSchmCd))
		.then((res) => {
			state.metadataSet.idSchmCdNm = res.data.idSchmCdNm;
		})
		.catch((err) => {
			console.log(err);
		});
}

const getUpperMetadataSetDtwListBySubSetId = () => {
	let medataSetId = props.medataSetId;

	$axios
		.get($apiUrls.meta.resource.metadatasets.getMetadataList, {
			params: {
				isPaging: false,
				medataVal: medataSetId,
				exceptForMetadataSetYn: "Y"
			},
		})
		.then((res) => {
			state.upperMetadataSetDtwListBySubSetId = res.data.list;
		})
		.catch((err) => {
			console.log(err);
		});

};

const modifyMetadataSetInfo = async () => {

	let ruleForm = ruleFormRef.value;
	if (!ruleForm) return;

	await ruleForm.validate((valid, fields) => {
		if (!valid) {
			alert("입력 정보를 다시 한번 확인해주세요.");
			return;
		}

		if (!confirm("저장하시겠습니까?")) return;

		let medataSetId = state.metadataSet.medataSetId;
		let medataSetInfo = {
			...state.metadataSet
		}

		$axios
			.put(
				util.format($apiUrls.meta.resource.metadatasets.modifyMetadataSet, medataSetId),
				medataSetInfo
			)
			.then(() => {
				alert("저장되었습니다.");
				emits("modifyMetadataSetInfo");
			})
			.catch((err) => {

				console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("저장에 실패하였습니다.");
				}
			});

	});
};

const cancelDialog = () => {
	emits("cancelModifyDialog");
};

const popDialog = (dialogName) => {
	if ('SearchMetadataSet' === dialogName) {
		if (!state.metadataSet || !state.metadataSet.modelId) {
			alert('먼저 모델을 선택해 주세요.');
			return;
		}
		dialogVisibleSearchMetadataSet.value = true;
	}
}

const initUpperMetadataSetBySelectedInfo = (payload) => {
	let { medataSetId, medataSetNm } = payload.rowData;
	state.cnctInfo.medataId = "";
	state.cnctInfo.cnctMedataSetId = medataSetId;
	state.cnctInfo.cnctMedataSetNm = medataSetNm;
	//선택값에 대한 프라퍼티 목록 set
	getUpperMetadataSetsPropertyList(medataSetId, '');
	dialogVisibleSearchMetadataSet.value = false;
};

const refreshSearchMetadataSetInfo = () => {
	state.cnctInfo.medataId = "";
	state.cnctInfo.cnctMedataSetId = "";
	state.cnctInfo.cnctMedataSetNm = "";
	state.cnctInfo.cnctPrptyId = "";

	state.selectedUpperPrptyList = []; // 선택한 상위 메타데이터 셋에 연결된 프라퍼티 목록
};

const getUpperMetadataSetsPropertyList = (medataSetId, cnctPrptyId) => {
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getModelInfoBySetId, medataSetId))
		.then((res) => {
			let propertyMap = res.data.propertyMap; //일반프라퍼티 정보가 object로 set되어있음
			selectedUpperPrptyList(propertyMap, cnctPrptyId);
		}).catch((err) => {
			console.log(err);
		});
};

const selectedUpperPrptyList = (propertyMap, cnctPrptyId) => {
	state.selectedUpperPrptyList = [];

	for (let property in propertyMap) {
		if ("Y" == propertyMap[property].setUsgPrptyYn || propertyMap[property].rangeTypeModelId != state.metadataSet.typeModelId ) continue;
		//destructuring and setting
		let { prptyId, prptyNm, prptyLogicNm } = propertyMap[property];
		let prptyOption = { prptyId, prptyNm, prptyLogicNm };
		state.selectedUpperPrptyList.push(prptyOption);
	}

	if (cnctPrptyId) {
		const idx = state.selectedUpperPrptyList.findIndex(x => x.prptyId === cnctPrptyId);
		if (idx != -1) {
			state.cnctInfo.cnctPrptyId = state.selectedUpperPrptyList[idx].prptyId;
		} else {
			alert(cnctPrptyId + ' 프라퍼티를 설정할 수 없습니다.'); // 이 경우는 나오면 이상한 것임.
		}
	} else if (state.selectedUpperPrptyList.length == 1) {
		state.cnctInfo.cnctPrptyId = state.selectedUpperPrptyList[0].prptyId;
	}
};

const chooseUpperMetadataSetDtw = (payload) => {
	let { medataId, medataSetId, medataSetNm, prptyId } = payload.data;
	state.cnctInfo.medataId = medataId;
	state.cnctInfo.cnctMedataSetId = medataSetId;
	state.cnctInfo.cnctMedataSetNm = medataSetNm;
	//선택값에 대한 프라퍼티 목록 set
	getUpperMetadataSetsPropertyList(medataSetId, prptyId);
	dialogVisibleSearchMetadataSet.value = false;
};

const modifyMetadataSetBySelectedInfo = async () => {
	let ruleForm2 = ruleFormRef2.value;
	if (!ruleForm2) return;

	await ruleForm2.validate((valid, fields) => {
		if (!valid) {
			alert("입력 정보를 다시 한번 확인해주세요.");
			return;
		}

		if (!confirm("저장하시겠습니까?")) return;

		const medataSetId = state.cnctInfo.cnctMedataSetId;
		const medataVal = state.metadataSet.medataSetId;
		const relationData = {
			medataSetId: state.cnctInfo.cnctMedataSetId,
			prptyId: state.cnctInfo.cnctPrptyId,
			medataVal: medataVal
		};

		$axios
			.put(util.format($apiUrls.meta.resource.metadatasets.putMetadatasetsForRelation, medataSetId), relationData)
			.then(() => {
				alert("저장되었습니다.");
				refreshSearchMetadataSetInfo();
				getUpperMetadataSetDtwListBySubSetId();
			})
			.catch((err) => {
				console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("저장에 실패하였습니다.");
				}
			});
	});
};

const deleteSelectedUpperMetadata = () => {
	const medataId = state.cnctInfo.medataId;
	if (!medataId?.trim()) {
		alert('삭제할 내가 속한(연결된) 메타데이터 셋을 선택해주세요.');
		return;
	}

	if (!confirm("삭제하시겠습니까?")) return;

	$axios.
		delete(util.format($apiUrls.meta.resource.metadatasets.deleteMetadata, medataId))
		.then(() => {
			alert("삭제되었습니다.");
			refreshSearchMetadataSetInfo();
			getUpperMetadataSetDtwListBySubSetId();
		})
		.catch((err) => {
			console.log(err);
			if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
				alert(err.response.data.message);
			} else {
				alert("삭제에 실패하였습니다.");
			}
		});
};

</script>
<style lang="scss"></style>
