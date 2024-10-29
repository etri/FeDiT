<template>
	<div class="listTable">
		<el-row>
			<el-col :span="24">
				<ul>
					<li class="list-row" v-for="item in props.metadataList" :key="item" @click="elementClick(item)">
						<div class="list-col">
							<div class="list-title">
								{{ item.medataVal ? item.medataVal : (item.geodataVal ? item.geodataVal : '<null>') }}
							</div>
							<ul class="list-info">
								<li class="dt">모델</li>
								<li class="dd"> {{ item.modelNm }}</li>
								<li class="dt">메타데이터 셋</li>
								<li class="dd">{{ item.medataSetNm }}</li>
								<li class="dt">프라퍼티</li>
								<li class="dd">{{ item.prptyNm }} {{ item.prptyLogicNm }}</li>
							</ul>
						</div>
					</li>
				</ul>
			</el-col>
		</el-row>
		<el-row v-show="props.metadataList.length == 0">
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

import { reactive, defineProps } from "vue";

const emits = defineEmits(["pageMove", "clickMetadata"]);
const props = defineProps({
	metadataList: {
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
	},
});

const state = reactive({
	metadata: {},
	pageInfo: {
		curPage: 1,
		totalListSize: 0,
		pageListSize: 10,
		blockSize: 5,
	}
});

const elementClick = (item) => {
	emits("clickMetadata", item);
};

const pagemove = (payload) => {
	emits("pageMove", payload);
};

</script>
<style lang="scss" scoped></style>