<template>
  <div>
    <ComnList
      :tableHeader="tableHeader"
      :tableData="state.apiList"
      @row-click="goToDetailDialog"
    ></ComnList>

    <ComnPagination
      :totalPage="state.pageInfo.totalListSize"
      @pagemove="pagemove"
    />

    <div class="btnSec taR">
      <el-button
        v-if="isWriteYn(route.meta.auth) && curPage == 'modify'"
        type="primary"
        @click="dialogVisibleEdit = true"
        >등록</el-button
      >
    </div>

    <el-dialog v-model="dialogVisibleEdit" title="API 등록">
      <ApiDialogEdit @cancelDialog="cancelDialog" @editApiInfo="editApiInfo" />
    </el-dialog>

    <el-dialog v-model="dialogVisibleModify" v-bind:title="curTitle">
      <ApiDialogModify
        :api="state.api"
        :curPage="curPage"
        :curTitle="curTitle"
        @cancelModiyDialog="cancelModiyDialog"
        @modifyApiInfo="modifyApiInfo"
        @deleteApiInfo="deleteApiInfo"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import ApiDialogEdit from "@/components/admin/api/ApiDialogEdit.vue";
import ApiDialogModify from "@/components/admin/api/ApiDialogModify.vue";
import ComnPagination from "@/components/common/ComnPagination.vue";
import ComnList from "@/components/common/ComnList";

import { ref, reactive, defineProps, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  getGlobalProperties,
  isWriteYn,
  isReadYn,
} from "@/assets/js/common.js";
import util from "util";
import { getLoginUserId } from "@/assets/js/auth.js";

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const dialogVisibleEdit = ref(false);
const dialogVisibleModify = ref(false);

const props = defineProps({
  curPage: {
    type: String,
    required: false,
  },
  curTitle: {
    type: String,
    required: false,
  },
});

const state = reactive({
  apiList: [],
  api: {},
  pageInfo: {
    curPage: 1,
    fromDate: "",
    toDate: "",
    searchWord: "",
    searchType: "0",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
  },
});

const tableHeader = ref([
  {
    prop: "apiName",
    label: "API 명",
    width: 250,
  },
  {
    prop: "apiDesc",
    label: "API 설명",
    width: 250,
  },
  {
    prop: "apiUrl",
    label: "URL",
    width: 250,
  },
  {
    prop: "mthdCd",
    label: "메소드",
    width: 250,
  },
]);

onMounted(() => {
  getApiInfoList();
});

const getApiInfoList = () => {
  let grpOid = route.query.grpOid;

  $axios
    .get(util.format($apiUrls.admin.api.getApiPagingList, grpOid), {
      params: {
        curPage: state.pageInfo.curPage,
      },
    })
    .then((res) => {
      state.apiList = res.data.data;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const cancelDialog = () => {
  dialogVisibleEdit.value = false;
};

const editApiInfo = () => {
  getApiInfoList();
  dialogVisibleEdit.value = false;
};

const goToDetailDialog = (node) => {
  if (isReadYn(route.meta.auth)) {
    const index = state.apiList.indexOf(node);
    state.api.index = index;
    state.api.apiName = node.apiName;
    state.api.apiDesc = node.apiDesc;
    state.api.apiOid = node.apiOid;
    state.api.apiUrl = node.apiUrl;
    state.api.grpOid = node.grpOid;
    state.api.mthdCd = node.mthdCd;
    state.api.regDt = node.regDt;
    state.api.regrId = node.regrId;
    state.api.useYn = node.useYn == "Y" ? true : false;

    dialogVisibleModify.value = true;
  } else {
    dialogVisibleModify.value = false;
    alert("읽기 권한이 없습니다.");
  }
};

const modifyApiInfo = async (payload) => {
  let ruleForm = payload.ruleFormRef.value;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let result = confirm("수정 하시겠습니까?");
      if (result) {
        let apiOid = payload.data.apiOid;
        let grpOid = payload.data.grpOid;

        let apiInfo = {
          ...payload.data,
          amdr: getLoginUserId(),
          useYn: payload.data.useYn == true ? "Y" : "N",
        };

        $axios
          .put(
            util.format($apiUrls.admin.api.modifyApiDetail, grpOid, apiOid),
            apiInfo
          )
          .then(() => {
            alert("수정이 완료되었습니다.");
            dialogVisibleModify.value = false;
            //수정 후 list의 인덱스 번째에 변경된 데이터 넣기.
            let index = state.api.index;
            state.apiList[index] = apiInfo;
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

const deleteApiInfo = (payload) => {
  let result = confirm("삭제 하시겠습니까?");
  if (result) {
    let apiOid = payload.data.apiOid;
    let grpOid = payload.data.grpOid;
    $axios
      .delete(util.format($apiUrls.admin.api.deleteApiDetail, grpOid, apiOid))
      .then(() => {
        alert("삭제가 완료되었습니다.");
        dialogVisibleModify.value = false;
        getApiInfoList();
      })
      .catch((err) => {
        alert("삭제가 실패되었습니다.");
        console.log(err);
      });
  }
};

const cancelModiyDialog = () => {
  dialogVisibleModify.value = false;
};

const pagemove = (payload) => {
  state.pageInfo.curPage = payload;
  getApiInfoList();
};
</script>
<style lang="scss"></style>
