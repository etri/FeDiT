<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>네임스페이스 정보</h3>
			<div class="btnSec taR">
				<el-button type="primary" plain v-if="!isEmpty(props.originRdfNamespace.rdfNmspId)"  
					@click="deleteRdfNamespaceInfo">삭제</el-button>
				<el-button type="default" @click="refresh">초기화</el-button>
				<el-button type="primary" @click="modifyRdfNamespaceInfo">저장</el-button>
			</div>
		</div>
		<div class="boxCnt">
			<el-form :model="state.rdfNamespace" label-width="110px" label-position="right">

				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="Prefix">
							<div class="inline-area">
								<el-input class="w-100 m-2" v-model="state.rdfNamespace.rdfNmspPfix" placeholder="Prefix"
									@input="changeNmspPfix($event)" />
								<el-button type="primary" class="ml15" @click="namespacePrefixCheck"
									@keydown.enter.prevent="namespacePrefixCheck">중복확인</el-button>
							</div>
						</el-form-item>
					</el-col>

					<el-col :span="12">
						<el-form-item label="URI">
							<div class="inline-area">
								<el-input class="w-100 m-2" v-model="state.rdfNamespace.rdfNmspUri" placeholder="URI"
									@input="changeNmspUri($event)" />
								<el-button type="primary" class="ml15" @click="namespaceUriCheck"
									@keydown.enter.prevent="namespaceUriCheck">중복확인</el-button>
							</div>
						</el-form-item>
					</el-col>
				</el-row>

				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="시스템 적용">
							<el-select v-model="state.rdfNamespace.rdfNmspAplyMtcd" class="w100" placeholder="해당없음">
								<el-option value="">해당없음</el-option>
								<el-option
									v-for="item in mtcdList"
									:key="item.mtcd"
									:label="item.mtcdNm"
									:value="item.mtcd"
								/>
							</el-select>
						</el-form-item>
					</el-col>
				</el-row>	

				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="등록정보">
							<el-input v-model="nmspRegistInfo" disabled />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="수정정보">
							<el-input v-model="nmspModifyInfo" disabled />
						</el-form-item>
					</el-col>
				</el-row>

			</el-form>

			<div class="inline-area" style="justify-content: space-between;">
				<div class="taL mt10">
					<span class="guide-text-red ml15">※ NEO4J 특성 상 해당 화면에서 네임스페이스를 변경하여도 NEO4J 데이터에 반영되지 않을 수 있습니다. 문제 발생 시 관리자에게 문의하세요.</span>
				</div>
			</div>

		</div>
	</div>
</template>
<script setup>
import { reactive, ref, defineProps, defineEmits, defineExpose, watch, computed, onMounted} from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { getGlobalProperties, isAmdYn, isDelYn, isEmpty } from "@/assets/js/common.js";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const store = useStore();

const isAblePrefix = ref(false);
const isAbleUri = ref(false);

const props = defineProps({
	originRdfNamespace: { // 목록에서 선택한 원본 data
		type: Object,
		required: false,
	},
	curPage: {
		type: String,
		required: false,
	},
	curTitle: {
		type: String,
		required: false,
	}
});

const state = reactive({
	rdfNamespace: {
		rdfNmspId: props.originRdfNamespace.rdfNmspId,
		rdfNmspPfix: props.originRdfNamespace.rdfNmspPfix,
		rdfNmspUri: props.originRdfNamespace.rdfNmspUri,
		rdfNmspAplyMtcd: props.originRdfNamespace.rdfNmspAplyMtcd,
		rdfNmspRegrId: props.originRdfNamespace.rdfNmspRegrId,
		rdfNmspRegDt: props.originRdfNamespace.rdfNmspRegDt,
		rdfNmspAmdrId: props.originRdfNamespace.rdfNmspAmdrId,
		rdfNmspAmdDt: props.originRdfNamespace.rdfNmspAmdDt,
		changedRdfNmspUri: "",
		changedRdfNmspPfix: "",
	},
});

