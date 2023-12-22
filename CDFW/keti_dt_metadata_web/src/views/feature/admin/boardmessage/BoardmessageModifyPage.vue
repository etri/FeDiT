<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>수정</h3>
      </div>
      <div class="boxCnt">
        <BoardmessageModify ref="boardM" :board="board" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="modifyBoardmsg">저장</el-button>
      <el-button
        v-if="isDelYn(route.meta.auth)"
        type="primary"
        text
        bg
        @click="deleteBoardmsg"
        >삭제</el-button
      >
      <el-button plain type="primary" @click="goToReadPage">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import BoardmessageModify from "@/components/admin/boardmessage/BoardmessageModify.vue";

import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  isDelYn,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import { getLoginUserId } from "@/assets/js/auth.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const boardM = ref(null);
const board = ref({});

onMounted(() => {
  getBoardDetail();
});

const setBbsOid = () => {
  let checkOidArr = route.query.param.split("=");
  return checkOidArr[1];
};

const getBoardDetail = () => {
  let bbsOid = setBbsOid();
  $axios
    .get(util.format($apiUrls.admin.board.getBoardDetail, bbsOid))
    .then((res) => {
      board.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

//수정//
const modifyBoardmsg = async () => {
  let ruleForm = boardM.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let result = confirm("수정 하시겠습니까?");
      if (result) {
        const boardmsgData = boardM.value.data;
        const { boardmsg, fileList, originFile } = boardmsgData;
        const { bbsOid, pstngOid } = boardmsg;
        const delArr = findDelArr(fileList, originFile);

        let brdMsgInfo = {
          ...boardmsg,
          prevPstngYn: boardmsg.prevPstngYn == true ? "Y" : "N",
          amdr: getLoginUserId(),
        };

        const formData = new FormData();

        formData.append(
          "info",
          new Blob([JSON.stringify(brdMsgInfo)], { type: "application/json" })
        );

        if (fileList.length > 0) {
          fileList.forEach((file) => {
            formData.append("fileList", file.raw);
          });
        }

        if (delArr.length > 0) {
          formData.append(
            "deleteFileList",
            new Blob([JSON.stringify(delArr)], { type: "application/json" })
          );
        }

        $axios
          .put(
            util.format(
              $apiUrls.admin.boardmsg.modifyBoardmsgDetail,
              bbsOid,
              pstngOid
            ),
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          )
          .then(() => {
            console.log("modifyNoticeDetail");

            alert("수정이 완료되었습니다.");

            let platform = getCookie("pltfrmId");
            let query = {
              param: route.query.param,
              pstngOid: route.query.pstngOid,
            };
            routerPush(platform, "BoardmessageDetailPage", query);
          })
          .catch((err) => {
            console.log(err);
            alert("저장에 실패하였습니다.");
          });
      }
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

const findDelArr = (fileList, originFile) => {
  const delArr = originFile.filter((origin) => {
    return !fileList.some((file) => file.atcOid === origin.atcOid);
  });
  return delArr;
};

//삭제//
const deleteBoardmsg = () => {
  let result = confirm("삭제 하시겠습니까?");
  if (result) {
    let bbsOid = setBbsOid();
    let pstngOid = route.query.pstngOid;
    let fileList = boardM.value.data.fileList;
    $axios
      .delete(
        util.format(
          $apiUrls.admin.boardmsg.deleteBoardmsgDetail,
          bbsOid,
          pstngOid
        ),
        {
          data: fileList,
        }
      )
      .then(() => {
        alert("삭제가 완료되었습니다.");

        let platform = getCookie("pltfrmId");
        let query = {
          param: route.query.param,
          pstngOid: route.query.pstngOid,
        };
        routerPush(platform, "BoardmessageListPage", query);
      })
      .catch((err) => {
        console.log(err);
        alert("삭제에 실패하였습니다.");
      });
  }
};
const goToReadPage = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    param: route.query.param,
    pstngOid: route.query.pstngOid,
  };
  routerPush(platform, "BoardmessageDetailPage", query);
};
</script>
<style lang="scss"></style>
