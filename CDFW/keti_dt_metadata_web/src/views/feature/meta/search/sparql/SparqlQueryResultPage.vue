<template>
	<div class="cntSec meta-resource-detail-page">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>SPARQL Query 결과</h3>
				<div class="btnSec taR" >
					<!-- <el-button  type="primary" plain @click="goToBackPage">뒤로</el-button> -->
				</div>
	  	</div>  
			<div class="boxCnt">
				<div class="ly-table">
          <!-- <el-table :data="tableData" border style="width: 100%; height:calc(100vh - 250px);"> -->
          <el-table :data="tableData" border stripe style="width: 100%;">
            <el-table-column prop="rownum" label="번호" width="60" :fixed="true"></el-table-column>
            <template v-for="(item) in tableHeader" :key="item">
                <el-table-column :prop="item.prop" :label="item.label" :min-width="item.width" :fixed="item.fixed">
                <template #default="{ row }">
                  <span v-html="row[item.prop]" ></span>
                </template>              
              </el-table-column>
            </template>
          </el-table> 
				</div>
	  	</div>
  	</div>
	</div>
</template>

<script setup>
import {  onMounted, reactive, ref, watch, onBeforeMount } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getGlobalProperties
} from "@/assets/js/common.js";
import util from "util";
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const route = useRoute();
const router = useRouter();

watch(
	() => route.query,
	(cur, prev) => {
		execute();
	},
	{ deep: true }
)

onBeforeMount(async () => {
	await router.isReady();
});

onMounted(() => {
	execute();
});

const state = reactive({
  searchInfo: {
    queryStr: "",
    resultFormat: "",
    timeoutMillis: ""
  }
});

const tableHeader = ref([]);
const tableData = ref([]);

const executeSparqlQuery = () => {
  let param = Object.assign({}, state.searchInfo);  // virtuoso 
  $axios
    .get($apiUrls.meta.rdf.virtuoso.executeSparqlQuery, {
      params: param,
    })
    .then((res) => {
      // tableHeader
      for(let header of res.data.headers){
        tableHeader.value.push({
          prop: header,
          label: header,          
          width: 100,
          fixed: true,
        })
      }
      //tableData
      tableData.value = res.data.dataList;
      tableData.value.forEach((item, index) => {
        item.rownum = index + 1;
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

const execute = () => {
  state.searchInfo.query = route.query.queryStr;
  state.searchInfo.resultFormat = route.query.resultFormat;
  state.searchInfo.timeoutMillis = route.query.timeoutMillis;
  executeSparqlQuery();
}

const goToBackPage = () => {
	router.back();
};

</script>
<style lang="css">
.meta-resourc e-detail-page .ly-table .el-form-item__content { margin-left: 0; }
.meta-resource-detail-page .sub-label {
	display: inline-flex;
	justify-content: flex-end;
	align-items: flex-start;
	flex: 0 0 auto;
	font-size: var(--el-form-label-font-size);
	color: var(--el-text-color-regular);
	line-height: 35px;

	width: 200px;
	padding: 0 10px;
	line-height: 35px;	
	height: auto;
	margin-left: 0;
	border-right: 1px solid #e5e5e5;
	background-color: #f8f8f8;
	box-sizing: border-box;
}
.meta-resource-detail-page .sub-cont {
	padding-left: 10px;
	width: 100%;
}
.meta-resource-detail-page .ly-table a {
  color: var(--el-color-primary);
  font-weight: 700;
  cursor: pointer;
}
</style>