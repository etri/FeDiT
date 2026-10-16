<template>
<!-- 네임스페이스 정보 -->
	<div class="cntSec">
		<RdfNamespaceInfoForm ref="rdfNamespaceInfoForm" :originRdfNamespace="state.selectedNameSpaceInfo"
			@editRdfNamespaceInfo="editRdfNamespaceInfo" @modifyRdfNamespaceInfo="modifyRdfNamespaceInfo"
			@deleteRdfNamespaceInfo="deleteRdfNamespaceInfo" @initOriginRdfNamespace="initDetailNamespace" />

		<div class="boxLayout">
			<div class="boxTit">
				<h3>네임스페이스 목록 (총 {{ state.pageInfo.totalListSize }} 건)</h3>
				<div class="btnSec taR">
					<el-button type="primary" plain @click="metaCommon.Buttons.ketidtInfoPage.click()" >{{ metaCommon.Buttons.ketidtInfoPage.label }}</el-button>
					<el-button type="primary" plain @click="metaCommon.Buttons.ketidtskosInfoPage.click()" >{{ metaCommon.Buttons.ketidtskosInfoPage.label }}</el-button>
				</div>
			</div>
			<div class="boxCnt">
				<div style="overflow-x: hidden; overflow-y: auto">
					<RdfNamespaceList :rdfNamespaceList="state.rdfNamespaceList" :totalPage="state.pageInfo.totalListSize"
						@detailNamespace="detailNamespace" />
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import RdfNamespaceList from '@/components/meta/rdfnamespace/RdfNamespaceList.vue';
import RdfNamespaceInfoForm from '@/components/meta/rdfnamespace/RdfNamespaceInfoForm.vue';
import metaCommon from "@/assets/js/metaCommon.js";

import {
	getGlobalProperties,
	isWriteYn,
	isReadYn,
} from "@/assets/js/common.js";
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import util from "util";
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const rdfNamespaceInfoForm = ref(null);

const state = reactive({
	rdfNamespaceList: [],
	pageInfo: {
		totalListSize: 0,
		rdfNmspId: "",
		rdfNmspPfix: "",
		rdfNmspUri: "",
		rdfNmspAplyMtcd: "",
		rdfNmspRegrId: "",
		rdfNmspRegDt: "",
		rdfNmspAmdrId: "",
		rdfNmspAmdDt: "",
	},
	selectedNameSpaceInfo: {
		rdfNmspId: "",
		rdfNmspPfix: "",
		rdfNmspUri: "",
		rdfNmspRegrId: "",
		rdfNmspRegDt: "",
		rdfNmspAmdrId: "",
		rdfNmspAmdDt: ""
	}
});

onMounted(() => {
	getRdfNamespaceList();
});

