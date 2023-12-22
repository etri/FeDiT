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
      <el-button type="primary"
        v-if="
          isAmdYn(route.meta.auth) &&
          qna.qnaAns == null &&
          qna.regrId == user.id
        "
        @click="modifyQna"
        >수정</el-button
      >
      <el-button type="default" @click="goToList">목록</el-button>
    </div>
    <div class="boxLayout">
      <div class="boxTit">
        <h3>Q&A 답변</h3>
      </div>
      <div class="boxCnt">
        <QnaAnswer :qna="qna"
         :answerable="answerable"
         />
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

const user = getUser();
import util from "util";
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const route = useRoute();
const router = useRouter();

const qna = ref({});
const fileList = ref([]);
const isPublicQna = ref(false);

const answerable = ref(false);

onBeforeMount( async () => {
	await router.isReady();
});

onMounted(() => {
  getQnaDetail();
});

watch(
  () => route.query.qnaOid,
  (cur, prev) => {
    if (cur) getQnaDetail();
  },
  { deep: true }
)

const getQnaDetail = () => {
  let qnaOid = route.query.qnaOid;

  $axios
    .get(util.format($apiUrls.admin.qna.getQnaDetail, qnaOid))
    .then( (res) => {
      if ( user.id == res.data.regrId ) {
        qna.value = res.data;
        isPublicQna.value = true;
        if (res.data.fileCount > 0) getAttachedFileList();
      } else {
        qna.value = { qnaOid: null };
        isPublicQna.value = false;
        alert('내 문의 내역이 아닙니다.');
        goToList();
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
  routerPush(platform, "MyQnaListPage", query);
};

const modifyQna = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    qnaOid: route.query.qnaOid,
  };
  routerPush(platform, "MyQnaModifyPage", query);
};

const isPublicPost = async (data) => {
  let superAdmin = await getSuperAdmin($axios, $apiUrls.admin.common.getSuperAdmin);
  if ( data.ottpYn == "Y" || user.id == data.regrId || user.id == superAdmin) {
    return true;
  } else {
    return false;
  }
}
</script>
<style lang="scss"></style>