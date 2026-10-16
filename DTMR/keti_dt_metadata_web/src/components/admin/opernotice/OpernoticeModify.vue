<template>
  <el-form
    ref="ruleFormRef"
    :label-position="labelPosition"
    :model="state.notice"
    :rules="state.rules"
    label-width="100px"
    class="demo-ruleForm"
  >
    <el-form-item label="등록자" prop="regrId">
      <el-input v-model="state.notice.regrId" disabled></el-input>
    </el-form-item>

    <el-form-item label="구분" prop="typeNtcTF">
      <el-radio-group
        v-model="state.notice.typeNtcTF"
        class="ml-4"
        @change="changeRadioButton"
      >
        <el-radio label="1">공지사항</el-radio>
        <el-radio label="2">메인화면 팝업</el-radio>
      </el-radio-group>
    </el-form-item>

    <div v-if="state.notice.typeNtcTF == 1">
      <el-form-item label="우선공지 여부" prop="prevNtfYn">
        <el-checkbox
          label="항상 목록의 최상위에 표시 됩니다."
          v-model="state.notice.prevNtfYn"
        ></el-checkbox>
      </el-form-item>
    </div>

    <div v-if="state.notice.typeNtcTF == 2">
      <el-form-item label="공지대상 포탈" prop="ntcOperTF">
        <el-radio-group v-model="state.notice.ntcOperTF" class="ml-4">
          <el-radio label="1">IoT 플랫폼 관리포탈</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="팝업 사이즈" prop="popupSize">
        <el-row>
          <el-col :span="1" :xs="24"><span>가로 :</span> </el-col>
          <el-col :span="6" :xs="24">
            <el-input v-model="state.notice.popupWdth"></el-input>
          </el-col>
          <el-col :span="1" :xs="24"><span class="sidePx">px</span> </el-col>
          <el-col :span="1" :xs="24"><span>높이 :</span> </el-col>
          <el-col :span="6" :xs="24">
            <el-input v-model="state.notice.popupHght"></el-input>
          </el-col>
          <el-col :span="2" :xs="24"><span class="sidePx">px</span> </el-col>
        </el-row>
      </el-form-item>
      <el-form-item label="팝업기간" prop="popupDate">
        <el-row :gutter="24">
          <el-col :span="4">
            <div class="demo-date-picker">
              <div class="block">
                <el-date-picker
                  v-model="state.notice.popupStDt"
                  type="datetime"
                  placeholder="시작일"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  :disabled-date="disabledDate1"
                  style="width: 170px"
                />
              </div>
            </div>
          </el-col>
          <el-col :span="1"><span>~</span></el-col>
          <el-col :span="8">
            <div class="demo-date-picker">
              <div class="block">
                <el-date-picker
                  v-model="state.notice.popupFnsDt"
                  type="datetime"
                  placeholder="종료일"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  :disabled-date="disabledDate2"
                  style="width: 170px"
                />
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form-item>

      <el-form-item label="팝업옵션" prop="popupOption">
        <el-row>
          <el-col :span="10" :xs="24">
            <el-checkbox
              label="* 닫기 버튼 표시 여부"
              v-model="state.notice.clsButtIndcYn"
            ></el-checkbox>
          </el-col>
          <el-col :span="7" :xs="24">
            <el-checkbox
              label="* [오늘 하루 이창을 열지 않음] 표시 여부"
              v-model="state.notice.todayPopupIndcYn"
            ></el-checkbox>
          </el-col>
        </el-row>
      </el-form-item>
    </div>

    <el-form-item label="제목" prop="ntfTitle">
      <el-input v-model="state.notice.ntfTitle"></el-input>
    </el-form-item>

    <el-form-item label="내용" prop="ntfSbst">
      <comn-editor v-model="state.notice.ntfSbst" :max-limit="280" />
    </el-form-item>

    <el-form-item label="파일 업로드" prop="file">
      <ComnUpload
        :infofileList="state.fileList"
        @uploadFile="uploadFile"
        :limit="limit"
        style="width: 100%"
      />
    </el-form-item>
  </el-form>
</template>
<script setup>
import ComnEditor from "@/components/common/ComnEditor";
import ComnUpload from "@/components/common/ComnUpload.vue";

import { ref, reactive, defineExpose, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";

import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const limit = ref(0);
const labelPosition = ref("right");
const ruleFormRef = ref(null);

const state = reactive({
  notice: {},
  fileList: [],
  rules: {
    ntcSubject: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "내용 입력",
        trigger: "blur",
      },
    ],
    ntcContent: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "내용 입력",
        trigger: "blur",
      },
    ],
  },
});

onMounted(() => {
  getOpernoticeDetail();
  getAttachedFileList();
});

const getOpernoticeDetail = () => {
  let ntfOid = route.query.ntfOid;
  $axios
    .get(util.format($apiUrls.admin.notices.getNoticeDetail, ntfOid))
    .then((res) => {
      state.originNotice = Object.assign({}, res.data);
      state.notice = res.data;
      res.data.admPrsnNtfYn == "Y"
        ? (state.notice.typeNtcTF = "1")
        : (state.notice.typeNtcTF = "2");
      state.notice.ntcOperTF = "1";
      state.notice.clsButtIndcYn == "Y"
        ? (state.notice.clsButtIndcYn = true)
        : (state.notice.clsButtIndcYn = false);
      state.notice.todayPopupIndcYn == "Y"
        ? (state.notice.todayPopupIndcYn = true)
        : (state.notice.todayPopupIndcYn = false);
      state.notice.prevNtfYn == "Y"
        ? (state.notice.prevNtfYn = true)
        : (state.notice.prevNtfYn = false);
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAttachedFileList = () => {
  let ntfOid = route.query.ntfOid;
  $axios
    .get(util.format($apiUrls.admin.notices.getNoticeAttachFiles, ntfOid))
    .then((res) => {
      state.fileList = res.data.slice();
      state.originFile = res.data;
      for (let data of state.fileList) {
        data.name = data.fileOriginNm;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

//radio button 클릭 시 포맷되도록 설정, modify에서 기존 데이터가 날라갈 수 있어 우선 사용안함.
const changeRadioButton = () => {
  //   if (state.notice.ntcMainPopTF == 1) {
  //     state.notice.ntcMainPopCloseTF = false;
  //     state.notice.ntcMainPopNotOpenTF = false;
  //     state.notice.ntcMainPopWidth = "";
  //     state.notice.ntcMainPopHeight = "";
  //     state.notice.ntcMainStart = "";
  //     state.notice.ntcMainEnd = "";
  //   } else state.notice.ntcFirstTF = [];
};

const disabledDate1 = (time) => {
  if (state.notice.ntcMainEnd == null || state.notice.ntcMainEnd == "")
    return (state.notice.ntcMainEnd = "");
  return time.getTime() > new Date(state.notice.ntcMainEnd);
};
const disabledDate2 = (time) => {
  return time.getTime() < new Date(state.notice.ntcMainStart);
};

const uploadFile = (payload) => {
  state.fileList = [];
  for (let data of payload.fileList) state.fileList.push(data);
};

defineExpose({
  notice: state.notice,
  data: state,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss"></style>
