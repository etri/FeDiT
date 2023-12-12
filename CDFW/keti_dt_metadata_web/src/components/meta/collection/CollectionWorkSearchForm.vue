<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>수집 작업 검색</h3>
			<div class="btnSec taR">
				<el-button type="default" @click="refresh">초기화</el-button>
				<el-button type="primary" @click="getWorkList">검색</el-button>
			</div>
		</div>
		<div class="boxCnt">
			<el-form :inline="true" 
				:model="pageInfo" 
				class="demo-form-inline search-form" 
				label-width="200px"
				label-position="left">
				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="수집 작업 등록일">
						<div class="demo-date-picker" style="display: flex">
							<div class="block" style="margin-right: 10px">
							<el-date-picker
								v-model="searchInfo.srchStartDd"
								type="date"
								placeholder="시작일"
								format="YYYY-MM-DD"
								value-format="YYYY-MM-DD"
								style="width: 150px"
							/>
							</div>
							<span style="margin-right: 10px">~</span>
							<div class="demo-date-picker">
							<el-date-picker
								v-model="searchInfo.srchEndDd"
								type="date"
								placeholder="종료일"
								format="YYYY-MM-DD"
								value-format="YYYY-MM-DD"
								style="width: 150px"
							/>
							</div>
						</div>
						</el-form-item>
					</el-col>
					<el-col :span="12">         
						<el-form-item label="수집 작업 ID">
						<el-input
							v-model="searchInfo.colecWrkId"
							placeholder="수집 작업 ID를 입력하세요."
							@keydown.enter.prevent="getWorkList"
						/>
						</el-form-item>
					</el-col>
					<el-col :span="12">         
						<el-form-item label="수집 작업 상태">
							<el-select v-model="searchInfo.colecWrkSttusMtcd" placeholder="전체">
								<el-option label="전체" value="" />
								<el-option
									v-for="item in mtcdList"
									:key="item.mtcd"
									:label="item.mtcdNm"
									:value="item.mtcd"
							/>
							</el-select>
						</el-form-item>
					</el-col>
						<el-col :span="12">         
							<el-form-item label="수집 로그 ID">
							<el-input
								v-model="searchInfo.colecLogId"
								placeholder="수집 로그 ID를 입력하세요."
								@keydown.enter.prevent="getWorkList"
							/>
							</el-form-item>
						</el-col>
						<el-col :span="12">         
							<el-form-item label="생성 메타데이터셋 ID">
							<el-input
								v-model="searchInfo.cretMedataSetId"
								placeholder="생성 메타데이터셋 ID를 입력하세요."
								@keydown.enter.prevent="getWorkList"
							/>
							</el-form-item>
						</el-col>
						<el-col :span="12">         
							<el-form-item label="수집 작업 메시지">
							<el-input
								v-model="searchInfo.colecWrkMsg"
								placeholder="수집 작업 메시지를 입력하세요."
								@keydown.enter.prevent="getWorkList"
							/>
							</el-form-item>
						</el-col>
				</el-row>
			</el-form>
		</div>
	</div>
</template>
<script setup>
import { ref, defineEmits, onMounted, computed } from "vue";
import { useStore } from "vuex";
import { getGlobalProperties } from "@/assets/js/common.js";
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const store = useStore();


const emits = defineEmits(["searchWork"]);

const searchInfo = ref({
	colecWrkId: "",
	colecLogId: "",
	colecWrkSttusMtcd: "",
	cretMedataSetId: "",	// jsonb cretMedataSetIdList 에 cretMedataSetId 가 있는지 검색
	colecWrkMsg: "",
	srchStartDd: "",
	srchEndDd: "",
});

const getWorkList = () => {
	emits("searchWork", searchInfo.value);
}

const refresh = () => {
	searchInfo.value = {
		colecWrkId: "",
		colecLogId: "",
		colecWrkSttusMtcd: "",
		cretMedataSetId: "",
		colecWrkMsg: "",
		srchStartDd: "",
		srchEndDd: "",
	}
};

const getCodeList = () =>
  store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00024"],
    },
  });
const mtcdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00024")
);

onMounted(() => {
	getCodeList();
})

</script>
<style lang="scss"></style>