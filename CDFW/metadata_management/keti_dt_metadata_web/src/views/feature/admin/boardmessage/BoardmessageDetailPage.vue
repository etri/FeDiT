<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>게시글 정보</h3>
      </div>
      <div class="boxCnt">
        <BoardmessageDetail
          :boardmsg="boardmsg"
          :board="board"
          :fileList="fileList"
          @downloadFile="downloadFile"
        />
      </div>
    </div>

    <div class="btnSec taR mt20">
      <el-button
        v-if="isAmdYn(route.meta.auth)"
        type="primary"
        @click="modifyBoardmsg"
        >수정</el-button
      >
      <el-button plain type="primary" @click="goToList">목록</el-button>
    </div>

    <div class="boxLayout" v-if="board.useYn == 'Y' && board.replUseYn == 'Y'">
      <div class="boxTit">
        <h3>댓글</h3>
      </div>
      <div class="boxCnt">
        <BoardMessageComment
          :comments="comments"
          @saveComment="saveComment"
          @modifyComment="modifyComment"
          @deleteComment="deleteComment"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import BoardmessageDetail from "@/components/admin/boardmessage/BoardmessageDetail.vue";
import BoardMessageComment from "@/components/admin/boardmessage/BoardMessageComment.vue";

import { onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  getGlobalProperties,
  commonFileDownload,
  isAmdYn,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import util from "util";
import { getUser } from "@/assets/js/auth.js";

const user = getUser();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const board = ref({});
const boardmsg = ref({});
const fileList = ref([]);
const comments = ref([]);

onMounted(async () => {
  getBoardmsgDetail();
  await getBoardDetail();
  if (board.value.atcFileUseYn == "Y") await getAttachedFileList();
  if (board.value.replUseYn == "Y") await getCommentList();
});

const setBbsOid = () => {
  let checkOidArr = route.query.param.split("=");
  return checkOidArr[1];
};

const getBoardmsgDetail = () => {
  let bbsOid = setBbsOid();
  let pstngOid = route.query.pstngOid;

  $axios
    .get(util.format($apiUrls.admin.boardmsg.getBoardmsgDetail, bbsOid, pstngOid))
    .then((res) => {
      boardmsg.value = res.data;
      boardmsg.value.prevPstngYn == "Y"
        ? (boardmsg.value.prevPstngYn = true)
        : (boardmsg.value.prevPstngYn = false);
    })
    .catch((err) => {
      console.log(err);
    });
};

//1, 보드 디테일 가지고 온다.
//2. 댓글여부확인 -> 댓글 리스트 -> 등록 수정 삭제기능
//3. 첨부파일 여부 확인 -> 첨부파일 리스트 -> 등록 수정 삭제기능 (근데 보이진 않음)

const getBoardDetail = async () => {
  let bbsOid = setBbsOid();
  await $axios
    .get(util.format($apiUrls.admin.board.getBoardDetail, bbsOid))
    .then((res) => {
      board.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAttachedFileList = async () => {
  let bbsOid = setBbsOid();
  let pstngOid = route.query.pstngOid;

  await $axios
    .get(
      util.format(
        $apiUrls.admin.boardmsg.getBoardmsgAttachFiles,
        bbsOid,
        pstngOid
      )
    )
    .then((res) => {
      fileList.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getCommentList = async () => {
  let bbsOid = setBbsOid();
  let pstngOid = boardmsg.value.pstngOid;

  await $axios
    .get(
      util.format($apiUrls.admin.boardmsg.getBoardmsgComments, bbsOid, pstngOid)
    )
    .then((res) => {
      comments.value = res.data;
      for (let data of comments.value) {
        data.modiValue = "R";
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    param: route.query.param,
  };
  routerPush(platform, "BoardmessageListPage", query);
};

const modifyBoardmsg = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    param: route.query.param,
    pstngOid: boardmsg.value.pstngOid,
  };
  routerPush(platform, "BoardmessageModifyPage", query);
};

//========댓글 관련========
const saveComment = (payload) => {
  let bbsOid = setBbsOid();
  let pstngOid = boardmsg.value.pstngOid;

  let boardmsgComment = {
    bbsOid: bbsOid,
    pstngOid: pstngOid,
    cmmtSbst: payload.comment,
    
  };

  $axios
    .post(
      util.format($apiUrls.admin.boardmsg.setBoardmsgComments, bbsOid, pstngOid),
      boardmsgComment
    )
    .then((res) => {
      alert("댓글이 저장되었습니다.");
      router.go();
    })
    .catch((err) => {
      console.log(err);
    });
};

const modifyComment = (payload) => {
  let result = confirm("수정 하시겠습니까?");
  if (result) {
    let bbsOid = setBbsOid();
    let pstngOid = payload.comment.pstngOid;
    let cmmtOid = payload.comment.cmmtOid;
    let boardmsgComment = payload.comment;
    boardmsgComment.bbsOid = bbsOid;
    boardmsgComment.amdr = user.id;

    $axios
      .put(
        util.format(
          $apiUrls.admin.boardmsg.modifyBoardmsgComments,
          bbsOid,
          pstngOid,
          cmmtOid
        ),
        boardmsgComment
      )
      .then((res) => {
        alert("댓글이 수정되었습니다.");
        router.go();
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

const deleteComment = (payload) => {
  let result = confirm("삭제 하시겠습니까?");
  if (result) {
    let bbsOid = setBbsOid();
    let pstngOid = payload.comment.pstngOid;
    let cmmtOid = payload.comment.cmmtOid;

    $axios
      .delete(
        util.format(
          $apiUrls.admin.boardmsg.deleteBoardmsgComments,
          bbsOid,
          pstngOid,
          cmmtOid
        )
      )
      .then((res) => {
        alert("댓글이 삭제되었습니다.");
        router.go();
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

const downloadFile = (payload) => {
  commonFileDownload(
    $axios,
    $apiUrls.admin.common.getDownloadFile,
    payload.fileRestoNm,
    payload.fileOriginNm
  );
};
</script>
<style lang="scss"></style>
