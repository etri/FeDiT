<template>
  <div>
    <div class="ly-title">
      <span>코드명</span>
      <span>코드값</span>
      <span>사용여부</span>
    </div>
    <div class="custom-tree-container">
      <el-tree
        :data="state.codeList"
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
        @node-click="goToDetailDialog"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <div>
              <span>{{ data.cdNm }}</span>
            </div>
            <div>
              <span style="text-align: right">{{ data.cdVal }}</span>
            </div>
            <div>
              <span style="text-align: right">{{ data.useYn }}</span>
            </div>
          </span>
        </template>
      </el-tree>
    </div>
    <hr />
    <div class="btnSec taR">
      <el-button
        v-if="isWriteYn(route.meta.auth) && curPage == 'modify'"
        type="primary"
        @click="dialogVisibleEdit = true"
        >등록</el-button
      >
    </div>

    <el-dialog v-model="dialogVisibleEdit" title="코드 등록">
      <CodeDialogEdit
        @cancelDialog="cancelDialog"
        @editCodeInfo="editCodeInfo"
      />
    </el-dialog>

    <el-dialog v-model="dialogVisibleModify" v-bind:title="curTitle">
      <CodeDialogModify
        :code="state.code"
        :curPage="curPage"
        :curTitle="curTitle"
        @cancelModiyDialog="cancelModiyDialog"
        @modifyCodeInfo="modifyCodeInfo"
        @deleteCodeInfo="deleteCodeInfo"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import CodeDialogEdit from "@/components/admin/code/CodeDialogEdit.vue";
import CodeDialogModify from "@/components/admin/code/CodeDialogModify.vue";

import { ref, reactive, onMounted, defineProps } from "vue";
import { useRoute } from "vue-router";

import {
  getGlobalProperties,
  isWriteYn,
  isReadYn,
} from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

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

const dialogVisibleEdit = ref(false);
const dialogVisibleModify = ref(false);

const state = reactive({
  codeList: [],
  code: {},
});
onMounted(() => {
  getCodeInfoList();
});
const getCodeInfoList = () => {
  let grpId = route.query.grpId;

  $axios
    .get(util.format($apiUrls.admin.code.getCodegroupCodeList, grpId), {
      params: {
        grpId: grpId,
      },
    })
    .then((res) => {
      state.codeList = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const cancelDialog = () => {
  dialogVisibleEdit.value = false;
};

const editCodeInfo = () => {
  dialogVisibleEdit.value = false;
  getCodeInfoList();
};

const goToDetailDialog = (node) => {
  let code = Object.assign({}, node);

  if (isReadYn(route.meta.auth)) {
    const index = state.codeList.indexOf(node);
    state.code.index = index;
    state.code = code;
    state.code.useYn == "Y"
      ? (state.code.useYn = true)
      : (state.code.useYn = false);

    dialogVisibleModify.value = true;
  } else {
    dialogVisibleModify.value = false;
    alert("읽기 권한이 없습니다.");
  }
};

const cancelModiyDialog = () => {
  dialogVisibleModify.value = false;
};

const modifyCodeInfo = async (payload) => {
  let ruleForm = payload.ruleFormRef.value;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let result = confirm("수정 하시겠습니까?");
      if (result) {
        let grpId = payload.data.grpId;
        let cdId = payload.data.cdId;

        let codeInfo = {
          ...payload.data,
          useYn: payload.data.useYn == true ? "Y" : "N",
        };

        $axios
          .put(util.format($apiUrls.admin.code.modifyCode, grpId, cdId), codeInfo)
          .then(() => {
            alert("수정이 완료되었습니다.");
            //수정 후 list의 인덱스 번째에 변경된 데이터 넣기.
            dialogVisibleModify.value = false;
            getCodeInfoList();
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

const deleteCodeInfo = (payload) => {
  let result = confirm("삭제 하시겠습니까?");
  if (result) {
    let grpId = payload.data.grpId;
    let cdId = payload.data.cdId;
    $axios
      .delete(util.format($apiUrls.admin.code.modifyCode, grpId, cdId))
      .then(() => {
        alert("삭제가 완료되었습니다.");
        getCodeInfoList();
        dialogVisibleModify.value = false;
      })
      .catch((err) => {
        console.log(err);
      });
  }
};
</script>
<style lang="scss"></style>
