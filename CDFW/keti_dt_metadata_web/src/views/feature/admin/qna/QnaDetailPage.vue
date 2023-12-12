<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>Q&A 질문</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <QnaDetail :qna="qna" :fileList="fileList" />
        </div>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button
        v-if="
          isAmdYn(route.meta.auth) &&
          qna.qnaAns == null &&
          qna.regrId == user.id
        "
        type="primary"
        @click="modifyQna"
        >수정</el-button
      >
      <el-button plain type="primary" @click="goToList">목록</el-button>
    </div>
    <div class="boxLayout">
      <div class="boxTit">
        <h3>Q&A 답변</h3>
      </div>
      <div class="boxCnt">
        <QnaAnswer :qna="qna" @sendQnaAnser="sendQnaAnser" :answerable="isPublicQna" />
      </div>
    </div>
  </div>
</template>
<script setup>
import QnaDetail from "@/components/admin/qna/QnaDetail.vue";
import QnaAnswer from "@/components/admin/qna/QnaAnswer.vue";

import { ref, onMounted, watch, onBeforeMount } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getGlobalProperties,
  isAmdYn,
  getCookie,
  routerPush,
  getSuperAdmin,
} from "@/assets/js/common.js";
import { getUser } from "@/assets/js/auth.js";
import { useStore } from "vuex";
import metaNotifcUtil from "@/assets/js/metaNotifcUtil.js"

const store = useStore();

const user = getUser();
import util from "util";
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const route = useRoute();
const router = useRouter();

const qna = ref({});
const fileList = ref([]);
const isPublicQna = ref(false);

onBeforeMount( async () => {
	//route 정보가 다 준비될 때까지 대기.
	await router.isReady();
});

onMounted(() => {
  getQnaDetail();
});

watch(
  () => route.query.qnaOid,
  (cur, prev) => {
    //동일 화면에서 링크를 통한 이동 진행 시, 해당 쿼리스트링에 맞는 새 정보를 렌더링
    if (cur) getQnaDetail();
  },
  { deep: true }
)

const getQnaDetail = () => {  
  let qnaOid = route.query.qnaOid;

  $axios
    .get(util.format($apiUrls.admin.qna.getQnaDetail, qnaOid))
    .then(async (res) => {

      if (await isPublicPost(res.data)) {
        qna.value = res.data;
        isPublicQna.value = true;
        if (res.data.fileCount > 0) getAttachedFileList();
      } else {
        qna.value = res.data;
        qna.value.qnaQstn = '비공개 글입니다.';
        qna.value.qnaAns = '비공개 글입니다.';
        isPublicQna.value = false;
      }

    })
    .catch((err) => {
      console.log(err);
    });
};

const getAttachedFileList = () => {
  let qnaOid = route.query.qnaOid;
  $axios
    .get(util.format($apiUrls.admin.qna.getQnaAttachFileList, qnaOid))
    .then((res) => {
      fileList.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "QnaListPage", query);
};

const sendQnaAnser = (payload) => {
  let qnaOid = route.query.qnaOid;
  let qnaInfo = qna.value;
  qnaInfo.qnaAns = payload.data;

  $axios
    .patch(util.format($apiUrls.admin.qna.registerQnaAnswer, qnaOid), qnaInfo)
    .then(() => {

      // meta 플랫폼 // 알림 등록
      if (process.env.VUE_APP_METADATA_ALARM_ICON_SHOW_YN === 'Y') {
        sendNotifcResQna(qnaOid, qnaInfo);
      }

      alert("저장이 완료되었습니다.");
      router.go();
    })
    .catch((err) => {
      console.log(err);
      alert("저장이 실패되었습니다.");
    });
};

const modifyQna = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    qnaOid: route.query.qnaOid,
  };
  routerPush(platform, "QnaModifyPage", query);
};

// 공개 글 여부
const isPublicPost = async (data) => {
  let superAdmin = await getSuperAdmin($axios, $apiUrls.admin.common.getSuperAdmin);
  if ( data.ottpYn == "Y" || user.id == data.regrId || user.id == superAdmin) {
    return true;
  } else {
    return false;
  }
}

const sendNotifcResQna = (qnaOid, qnaInfo) => {
  if (!qnaOid) return;

  try {
    const notifcData = {
      notifcTypeId: 'NTP_RES_QNA_DEFAULT',
      notifcRqtrDivMtcd: 'user', // auth / user
      notifcRqtrId: qnaInfo.regrId,
      notifcRqtrNm: qnaInfo.regrNm
    };
    const notifcParams = {
      qnaOid: qnaOid,
      qnaTitle: qnaInfo.qnaTitle
    };

    metaNotifcUtil.sendNotifc(store, notifcData, notifcParams);
  } catch (e) {
    console.log('sendNotifcResQna 알림 등록 중 오류 발생', e);
  }
}
</script>
<style lang="scss"></style>
