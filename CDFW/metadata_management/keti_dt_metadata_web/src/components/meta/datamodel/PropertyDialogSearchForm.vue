<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>프라퍼티 검색</h3>
			<div class="btnSec taR">
				<el-button type="default" @click="refresh">초기화</el-button>
				<el-button type="primary" @click="getPropertyList(1)">검색</el-button>
			</div>			
		</div>
		<div class="boxCnt">
			<el-form label-position="left"
				:inline="true" 
				:model="pageInfo" 
				class="demo-form-inline search-form" 
				label-width="100px;"
			>
				<el-row :gutter="20">
					<el-col :span="10">
						<el-form-item label="데이터 배열 여부">
							<el-select v-model="pageInfo.dataArrayYn" placeholder="선택">
								<el-option label="Y" value="Y" />
								<el-option label="N" value="N" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="14">
						<el-form-item label="프라퍼티 명">
							<el-input 
								class="w-auto m-2" 
								v-model="pageInfo.searchName" 
								placeholder="검색어를 입력하세요." 
								@keyup.enter="getPropertyList(1)" />
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
		</div>
	</div>
</template>
<script setup>
import { reactive, defineEmits } from "vue";

const emits = defineEmits(["searchProperty"]);
const pageInfo = reactive({
	prptyDataSttusMtcd:"use"
});

const getPropertyList = (data) => {
	emits("searchProperty", {
		curPage: data,
		pageInfo,
	});
};

const refresh = () => {
	pageInfo.dataArrayYn = "";
	pageInfo.searchName = "";
};
</script>
<style lang="scss"></style>