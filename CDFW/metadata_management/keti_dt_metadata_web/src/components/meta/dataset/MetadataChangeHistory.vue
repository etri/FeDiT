<template>
	<div class="dialog-area">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>검색 조건</h3>
			</div>
			<div class="boxCnt">
				<el-form class="demo-form-inline" label-width="120px" label-position="left">
					<el-row :gutter="20">
						<el-col :span="12">    
							<el-form-item label="프라퍼티 명">
								<el-input
									class="w-auto m-2"
									v-model="state.srchPrptyNm"
									placeholder="검색어를 입력하세요." />
							</el-form-item>   
						</el-col>
						<el-col :span="12">
							<el-form-item label="리비전">
								<div class="inline-area">
									<el-input class="w-auto m-2" v-model="state.chgAftrRvsn" type="number" />
									<el-button type="primary" class="ml15" @click="getMetaDataChangeHistoryList">검색</el-button>
								</div>
							</el-form-item>
						</el-col>
					</el-row>
				</el-form>
			</div>
		</div>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>선택한 행의 메타데이터 값</h3>
			</div>
			<div class="boxCnt">
				<el-form label-width="200px" label-position="right">
          <el-row :gutter="20">
            <el-col :span="24">
							<el-form-item :label="state.selectedRow.prptyLogicNm ?  state.selectedRow.prptyLogicNm : '(프라퍼티 논리명)'">
							<el-input disabled v-model="state.selectedRow.chgAftrVal" type="textarea"></el-input>
							</el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="등록정보">
							<el-input disabled v-model="state.selectedRow.chgInfo" ></el-input>
							</el-form-item>
            </el-col>
          </el-row>
        </el-form>
			</div>
		</div>

		<div class="boxLayout">
			<div class="boxTit">
				<h3>변경 이력</h3>
			</div>
			<div class="boxCnt">
				<comn-list
					:tableHeader="tableHeader"
					:tableData="state.chgHistList"
					@row-click="rowClick"
				>
				</comn-list>
			</div>
		</div>
	</div>
</template>
<script setup>

import ComnList from "@/components/common/ComnList";
import { getGlobalProperties,	isWriteYn } from "@/assets/js/common.js";
import { ref, toRefs, reactive, onMounted, getCurrentInstance, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";

const store = useStore();
const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const props = defineProps({
	medataSetId: {
		type: Object,
		required: true,
	},
});

const state = reactive({
	chgHistList : [],
	srchPrptyNm:"",
	chgAftrRvsn:"",
	selectedRow:{}
});

const tableHeader = ref([
  {
    prop: "chgAftrRvsn",
    label: "리비전",
    width: 65,
    align: "center"
  },
	{
    prop: "chgHstDivMtcdNm",
    label: "구분",
    width: 55,
    align: "center"
  },
	{
    prop: "prptyNm",
    label: "프라퍼티 명",
    width: 180,
    align: "left"
  },
	{
    prop: "prptyLogicNm",
    label: "프라퍼티 논리명",
    width: 180,
    align: "left"
  },
	{
    prop: "valModelNm",
    label: "값 모델",
    width: 180,
    align: "left"
  },
	{
    prop: "chgAftrLangMtcd",
    label: "언어",
    width: 50,
    align: "center",
  },
	{
    prop: "chgAftrVal",
    label: "메타데이터 값",
    width: 230,
		align: "left"
  },
]);

onMounted(()=>{
	getMetaDataChangeHistoryList();
})

const getMetaDataChangeHistoryList = () => {
	$axios
		.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataSetChgHstListBySetId ,props.medataSetId), {
			params: {
				srchPrptyNm : state.srchPrptyNm,
				chgAftrRvsn : state.chgAftrRvsn,
				isPaging: false
			}
		 })
		.then((res) => {
			state.chgHistList = res.data.list;
		})
		.catch((err) => {
			console.log(err);
		});
};

const rowClick = (data) =>{
	state.selectedRow.prptyLogicNm = data.prptyLogicNm;
	state.selectedRow.chgAftrVal=data.chgAftrVal;
	state.selectedRow.chgInfo = data.chgHstRegrId + " / " + data.chgHstRegDt;
}

</script>
<style lang="scss"></style>