const refresh = () => {
	state.rdfNamespace = { ...props.originRdfNamespace };
	state.rdfNamespace.changedRdfNmspPfix = "";
	state.rdfNamespace.changedRdfNmspUri = "";
	state.rdfNamespace.rdfNmspAplyMtcd = "";
	
	isAblePrefix.value = false; //중복체크용 변수 초기화
	isAbleUri.value = false; //중복체크용 변수 초기화
	emits("initOriginRdfNamespace"); //prop으로 전송받는 data 초기화
};

defineExpose({
	refresh
})

const isAbleModifyBtn = computed(() => {
	return (isAblePrefix.value && isAbleUri.value) ? true : false;
});

const nmspRegistInfo = computed(() => {
	return (!state.rdfNamespace.rdfNmspRegrId?.trim()) ? '' :
		`${state.rdfNamespace.rdfNmspRegrId} / ${state.rdfNamespace.rdfNmspRegDt}`;
});

const nmspModifyInfo = computed(() => {
	return (!state.rdfNamespace.rdfNmspAmdrId?.trim()) ? '' :
		`${state.rdfNamespace.rdfNmspAmdrId} / ${state.rdfNamespace.rdfNmspAmdDt}`;
})

const emits = defineEmits([
	"modifyRdfNamespaceInfo",
	"editRdfNamespaceInfo",
	"deleteRdfNamespaceInfo",
	"initOriginRdfNamespace"
]);

watch(() => props.originRdfNamespace.rdfNmspId, () => {
	initInfoForm(); //셀 선택이 바뀔 시, 선택한 셀에 대한 data를 복제.
});

const initInfoForm = () => {
	state.rdfNamespace = { ...props.originRdfNamespace };
};

const changeNmspPfix = (event) => {
	if (!props.originRdfNamespace.rdfNmspPfix?.trim()) { //빈문자열일 시, (등록 parameter)
		state.rdfNamespace.rdfNmspPfix = event;
	} else { //빈문자열이 아닐 시, (수정용 parameter)
		state.rdfNamespace.changedRdfNmspPfix = event;
	}
	isAblePrefix.value = false; //중복체크 진행 유도 변수 (값 변경 시 중복체크를 다시 진행해야만 저장 버튼 활성화)
};

const changeNmspUri = (event) => {
	if (!props.originRdfNamespace.rdfNmspUri?.trim()) { //빈문자열일 시, (등록 parameter)
		state.rdfNamespace.rdfNmspUri = event;
	} else { //빈 문자열이 아닐 시, (수정용 parameter)
		state.rdfNamespace.changedRdfNmspUri = event;
	}
	isAbleUri.value = false; //중복체크 진행 유도 변수 (값 변경 시 중복체크를 다시 진행해야만 저장 버튼 활성화)
};

const namespaceUriCheck = async () => {
	// 전달받은 key value 없을 시, 등록 변수 set, 존재할 시 수정 변수 set
	let rdfNmspUri = (isEmpty(state.rdfNamespace.changedRdfNmspUri))
		? (isEmpty(props.originRdfNamespace.rdfNmspUri) ? state.rdfNamespace.rdfNmspUri : props.originRdfNamespace.rdfNmspUri)
		: state.rdfNamespace.changedRdfNmspUri;

	let rdfNmspId = (isEmpty(props.originRdfNamespace.rdfNmspId)) ? '' : props.originRdfNamespace.rdfNmspId;

	if (isEmpty(rdfNmspUri)) {
		alert('URI를 입력 후, 중복 체크해주세요.');
		return;
	}

	let isDuplicated = true;
	await $axios
		.get($apiUrls.meta.rdf.namespace.checkNamespaceUri, {
			params: { rdfNmspUri, rdfNmspId }
		})
		.then((res) => {
			console.log(res);
			isDuplicated = res.data.duplicated;
		})
		.catch((err) => {
			console.log(err);
		});

	if (!isDuplicated) {
		alert(`${rdfNmspUri} 는 사용 가능한 URI 입니다.`);
		isAbleUri.value = true;
	} else {
		alert(`${rdfNmspUri} 는 중복된 URI 입니다. 다른 URI를 사용해주세요`);
		isAbleUri.value = false;
	}
};

