<template>
	<!-- comm list 컴포넌트 미적용. ul > li 구조로 data list 출력 -->
	<div class="listTable">
		<el-row>
			<el-col :span="24">
				<ul>
					<li class="list-row" v-for="item in props.metadataSetList" :key="item" @click="elementClick(item)">
						<div class="list-col">
							<div class="list-title">
								{{ item.medataSetNm }}
								<span
									v-if="item.medataSetSttusMtcd"
									class="meta-status-badge ml10"
									:class="`is-${item.medataSetSttusMtcd}`"
								>{{ item.medataSetSttusMtcdNm }}</span>
							</div>
							<ul class="list-info">
								<li class="dt">ID</li>
								<li class="dd">{{ item.medataSetId }} </li>
								<!-- 2025 카테고리와 Agent 를 사용안해서 검색조건에서 숨김.
								<li class="dt">카테고리</li>
								<li class="dd"> {{ item.categoryNm }}</li> -->
								<li class="dt">모델</li>
								<li class="dd">{{ item.modelNm }}</li>
								<!-- 2025 카테고리와 Agent 를 사용안해서 검색조건에서 숨김.
								<li class="dt">제공자</li> -->
								<li class="dd">{{ item.agentNm }}</li>
								<li class="dt">수정일</li>
								<li class="dd">{{ item.medataSetAmdDt }}</li>
								<li class="dt">키워드</li>
								<li class="dd">{{ item.keywordsKo }}</li>
							</ul>
						</div>
					</li>
				</ul>
			</el-col>
		</el-row>
		<el-row v-show="props.metadataSetList.length == 0">
			<el-col :span="24">
				<ul>
					<li class="list-row-empty">데이터 없음</li>
				</ul>
			</el-col>
		</el-row>
		<ComnPagination :totalPage="props.totalPage" :curPage="props.curPage" @pagemove="pagemove" />
	</div>
</template>
<script setup>
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, reactive, defineProps, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getUser } from "@/assets/js/auth.js";
import {
	getGlobalProperties,
	isAmdYn,
	isReadYn
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;

const emits = defineEmits(["pageMove", "clickMetadataSet"]);
const props = defineProps({
	metadataSetList: {
		type: Array,
		required: true,
	},
	totalPage: {
		type: Number,
		required: true,
	},
	curPage: {
		type: Number,
		required: true,
	}
});

const state = reactive({
	metadataSet: {},
	pageInfo: {
		curPage: 1,
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	}
});

const pagemove = (payload) => {
	emits("pageMove", payload);
};

const elementClick = (item) => {
	emits("clickMetadataSet", item);
};

</script>
<style lang="scss" scoped></style>