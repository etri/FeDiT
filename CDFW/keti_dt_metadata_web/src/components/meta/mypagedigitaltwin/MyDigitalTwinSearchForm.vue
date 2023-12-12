<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>내 디지털트윈 검색</h3>
			<div class="btnSec taR">
				<el-button type="default" @click="refresh">초기화</el-button>
				<el-button type="primary" @click="getMyDigitalTwinList(1)">검색</el-button>
			</div>
		</div>

		<div class="boxCnt">
			<el-form :inline="true" :model="pageInfo" class="demo-form-inline search-form" label-width="150px" label-position="left">

				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="수정일">
							<div class="inline-area">
								<div class="demo-date-picker">
									<div class="block">
										<el-date-picker v-model="pageInfo.srchStartDd" type="date" placeholder="시작일" format="YYYY-MM-DD"
											value-format="YYYY-MM-DD" :disabled-date="disabledDate1" style="" />
									</div>
								</div>
								<div class="date-picker-tilde">~</div>
								<div class="demo-date-picker">
									<div class="block">
										<el-date-picker v-model="pageInfo.srchEndDd" type="date" placeholder="종료일" format="YYYY-MM-DD"
											value-format="YYYY-MM-DD" :disabled-date="disabledDate2" style="" @change="changeDate" />
									</div>
								</div>
							</div>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="상태">
							<el-select v-model="pageInfo.medataSetSttusMtcd" @change="changeCd" placeholder="선택">
								<el-option label="전체" value="" />
								<el-option v-for="item in dataStatusList" :key="item.mtcd" :label="item.mtcdNm" :value="item.mtcd" />
							</el-select>
						</el-form-item>
					</el-col>
				</el-row>

				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="디지털트윈 명">
							<el-input class="" v-model="pageInfo.srchText" placeholder="디지털트윈 명" style=""
								@keydown.enter.prevent="getMyDigitalTwinList(1)" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="키워드">
							<el-input class="" v-model="pageInfo.keyword" placeholder="키워드" style=""
								@keydown.enter.prevent="getMyDigitalTwinList(1)" />
						</el-form-item>
					</el-col>
				</el-row>

			</el-form>
		</div>

	</div>
</template>
<script setup>
import ComnFormItemInput2Btns from "@/components/common/ComnFormItemInput2Btns.vue";

import { ref, reactive, defineEmits, defineProps, onMounted } from "vue";
import { useStore } from "vuex";
import { getGlobalProperties } from "@/assets/js/common.js";

const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const emits = defineEmits(["searchMyDigitalTwinList"]);

const props = defineProps({
	dataStatusList: { // 데이터 상태코드리스트
		type: Array,
		required: false,
	}
});

const pageInfo = reactive({
	typeModelId: "", //유형모델 ID
	srchStartDd: "",
	srchEndDd: "",
	keyword: "", //키워드
	medataSetSttusMtcd: "", //메타데이터 셋 상태
	srchText: "", //디지털트윈 명
});

const getMyDigitalTwinList = (data) => {
	emits("searchMyDigitalTwinList", {
		curPage: data,
		pageInfo,
	})
};

const changeDate = () => {
	if (pageInfo.srchStartDd == null) {
		pageInfo.srchStartDd = "";
	}
	if (pageInfo.srchEndDd == null) {
		pageInfo.srchEndDd = "";
	}
};

const disabledDate1 = (time) => {
	if (pageInfo.srchEndDd == null || pageInfo.srchEndDd == "")
		return (pageInfo.srchEndDd = "");
	else return time.getTime() > new Date(pageInfo.srchEndDd);
};
const disabledDate2 = (time) => {
	//시작일과 동일 날짜도 종료 검색일로 지정할 수 있게끔 설정 (meta 관련 검색)
	let srchStartDd = new Date(pageInfo.srchStartDd);
	new Date(srchStartDd.setDate(srchStartDd.getDate() - 1)); //지정날짜에서 - 1 day
	return time.getTime() < new Date(srchStartDd.setDate(srchStartDd.getDate()));
};

const changeCd = (data) => {
	pageInfo.medataSetSttusMtcd = data;
};

const refresh = () => {
	pageInfo.srchStartDd = "";
	pageInfo.srchEndDd = "";
	pageInfo.keyword = "";
	pageInfo.medataSetSttusMtcd = "";
	pageInfo.srchText = "";
};

</script>
<style lang="scss"></style>