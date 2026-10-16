<template>
	<div class="cntSec">

		<ProductCodeSearchForm @searchProductCodeList="searchProductCodeList" />

		<div class="btnSec taR mt10">
			<el-button type="primary" size="large" v-if="isWriteYn(route.meta.auth)" 
				@click="dialogVisibleEdit = true">등록</el-button>
		</div>
	
		<el-dialog v-model="dialogVisibleEdit" title="식별체계 - 객체 - 물품 코드 등록">
			<ProductCodeDialogEdit @cancelDialog="cancelDialog" @editProductCodeInfo="editProductCodeInfo"/>
		</el-dialog>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>물품 코드 목록</h3>
			</div>
			<div class="boxCnt">
				<div style="overflow-x: hidden; overflow-y: auto">
					<ProductCodeList :productCodeList="state.productCodeList" :totalPage="state.pageInfo.totalListSize" 
								  :curPage="state.pageInfo.curPage" @pageMove="pageMove" @editProductCodeInfo="editProductCodeInfo" />
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import ProductCodeDialogEdit from '@/components/meta/productcode/ProductCodeDialogEdit.vue';
import ProductCodeSearchForm from '@/components/meta/productcode/ProductCodeSearchForm.vue';
import ProductCodeList from '@/components/meta/productcode/ProductCodeList.vue';

import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { getGlobalProperties, isWriteYn, isReadYn } from "@/assets/js/common.js";

const store = useStore();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;

const dialogVisibleEdit = ref(false);

const state = reactive({
	productCodeList: [],
	pageInfo: {
		curPage: 1,
		idSchmCd: "",
		idSchmCdNm: "",
		idfyUseYn: "",
		useYn: "",
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	},
});

onMounted(() => {
	getProductCodeList();
});

const editProductCodeInfo = () => {
	getProductCodeList();
};

const getProductCodeList = () => {
	$axios
		.get($apiUrls.meta.schema.idschemecode.getIdSchemeProductCodeList, {
			params: {
				curPage: state.pageInfo.curPage,
				lctgExtrCd: state.pageInfo.lctgExtrCd,
				idSchmCd: state.pageInfo.idSchmCd,
				idSchmCdNm: state.pageInfo.idSchmCdNm,
				idfyUseYn: state.pageInfo.idfyUseYn,
				useYn: state.pageInfo.useYn,
			},
		})
		.then((res) => {
			state.productCodeList = res.data.list;
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const searchProductCodeList = (payload) => {
	state.pageInfo.curPage = payload.curPage;
	state.pageInfo.idSchmCd = payload.pageInfo.idSchmCd;
	state.pageInfo.idSchmCdNm = payload.pageInfo.idSchmCdNm;
	state.pageInfo.idfyUseYn = payload.pageInfo.idfyUseYn;
	state.pageInfo.useYn = payload.pageInfo.useYn;
	getProductCodeList();
};

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getProductCodeList();
}

const cancelDialog = () => {
	dialogVisibleEdit.value = false;
}

</script>
<style lang="scss"></style>