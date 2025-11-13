<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>수집 로그 검색</h3>
			<div class="btnSec taR">
				<el-button type="default" @click="refresh">초기화</el-button>
				<el-button type="primary" @click="getLogList">검색</el-button>
			</div>
		</div>
		<div class="boxCnt">
			<el-form :inline="true" 
				:model="searchInfo" 
				class="demo-form-inline search-form" 
				label-width="200px" 
				label-position="left">
				<el-row :gutter="20">
					<el-col :span="8">
						<el-form-item label="수집 로그 등록일">
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
					<el-col :span="8">
						<el-form-item label="수집 로그 ID">
						<el-input
							v-model="searchInfo.colecLogId"
							placeholder="수집 로그 ID를 입력하세요."
							@keydown.enter.prevent="getLogList"
						/>
					</el-form-item>
					</el-col>
					<el-col :span="8">
						<el-form-item label="수집 로그 매핑 정보">
						<el-input
							v-model="searchInfo.colecLogData"
							placeholder="수집 로그 매핑 정보를 입력하세요."
							@keydown.enter.prevent="getLogList"
						/>
					</el-form-item>
					</el-col>
				</el-row>   
			</el-form>
		</div>
	</div>
</template>
<script setup>
import { ref, reactive, defineEmits, defineProps } from "vue";

const searchInfo = ref({
	colecLogId: "",
	colecLogData: "",	// colecLogData 의 'mapping' 값에 해당하는 데이터만 검색
	srchStartDd: "",
	srchEndDd: "",
});

const emits = defineEmits(["searchLog"]);

const getLogList = () => {
	emits("searchLog", searchInfo.value);
};

const refresh = () => {
	searchInfo.value = {
		colecLogId: "",
		colecLogData: "",
		srchStartDd: "",
		srchEndDd: "",
	}
};

</script>
<style lang="scss"></style>