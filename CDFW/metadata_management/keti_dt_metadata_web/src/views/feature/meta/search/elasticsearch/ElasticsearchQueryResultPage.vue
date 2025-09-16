<template>
	<div class="cntSec meta-resource-detail-page">
		<div class="boxLayout">
			<div class="boxTit">
				<h3>Elasticsearch Query 결과</h3>
				<div class="btnSec taR" >
					<!-- <el-button  type="primary" plain @click="goToBackPage">뒤로</el-button> -->
				</div>
	  	</div>  
			<div class="boxCnt">
				<div class="ly-table">
          <!-- <el-table :data="tableData" border style="width: 100%; height:calc(100vh - 250px);"> -->
          <el-table :data="tableData" border stripe style="width: 100%;" @row-click="rowClick">
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

  <el-dialog v-model="dialogLogInfo" title="Elasticsearch Query 결과 정보">
      <div class="dialog-area">
        <div class="boxLayout">
            <div class="boxTit"><h3>{{ selectedId }}</h3></div>
            <div class="boxCnt">
              <JsonEditorVue class="dialog_jsonEditor_setting" v-model="selectedInfo" v-bind="{
                readOnly: true,
                mode: 'text',
                theme: 'light',
                mainMenuBar: false,
                navigationBar: false,
                parser: undefined,
              }" />
            </div>
          </div>
      </div>
  </el-dialog>
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

const dialogLogInfo = ref(false);
const selectedInfo = ref({});
const selectedId = ref("");

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
    queryJson: "",
    httpMethod: "",
    indexEndpoint: ""
  }
});

const tableHeader = ref([
  {
    prop: "_id",
    label: "_id",
    width: 100,
  },
  {
    prop: "_source",
    label: "_source",
    width: 300,
  }
]);
const tableData = ref([]);

const executeQuery = () => {
  let param = Object.assign({}, state.searchInfo);
  $axios
    .get($apiUrls.meta.datastore.elastic.searchElasticsearch, {
      params: param,
    })
    .then((res) => {
      //tableData
      tableData.value = res.data;
      tableData.value.forEach((item, index) => {
        item.rownum = index + 1;
        tableData.value[index]._source = JSON.stringify(tableData.value[index]._source);
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

const execute = () => {
  state.searchInfo.queryJson = route.query.queryJson;
  state.searchInfo.httpMethod = route.query.httpMethod;
  state.searchInfo.indexEndpoint = route.query.indexEndpoint;
  executeQuery();
}

const goToBackPage = () => {
	router.back();
};

const rowClick = (data) => {
  dialogLogInfo.value = true;
  selectedId.value = data._id;
  selectedInfo.value = JSON.parse(data._source);
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