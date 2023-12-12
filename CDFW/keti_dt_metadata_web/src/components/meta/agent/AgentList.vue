<template>
  <div>
    <ComnList
      :tableHeader="tableHeader"
      :tableData="agentList">

      <template v-slot:btn="slotData" v-if="isAmdYn(route.meta.auth)">
        <el-button type="primary" size="small" @click="goToDetailDialog(slotData)" >수정</el-button>
      </template>
      <template v-slot:btn="slotData" v-else-if="!isAmdYn(route.meta.auth) && isReadYn(route.meta.auth)">
        <el-button type="default" size="small" @click="goToDetailDialog(slotData)">조회</el-button>
      </template>
    </ComnList>

    <el-dialog v-model="dialogVisibleModify" v-bind:title="curTitle">
      <AgentDialogModify
				:dataStatusList="props.dataStatusList"
        :agent="state.agent"
        :curPage="curPage"
        :curTitle="curTitle"
        @cancelModifyDialog="cancelModifyDialog"
        @modifyAgentInfo="modifyAgentInfo"
        @deleteAgentInfo="deleteAgentInfo"
      />
    </el-dialog>

    <ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
  </div>    
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import AgentDialogModify from "@/components/meta/agent/AgentDialogModify.vue";

import { ref, reactive, defineProps, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getUser, getLoginUserId } from "@/assets/js/auth.js";
import { 
  getGlobalProperties, 
  isAmdYn, 
  isReadYn 
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
  getCurrentInstance().appContext.config.globalProperties.$emitter;
const user = getUser();

const curPage = ref("");
const curTitle = ref("");
const dialogVisibleModify = ref(false);

const emits = defineEmits(["pageMove"]);
const props = defineProps({
	dataStatusList: {
		type: Array,
		required: false,
	},	
  agentList: {
    type: Array,
    required: true,
  },
  totalPage: {
    type: Number,
    required: true,
  },
  curPage: {
    type: Number,
    required: true,
  },	
});

const state = reactive({
  agentList: [],
  agent: {},
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,    
  }
});

const tableHeader = ref([
  {
    prop: "agntId",
    label: "대리인 ID",
    width: 130,
  },
  {
    prop: "agntNm",
    label: "대리인 명",
    width: 130,
  },
  {
    prop: "agntModelNm",
    label: "대리인 모델 명",
    width: 120,
  },
  {
    prop: "agntTelNo",
    label: "전화번호",
    width: 120,
  },
  {
    prop: "medataSetSttusMtcdNm",
    label: "상태",
    width: 70,
  },
  {
    prop: "agntAmdDt",
    label: "수정일",
    width: 80,
  },
  {
    prop: "btn",
    label: "",
    width: 50,
    columnType: "custom",
  }
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const goToDetailDialog = (node) => {
  
  if (isReadYn(route.meta.auth)) {

		const index = node.$index;
		state.agent.index = index;

    state.agent.agntId = node.row.agntId;
    state.agent.agntNm = node.row.agntNm;
    state.agent.agntModelId = node.row.agntModelId;
    state.agent.agntModelNm = node.row.agntModelNm;
    state.agent.medataSetSttusMtcd = node.row.medataSetSttusMtcd;
    state.agent.agntDesc = node.row.agntDesc;
    state.agent.agntEngNm = node.row.agntEngNm;

    state.agent.agntEngDesc = node.row.agntEngDesc;
    state.agent.agntTelNo = node.row.agntTelNo;
    state.agent.agntHpage = node.row.agntHpage;
    state.agent.agntRegrId = node.row.agntRegrId;
    state.agent.agntRegrNm = node.row.agntRegrNm;
    state.agent.agntRegDt = node.row.agntRegDt;
    state.agent.agntAmdrId = node.row.agntAmdrId;
    state.agent.agntAmdrNm = node.row.agntAmdrNm;
    state.agent.agntAmdDt = node.row.agntAmdDt;

    if (!isAmdYn(route.meta.auth)) {
      curPage.value = "detail";
      curTitle.value = "대리인 상세조회";
    } else {
      curPage.value = "modify";
      curTitle.value = "대리인 편집"      
    }
    dialogVisibleModify.value = true;

  } else {
    dialogVisibleModify.value = false;
    alert("읽기 권한이 없습니다.");
  }
};

const modifyAgentInfo = async (payload) => {

  let ruleForm = payload.ruleFormRef.value;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let result = confirm("수정 하시겠습니까?");
      if (result) {

        let agntId = payload.data.agntId;

        let agentInfo = {
          ...payload.data,
          agntAmdrId: getLoginUserId(),
        };

        $axios
          .put(
            util.format($apiUrls.meta.resource.agent.modifyAgent, agntId),
            agentInfo
          )
          .then(() => {
            alert("수정이 완료되었습니다.");
            dialogVisibleModify.value = false;
						$emitter.emit("initAgentList");
          })
          .catch((err) => {
            console.log(err);
						if ( err.response.status && (err.response.status === 422 || err.response.status === 400)) {
							//ResBadRequestException | ResBizInfoException exception status
							alert(err.response.data.message);
						} else {
							alert("대리인 수정에 실패하였습니다.");
						}
          });
      }
    } else {
      alert("입력 정보를 다시 한번 확인해주세요.");
    }
  });

};

const deleteAgentInfo = (payload) => {

  let result = confirm("삭제하시겠습니까?")
  if (result) {
    
    let agntId = payload.data.agntId;
    $axios.
      delete(util.format($apiUrls.meta.resource.agent.deleteAgent, agntId))
      .then(() => {
        alert("삭제 완료하였습니다.");
        dialogVisibleModify.value = false;
				$emitter.emit("initAgentList");
      })
      .catch((err) => {

        console.log(err);
				if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
					alert(err.response.data.message);
				} else {
					alert("삭제에 실패하였습니다.");
				}				
      });
  }

};

const handleClickModify = (index) => {
  tableData.value.splice(index, 1);
}

const cancelModifyDialog = () => {
  dialogVisibleModify.value = false;
};

</script>
<style lang="scss"></style>