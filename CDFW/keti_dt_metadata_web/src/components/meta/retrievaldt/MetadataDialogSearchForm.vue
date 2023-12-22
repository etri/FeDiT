<template>
	<div class="boxLayout">
		<div class="boxTit">
			<h3>메타데이터 검색</h3>
      <div class="btnSec taR">
        <el-button type="primary" @click="getSearchingMetadataList(1)">검색</el-button>
        <!-- <el-button type="default" @click="refresh">초기화</el-button> -->
      </div>		
		</div>
		<div class="boxCnt">
      <el-form label-position="left"
        :inline="true"
        :model="pageInfo"
        class="demo-form-inline"
        label-width="200px"
      >

        <el-form-item label="메타데이터 값">
          <el-row :gutter="20">
            <el-col :span="20">
              <el-input
                class="w-50 m-2"
                v-model="pageInfo.medataVal"
                placeholder="메타데이터 값을 입력하세요."
                @keydown.enter.prevent="getSearchingMetadataList(1)" /></el-col
          ></el-row>
        </el-form-item>

        <el-form-item label="언어">
          <el-row :gutter="20">
            <el-col :span="17">
              <el-select 
                v-model="pageInfo.langMtcd" 
                @change="changeCd"
                placeholder="해당없음">
                  <el-option v-for="item in langMtcdList" :key="item.mtcd" :label="`[${item.mtcd}] ${item.mtcdNm}`" :value="item.mtcd" />
              </el-select>						
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="정렬순서">
          <el-row :gutter="20">
            <el-col :span="15">
              <el-select v-model="pageInfo.sortOrder" placeholder="선택">
                <el-option label="내림차순" value="descending" />
                <el-option label="오름차순" value="ascending" />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>  			

      </el-form>
		</div>
	</div>
</template>
<script setup>
import { reactive, defineEmits, defineProps } from "vue";

const emits = defineEmits(["searchMetadataList"]);

const props = defineProps({
	medataSetId: {
		type: String,
		required: true,
	},
	prptyNm: {
		type: String,
		required: true,
	},
	langMtcdList: {
		type: Array,
		required: true,
	}
});

const pageInfo = reactive({
	medataSetId: props.medataSetId,
	prptyNm: props.prptyNm,
	sortOrder: "",
	medataVal: "",
	langMtcd: "",
});

const getSearchingMetadataList = (data) => {
	emits("searchMetadataList", {
		curPage: data,
		pageInfo,
	});
};

const changeCd = (data) => {
	pageInfo.langMtcd = data;
};

const refresh = () => {
	pageInfo.medataSetId = props.medataSetId;
	pageInfo.prptyNm = props.prptyNm;
	pageInfo.sortOrder = "";
	pageInfo.medataVal = "";
	pageInfo.langMtcd = "";
};

</script>
<style lang="scss"></style>