const getRdfNamespaceList = () => {
	$axios
		.get($apiUrls.meta.rdf.namespace.getNamespaceList, {
			params: {
				isPaging: false
			},
		})
		.then((res) => {

			state.rdfNamespaceList = res.data.list.map((x) => {
				x.nmspAmdDt = dayjs(x.nmspAmdDt).format('YYYY-MM-DD');
				x.nmspRegDt = dayjs(x.nmspRegDt).format('YYYY-MM-DD');
				return x;
			});
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const detailNamespace = (payload) => {
	state.selectedNameSpaceInfo.rdfNmspId = payload.selectedRow.rdfNmspId;
	state.selectedNameSpaceInfo.rdfNmspPfix = payload.selectedRow.rdfNmspPfix;
	state.selectedNameSpaceInfo.rdfNmspUri = payload.selectedRow.rdfNmspUri;
	state.selectedNameSpaceInfo.rdfNmspAplyMtcd = payload.selectedRow.rdfNmspAplyMtcd;
	state.selectedNameSpaceInfo.rdfNmspRegrId = payload.selectedRow.rdfNmspRegrId;
	state.selectedNameSpaceInfo.rdfNmspRegDt = payload.selectedRow.rdfNmspRegDt;
	state.selectedNameSpaceInfo.rdfNmspAmdrId = payload.selectedRow.rdfNmspAmdrId;
	state.selectedNameSpaceInfo.rdfNmspAmdDt = payload.selectedRow.rdfNmspAmdDt;
};

const initDetailNamespace = () => {
	state.selectedNameSpaceInfo.rdfNmspId = "";
	state.selectedNameSpaceInfo.rdfNmspPfix = "";
	state.selectedNameSpaceInfo.rdfNmspUri = "";
	state.selectedNameSpaceInfo.rdfNmspAplyMtcd = "";
	state.selectedNameSpaceInfo.rdfNmspRegrId = "";
	state.selectedNameSpaceInfo.rdfNmspRegDt = "";
	state.selectedNameSpaceInfo.rdfNmspAmdrId = "";
	state.selectedNameSpaceInfo.rdfNmspAmdDt = "";
};

const validationNamespace = (payload, mode) => {
	return new Promise((resolve, reject) => {

		if (!payload.data.rdfNmspPfix?.trim() || !payload.data.rdfNmspUri?.trim()) {
			alert('Prefix와 URI는 필수값입니다.');
			return reject(false);
		}

		if (payload.data.rdfNmspPfix.length > 32) {
			alert('Prefix는 32자 이하여야 합니다.');
			return reject(false);
		}

		if (payload.data.rdfNmspUri.length > 512) {
			alert('URI는 512자 이하여야 합니다.');
			return reject(false);
		}

		if (mode == 'modify') {
			if (!payload.data.changedRdfNmspUri?.trim()) {
				alert('수정하려는 URI를 입력해주세요.');
				return reject(false);
			}
			if (payload.data.changedRdfNmspUri?.trim() && payload.data.changedRdfNmspUri.length > 512) {
				alert('URI는 512자 이하여야 합니다.');
				return reject(false);
			}
			if (!payload.data.changedRdfNmspPfix?.trim()) {
				alert('수정하려는 Prefix를 입력해주세요.');
				return reject(false);
			}
			if (payload.data.changedRdfNmspPfix?.trim() && payload.data.changedRdfNmspPfix.length > 32) {
				alert('Prefix는 32자 이하여야 합니다.');
				return reject(false);
			}
		}

		return resolve(true);
	});
};

const editRdfNamespaceInfo = async (payload) => {

	let valid = await validationNamespace(payload, 'edit');
	if (valid) {
		let result = confirm("등록 하시겠습니까?");
		if (result) {
			let rdfNamespaceInfo = { ...payload.data };
			$axios
				.post($apiUrls.meta.rdf.namespace.createNamespace, rdfNamespaceInfo)
				.then(() => {
					alert("네임스페이스 등록이 완료되었습니다.");
					getRdfNamespaceList();
					initDetailNamespace();
					rdfNamespaceInfoForm.value.refresh();
				})
				.catch((err) => {
					initDetailNamespace();
					console.log(err);
					if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
						alert(err.response.data.message);
					} else {
						alert("네임스페이스 등록에 실패하였습니다.");
					}
				});
		}
	} else {
		alert("입력 정보를 다시 한번 확인해주세요.");
	}
};

const modifyRdfNamespaceInfo = async (payload) => {

	let valid = await validationNamespace(payload, 'modify');
	if (valid) {
		let result = confirm("수정 하시겠습니까?");
		if (result) {

			let rdfNmspId = payload.data.rdfNmspId;
			let rdfNamespaceInfo = {
				...payload.data
			}

			$axios
				.put(
					util.format($apiUrls.meta.rdf.namespace.modifyNamespace, rdfNmspId),
					rdfNamespaceInfo
				)
				.then(() => {
					alert("수정이 완료되었습니다.");
					getRdfNamespaceList();
					initDetailNamespace();
					rdfNamespaceInfoForm.value.refresh();
				})
				.catch((err) => {
					initDetailNamespace();
					console.log(err);
					if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
						alert(err.response.data.message);
					} else {
						alert("네임스페이스 수정에 실패하였습니다.");
					}
				});
		}
	} else {
		alert("입력 정보를 다시 한번 확인해주세요.");
	}
};

const deleteRdfNamespaceInfo = (payload) => {

	console.log(payload);
	if (!payload.data.rdfNmspId?.trim()) {
		alert('삭제할 네임스페이스를 선택해주세요.');
		return;
	}

	let result = confirm("삭제하시겠습니까?")
	if (result) {

		let rdfNmspId = payload.data.rdfNmspId;

		$axios.
			delete(util.format($apiUrls.meta.rdf.namespace.deleteNamespace, rdfNmspId))
			.then(() => {
				alert("삭제 완료하였습니다.");
				getRdfNamespaceList();
				initDetailNamespace();
			})
			.catch((err) => {
				initDetailNamespace();
				console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("삭제에 실패하였습니다.");
				}
			});
	}
};

</script>
<style lang="scss"></style>