<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>SPARQL Query</h3>
      </div>
      <div class="boxCnt">
        <el-form 
          :model="state.searchInfo"
          :rules="state.rules" 
          label-position="right" 
          class="demo-ruleForm" 
          ref="ruleFormRef"
          label-width="140px">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="쿼리" prop="queryStr">
                <el-input 
                  v-model="state.searchInfo.queryStr" 
                  type="textarea" :autosize="{ minRows: 20 }"
                  placeholder="쿼리를 입력하세요."/>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="결과 형식" prop="resultFormat">
                <el-select v-model="state.searchInfo.resultFormat" placeholder="선택">
                  <el-option v-for="item in resultFormatList" :key="item.mtcd" :label="item.mtcdNm" :value="item.mtcd" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="실행 timeout 시간 (밀리초)"  prop="timeoutMillis">
                <el-input v-model="state.searchInfo.timeoutMillis" placeholder="실행 시간을 입력하세요."
                  @keydown.enter.prevent="goToResult()" />
              </el-form-item>
            </el-col>
          </el-row>
          <div class="btnSec taR">
            <el-button type="default" @click="setUpQuery()">초기화</el-button>
            <el-button type="primary" @click="goToResult()">실행</el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>
                           
<script setup>
import { onMounted, reactive, ref, computed } from "vue";
import {
  getGlobalProperties,
} from "@/assets/js/common.js";
import { useStore } from "vuex";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const store = useStore();
const ruleFormRef = ref(null);

const validateTimeoutMillis = (rule, value, callback) => {
  if (!value) {
    return callback(new Error("입력해주십시오"));
  }
  setTimeout(() => {
    const regex = /^-?[0-9]+$/;
    if (!regex.test(value)) {
      callback(new Error("숫자를 입력해주십시오"));
    }else if(!(500 <= value && value <= 60000)) {
      callback(new Error("500 ~ 60000 사이의 숫자를 입력해주십시오"));
    } else {
      callback();
    }
  }, 500)
}

const state = reactive({
  searchInfo: {
    queryStr: "",
    resultFormat: "html",
    timeoutMillis: 10000
  },
  rdfNamespaceList: [],
  rules: {
    queryStr: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "내용 입력",
        trigger: "blur",
      },
    ],
    resultFormat: [
      {
        required: true,
        message: "선택하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "내용 입력",
        trigger: "blur",
      },
    ],
    timeoutMillis: [
      { validator: validateTimeoutMillis, trigger: 'blur'}, 
      {
        required: true,
        message: "선택하세요.",
        trigger: "blur",
      },
    ],
  }
});

const getCodeList = () =>
  store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00025"],
    },
  });

const resultFormatList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00025")
);

const goToResult =() => {
  let ruleForm = ruleFormRef.value; 
  if (!ruleForm) return;
   ruleForm.validate((valid) => {
    if (valid) {
      let query = "?queryStr=" + encodeURIComponent(state.searchInfo.queryStr) 
                + "&resultFormat=" + state.searchInfo.resultFormat
                + "&timeoutMillis=" + state.searchInfo.timeoutMillis
                ;
      const url = window.location.origin + "/meta/searchresult/sparql" + query;
      window.open(url, "winSparqlQueryResultPage");
    } else{
      alert("필수사항을 입력하십시오.");
    }
  })
};

onMounted(async()  => {
  getCodeList();
  await getRdfNamespaceList();
  setUpQuery();
})

const  getRdfNamespaceList = async () => {
	await $axios
		.get($apiUrls.meta.rdf.namespace.getNamespaceList, {
			params: {
				isPaging: false
			},
		})
		.then((res) => {
			state.rdfNamespaceList = res.data.list;
		})
		.catch((err) => {
			console.log(err);
		});
};

const setUpQuery = () => {
  let queryStr = "";
  for(let namespace of state.rdfNamespaceList){
    queryStr += "PREFIX " + namespace.rdfNmspPfix + ": <" + namespace.rdfNmspUri + '>\n';
  }
  queryStr += "\nselect * \nwhere { ?s ?p ?o } \nlimit 100";
  state.searchInfo.queryStr = queryStr;
}

</script>
<style lang="scss"></style>