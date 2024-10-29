<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>QNA 등록</h3>
      </div>
      <div class="boxCnt">
        <QnaEdit ref="editQna" />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditQnaDetail">저장</el-button>
      <el-button plain type="primary" @click="goToList">취소</el-button>
    </div>
  </div>
</template>
<script setup>
import QnaEdit from "@/components/admin/qna/QnaEdit.vue";

import { ref } from "vue";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
} from "@/assets/js/common.js";
import { useStore } from "vuex";
import metaNotifcUtil from "@/assets/js/metaNotifcUtil.js"

const store = useStore();

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const editQna = ref(null);

const EditQnaDetail = async () => {
  let ruleForm = editQna.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      const qna = editQna.value.data.qna;
      const fileList = editQna.value.data.fileList;

      const qnaInfo = {
        ...qna,
        ottpYn: qna.ottpYn == "1" ? "Y" : "N",
        pltfrmId: getCookie("pltfrmId"),
      };

      const formData = new FormData();

      formData.append(
        "info",
        new Blob([JSON.stringify(qnaInfo)], { type: "application/json" })
      );

      if (fileList.length > 0) {
        fileList.forEach((file) => formData.append("fileList", file.raw));
      }

      $axios
        .post($apiUrls.admin.qna.setQnaDetail, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          if (res.headers.location) {
            const arrTemp = res.headers.location.split("/");
            const qnaOid = arrTemp.pop();
            const qnaTitle = editQna.value.data.qna.qnaTitle;
            // meta 플랫폼 // 알림 등록
            if (process.env.VUE_APP_METADATA_ALARM_ICON_SHOW_YN === 'Y') {
              sendNotifcReqQna(qnaOid, qnaTitle);
            }
          }

          alert("저장되었습니다.");

          let platform = getCookie("pltfrmId");
          let query = null;
          routerPush(platform, "QnaListPage", query);
        })
        .catch((err) => {
          console.log(err);
          alert("저장에 실패하였습니다.");
        });
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "QnaListPage", query);
};

const sendNotifcReqQna = (qnaOid, qnaTitle) => {
  if (!qnaOid) return;

  try {
    const notifcData = {
      notifcTypeId: 'NTP_REQ_QNA_DEFAULT'
    };
    const notifcParams = {
      qnaOid: qnaOid,
      qnaTitle: qnaTitle
    };

    metaNotifcUtil.sendNotifc(store, notifcData, notifcParams);
  } catch (e) {
    console.log('sendNotifcReqQna 알림 등록 중 오류 발생', e);
  }
}
</script>
<style lang="scss"></style>
