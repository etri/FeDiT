<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>대리인 관리</h3>
      </div>
      <div class="boxCnt">
          <AgentSearchForm 
						:dataStatusList="dataStatusList" 
						@searchAgent="searchAgent" />
      </div>
    </div>

    <div class="btnSec taR mt10">
      <el-button type="primary" size="large"
        v-if="isWriteYn(route.meta.auth)"        
        @click="dialogVisibleEdit = true"
        >등록</el-button
      >
    </div>    
    <el-dialog v-model="dialogVisibleEdit" title="대리인 등록">
      <AgentDialogEdit
				:dataStatusList="dataStatusList" 
				@cancelDialog="cancelDialog" 
				@editAgentInfo="editAgentInfo" 
			/>
    </el-dialog>  

    <div class="boxLayout">
      <div class="boxTit">
        <h3>대리인 목록</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <AgentList
						:dataStatusList="dataStatusList" 
            :agentList="state.agentList"
            :totalPage="state.pageInfo.totalListSize"
						:curPage="state.pageInfo.curPage"
            @pageMove="pageMove"
          />
        </div>
      </div>
    </div>   

  </div>
</template>
<script setup>
import AgentSearchForm from "@/components/meta/agent/AgentSearchForm.vue";
import AgentList from "@/components/meta/agent/AgentList.vue";
import AgentDialogEdit from "@/components/meta/agent/AgentDialogEdit.vue";
import AgentDialogSearch from "@/components/meta/agent/AgentDialogSearch.vue"

import ComnList from "@/components/common/ComnList";
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import {
  getGlobalProperties,
  isWriteYn,
  isReadYn,
} from "@/assets/js/common.js";
import dayjs from 'dayjs';

const store = useStore();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
  getCurrentInstance().appContext.config.globalProperties.$emitter;
const dialogVisibleEdit = ref(false);
const dialogVisibleSearch = ref(false);

const dataStatusList = ref([]);

const state = reactive({
  agentList: [],
  pageInfo: {
    curPage: 1,
    srchStartDd: "",
    srchEndDd: "",
    medataSetSttusMtcd: "",
    agntNm: "",
		agntModelId: "",
    agntModelNm: "",
    searchWord: "",
    searchType: "1",    
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
  },
});

onMounted(() => {
  getAgentList();
	getMetaCodeList();

	$emitter.on("initAgentList", () => {
		getAgentList();
	});
});

const getAgentList = () => {
  $axios
    .get($apiUrls.meta.resource.agent.getAgentList, {
      params: {
        curPage: state.pageInfo.curPage,
        srchStartDd: state.pageInfo.srchStartDd,
        srchEndDd: state.pageInfo.srchEndDd,
        medataSetSttusMtcd: state.pageInfo.medataSetSttusMtcd,
        agntNm:
          state.pageInfo.searchType == 1 ? state.pageInfo.searchWord : null,
        agntId:
          state.pageInfo.searchType == 2 ? state.pageInfo.searchWord : null,
				agntModelId: state.pageInfo.agntModelId,
        agntModelNm: state.pageInfo.agntModelNm,
      },
    })
    .then((res) => {
      res.data.list= res.data.list.map((x) => {
        x.agntAmdDt = dayjs(x.agntAmdDt).format('YYYY-MM-DD');
        return x;
      });
      
      state.agentList = res.data.list;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getMetaCodeList = async () => {

	await store.dispatch("MetaStore/getMetaCodeList", {
		axios: $axios,
		apiUrls: $apiUrls,
		params: {
			mtcdGrpIdList: ["MCG00001"],
		},
	});

	const List = store.getters["MetaStore/getStoreMetaCodeList"]("MCG00001");
	dataStatusList.value = List;
};

const rowClick = (selectedRow) => {
  alert(selectedRow.mtcdGrpId);
}

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getAgentList();
}

const searchAgent = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.srchStartDd = payload.pageInfo.srchStartDd;
  state.pageInfo.srchEndDd = payload.pageInfo.srchEndDd;

  state.pageInfo.searchType = payload.pageInfo.searchType;
  state.pageInfo.searchWord = payload.pageInfo.searchWord;

  state.pageInfo.medataSetSttusMtcd = payload.pageInfo.medataSetSttusMtcd;
	state.pageInfo.agntModelId = payload.pageInfo.agntModelId;
  state.pageInfo.agntModelNm = payload.pageInfo.agntModelNm;

  getAgentList();
};

const editAgentInfo = () => {
  getAgentList();
  dialogVisibleEdit.value = false;
};

const cancelDialog = () => {
  dialogVisibleEdit.value = false;
};

const selectAgent = () => { 
  dialogVisibleSearch.value = false;
};

</script>
<style lang="scss"></style>
