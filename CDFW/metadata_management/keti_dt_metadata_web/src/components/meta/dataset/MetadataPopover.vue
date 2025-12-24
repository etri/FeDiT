<template>
  <el-popover placement="bottom" :width="170" trigger="click">
    <template #reference>
      <el-button type="primary" plain >
        {{ metaCommon.Buttons.metadataFileDownload.label }} 
        <el-icon :size="14" style="margin-left: 5px;">
          <Download />
        </el-icon>
      </el-button>
    </template>
    <template #default>
      <div class="listTable">
        <span class="list-title" style="font-weight: bold;">Data : </span>
        <el-row>
          <el-col :span="24">
            <ul>
              <li class="list-row download-list-row">
                <div class="list-col" @click="metaCommon.Buttons.metadataFileDownload.click(publicMedataSetInfo, medataSet.medataSetNm)" style="cursor: pointer;">
                  JSON
                </div>
              </li>
            </ul>
          </el-col>
        </el-row>
        <span class="list-title" style="font-weight: bold;">RDF : </span>
        <el-row>
          <el-col :span="24">
            <ul>
              <li class="list-row download-list-row" v-for="item in rdfOutputVocaList" :key="item" @click="rdfDownload(item.mtcd)" style="cursor: pointer;">
                <div class="list-col">
                  {{ item.mtcdNm }}
                </div>
              </li>
            </ul>
          </el-col>
        </el-row>
      </div>
    </template>
  </el-popover>
</template>
<script setup>
import { defineProps, onMounted, computed, ref } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import metaCommon from "@/assets/js/metaCommon.js";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const store = useStore();
const route = useRoute();

const publicMedataSetInfo = ref({});

const props = defineProps({
  medataSet: {
    type: Object,
    required: true,
  },
});

onMounted(() => {
  rdfOutputVoca();
  getMetadataSetPublicInfo();
});

const rdfOutputVoca = () =>
  store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00017"],
    },
});

const rdfOutputVocaList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00017")
);

const getMetadataSetPublicInfo = () => {
	let medataSetId = route.query.medataSetId;
	$axios
	.get(util.format($apiUrls.meta.resource.metadataapi.getDataMapFromMetadataSet, medataSetId), {
    params: {
      arrayDataLimitYn: "N"
    },
	})
	.then((res) => {
		publicMedataSetInfo.value = res.data;
	})
	.catch((err) => {
		console.log(err);
	});
};

const rdfDownload = (mtcd)=> {
	const searchInfo = {
		modelId: props.medataSet.modelId,
		rdfFormMtcd: "dcat",
		rdfWriteLangMtcd: mtcd,
		medataSetId: props.medataSet.medataSetId,
		medataSetNm: props.medataSet.medataSetNm,
		medataSetEnabled: true,
		searchModeForDt: "type",
	}
	let param = Object.assign({}, searchInfo);
	param.emptyPrptyShowYn = "N";
	$axios
		.get(util.format($apiUrls.meta.data.model.getRdfStr, searchInfo.modelId), {
		params: param,
		})
		.then((res) => {
			metaCommon.downloadRdfFile(res.data.rdfStr, mtcd, props.medataSet.medataSetNm);
		})
		.catch((err) => {
		console.log(err);
		if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
			alert(err.response.data.message);
		} else {
			alert("파일 다운로드에 실패하였습니다.");
		}      
	});
};
</script>
<style lang="scss">
.download-list-row:hover{
  background-color: #e2e7ed;
}
</style>