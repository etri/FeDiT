<template>
	<div>
		<div class="cntSec">

			<div class="boxLayout">
				<div class="boxTit">
					<h3>PAT(Personal Access Token) 목록</h3>
				</div>
				<div class="boxCnt">
					<div style="overflow-x: hidden; overflow-y: auto">
						<PatList :patList="state.patList" :totalPage="state.pageInfo.totalListSize"
							:curPage="state.pageInfo.curPage" @clickPat="clickPat" @pageMove="pageMove" />
					</div>
				</div>
			</div>
			<ul class="btnSec taR mt10">
				<li>
					<el-button type="primary" size="large"
					v-if="isWriteYn(route.meta.auth)"          
					@click="goToEditPage"
					>등록</el-button
					>
				</li>
			</ul>
		</div>
	</div>
</template>
<script setup>
import PatList from "@/components/meta/pat/PatList.vue";

import { onMounted, reactive, ref, getCurrentInstance, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import {
	getGlobalProperties,
	isWriteYn,
	isReadYn,
	routerPush,
	getCookie
} from "@/assets/js/common.js";
import dayjs from 'dayjs';
import { getUser } from "@/assets/js/auth.js";

const store = useStore();
const route = useRoute();
const router = useRouter();
const user = getUser();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;

const state = reactive({
	patList: [],
	pageInfo: {
		curPage: 1,
		totalListSize: 0,
	}
});

onMounted(() => {
	getPatList();
});

const getPatList = () => {
	$axios
		.get($apiUrls.meta.portal.mypage.getPatList, {
			params: {
				curPage: state.pageInfo.curPage,
			},
		})
		.then((res) => {
			state.patList = res.data.list;
			state.pageInfo.totalListSize = res.data.page.totalListSize;
		})
		.catch((err) => {
			console.log(err);
		});
};

const clickPat = (payload) => {
	if (isReadYn(route.meta.auth)) {
		let platform = getCookie("pltfrmId");

		let query = { patkId: payload.patkId };
		routerPush(platform, "PatDetailPage", query);
	} else {
		alert("읽기 권한이 없습니다.");
	}
};

const goToEditPage = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "PatEditPage", query);
};

const pageMove = (payload) => {
	state.pageInfo.curPage = payload;
	getPatList();
};

</script>
<style lang="scss"></style>