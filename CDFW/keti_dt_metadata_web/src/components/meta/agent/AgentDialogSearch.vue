<template>
  <div class="dialog-area" id="codePopup">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>대리인 검색</h3>
      </div>
      <div class="boxCnt">
        <AgentDialogSearchForm @searchAgent="searchAgent" />
      </div>
    </div>

    <div class="boxLayout">
      <div class="boxTit">
        <h3>대리인 검색결과</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto"> <!--  todo : ResizeObserver loop limit exceeded 에러 처리 -->
          <AgentDialogSearchList
            :agentList="state.agentList"
            :totalPage="state.pageInfo.totalListSize"
						:curPage="state.pageInfo.curPage"
						@chooseAgent="chooseAgent"
            @pageMove="pageMove"
          />
        </div>
      </div>
    </div> 

  </div>  

</template>
<script setup>
import AgentDialogSearchForm from "@/components/meta/agent/AgentDialogSearchForm.vue";
import AgentDialogSearchList from "@/components/meta/agent/AgentDialogSearchList.vue";
import { reactive, onMounted } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const emits = defineEmits(["selectAgent"]);

const state = reactive({
  agentList: [],
	agent: {},
  pageInfo: {
    curPage: 1,
    medataSetSttusMtcd: "use", // 해당 modal 검색 조건 -> 사용 상태 default
    agntNm: "",
    agntModelNm: "",
    searchWord: "",
    searchType: "1",    
    agntId: "",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
  },
});

onMounted(() => {
  getUsableStateAgentList();
});

const getUsableStateAgentList = () => {
  $axios
    .get($apiUrls.meta.resource.agent.getAgentList, {
      params: {
        curPage: state.pageInfo.curPage,
        medataSetSttusMtcd: state.pageInfo.medataSetSttusMtcd,
        agntNm:
          state.pageInfo.searchType == 1 ? state.pageInfo.searchWord : null,
        agntId:
          state.pageInfo.searchType == 2 ? state.pageInfo.searchWord : null,
        agntModelNm: state.pageInfo.agntModelNm,
      },
    })
    .then((res) => {
      state.agentList = res.data.list;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const searchAgent = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.searchType = payload.pageInfo.searchType;
  state.pageInfo.searchWord = payload.pageInfo.searchWord;
  state.pageInfo.medataSetSttusMtcd = payload.pageInfo.medataSetSttusMtcd;
  state.pageInfo.agntNm = payload.pageInfo.agntNm;
  state.pageInfo.agntId = payload.pageInfo.agntId;
  state.pageInfo.agntModelNm = payload.pageInfo.agntModelNm;

  getUsableStateAgentList();
};

const chooseAgent = (payload) => {
	state.agent.agntId = payload.agntId;
	state.agent.agntNm = payload.agntNm;
	emits("selectAgent", payload);
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getUsableStateAgentList();
};

</script>
<style lang="scss"></style>