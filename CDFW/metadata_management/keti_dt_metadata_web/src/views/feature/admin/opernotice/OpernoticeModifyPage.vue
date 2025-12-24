<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>공지사항 수정</h3>
      </div>
      <div class="boxCnt">
        <OpernoticeModify ref="modify" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="modifyOpernotice">저장</el-button>
      <el-button
        v-if="isDelYn(route.meta.auth)"
        type="primary"
        text
        bg
        @click="deleteOpernotice"
        >삭제</el-button
      >
      <el-button plain type="primary" @click="goToReadPage">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import OpernoticeModify from "@/components/admin/opernotice/OpernoticeModify.vue";

import { ref } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  isDelYn,
  getCookie,
  routerPush,
  deleteCookie
} from "@/assets/js/common.js";
import util from "util";
const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const modify = ref(null);

const modifyOpernotice = async () => {
  let ruleForm = modify.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let result = confirm("수정 하시겠습니까?");
      if (result) {
        let ntfOid = route.query.ntfOid;
        let { notice, fileList, originFile } = modify.value.data;
        let delArr = findDelArr(fileList, originFile);

        let noticeInfo = {
          ...notice,
          prevNtfYn: notice.prevNtfYn == true ? "Y" : "N",
          admPrsnNtfYn: notice.typeNtcTF == 1 ? "Y" : "N",
          mainPopupYn: notice.typeNtcTF == 2 ? "Y" : "N",
          clsButtIndcYn: notice.clsButtIndcYn == true ? "Y" : "N",
          todayPopupIndcYn: notice.todayPopupIndcYn == true ? "Y" : "N",
        };

        const formData = new FormData();

        formData.append(
          "info",
          new Blob([JSON.stringify(noticeInfo)], { type: "application/json" })
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
            util.format($apiUrls.admin.notices.modifyNoticeDetail, ntfOid),
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          )
          .then(() => {
            alert("수정이 완료되었습니다.");

            let platform = getCookie("pltfrmId");
            let query = {
              ntfOid: ntfOid,
            };
            routerPush(platform, "OpernoticeDetailPage", query);
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

const deleteOpernotice = async () => {
  let result = confirm("삭제 하시겠습니까?");
  if (result) {
    let ntfOid = route.query.ntfOid;
    let fileList = modify.value.data.fileList;
    $axios
      .delete(util.format($apiUrls.admin.notices.deleteNoticeDetail, ntfOid), {
        data: fileList,
      })
      .then(() => {
        alert("삭제가 완료되었습니다.");
        deleteCookie('ntf'+ntfOid);


        let platform = getCookie("pltfrmId");
        let query = null;
        routerPush(platform, "OpernoticeListPage", query);
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
    ntfOid: route.query.ntfOid,
  };
  routerPush(platform, "OpernoticeDetailPage", query);
};
</script>
<style lang="scss"></style>