const namespacePrefixCheck = async () => {
	// 전달받은 key value 없을 시, 등록 변수 set, 존재할 시 수정 변수 set
	let rdfNmspPfix = (isEmpty(state.rdfNamespace.changedRdfNmspPfix))
		? (isEmpty(props.originRdfNamespace.rdfNmspPfix) ? state.rdfNamespace.rdfNmspPfix : props.originRdfNamespace.rdfNmspPfix)
		: state.rdfNamespace.changedRdfNmspPfix;

	let rdfNmspId = (isEmpty(props.originRdfNamespace.rdfNmspId)) ? '' : props.originRdfNamespace.rdfNmspId;

	if (isEmpty(rdfNmspPfix)) {
		alert('Prefix 를 입력 후, 중복 체크해주세요.');
		return;
	}

	let isDuplicated = true;
	await $axios
		.get($apiUrls.meta.rdf.namespace.checkNamespacePrefix, {
			params: { rdfNmspPfix, rdfNmspId }
		})
		.then((res) => {
			console.log(res);
			isDuplicated = res.data.duplicated;
		})
		.catch((err) => {
			console.log(err);
		});

	if (!isDuplicated) {
		alert(`${rdfNmspPfix} 는 사용 가능한 prefix 입니다.`);
		isAblePrefix.value = true;
	} else {
		alert(`${rdfNmspPfix} 는 중복된 prefix 입니다. 다른 prefix를 사용해주세요`);
		isAblePrefix.value = false;
	}
};

const modifyRdfNamespaceInfo = async () => {
	if(!isAbleModifyBtn.value){
		alert("중복확인을 모두 진행해주세요.");
		return;
	}
	
	//prop으로 받은 key ID 미존재 -> 등록 
	if (!state.rdfNamespace.rdfNmspId?.trim()) {

		let rdfNamespaceParam = {
			rdfNmspUri: state.rdfNamespace.rdfNmspUri,
			rdfNmspPfix: state.rdfNamespace.rdfNmspPfix,
			rdfNmspAplyMtcd: state.rdfNamespace.rdfNmspAplyMtcd
		};

		emits("editRdfNamespaceInfo", { data: rdfNamespaceParam });
	} else { // prop으로 받은 key 존재 - > 수정
		//수정하려는 data key 원본 value setting
		state.rdfNamespace.rdfNmspPfix = props.originRdfNamespace.rdfNmspPfix;
		state.rdfNamespace.rdfNmspUri = props.originRdfNamespace.rdfNmspUri;

		let changedRdfNmspUri = isEmpty(state.rdfNamespace.changedRdfNmspUri) ? state.rdfNamespace.rdfNmspUri : state.rdfNamespace.changedRdfNmspUri;
		let changedRdfNmspPfix = isEmpty(state.rdfNamespace.changedRdfNmspPfix) ? state.rdfNamespace.rdfNmspPfix : state.rdfNamespace.changedRdfNmspPfix;

		let rdfNamespaceParam = {
			rdfNmspId: state.rdfNamespace.rdfNmspId,
			rdfNmspUri: state.rdfNamespace.rdfNmspUri,
			rdfNmspAplyMtcd: state.rdfNamespace.rdfNmspAplyMtcd,
			rdfNmspPfix: state.rdfNamespace.rdfNmspPfix,
			changedRdfNmspUri,
			changedRdfNmspPfix,
		};

		emits("modifyRdfNamespaceInfo", { data: rdfNamespaceParam });
	}
};

const deleteRdfNamespaceInfo = () => {

	let rdfNamespaceParam = {
		rdfNmspId: state.rdfNamespace.rdfNmspId,
		rdfNmspUri: state.rdfNamespace.rdfNmspUri,
		rdfNmspPfix: state.rdfNamespace.rdfNmspPfix
	};
	emits("deleteRdfNamespaceInfo", { data: rdfNamespaceParam });
	refresh();
};

const getCodeList = () =>
  store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00026"],
    },
  });
const mtcdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00026")
);

onMounted(() => {
	getCodeList();
})

</script>
<style lang=""></style>