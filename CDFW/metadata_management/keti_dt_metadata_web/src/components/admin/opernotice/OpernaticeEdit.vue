<template>
  <el-form
    ref="ruleFormRef"
    :label-position="labelPosition"
    :model="state.notice"
    :rules="state.rules"
    label-width="100px"
    class="demo-ruleForm"
  >
    <el-form-item label="등록자" prop="regrId" >
      <el-input v-model="user.id" disabled></el-input>
    </el-form-item>

    <el-form-item label="구분" prop="typeNtcTF">
      <el-radio-group
        v-model="state.notice.typeNtcTF"
        class="ml-4"
        @change="change"
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
            <el-input v-model.number="state.notice.popupWdth"></el-input>
          </el-col>
          <el-col :span="1" :xs="24"><span class="sidePx">px</span> </el-col>
          <el-col :span="1" :xs="24"><span>높이 :</span> </el-col>
          <el-col :span="6" :xs="24">
            <el-input v-model.number="state.notice.popupHght"></el-input>
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
        @uploadFile="uploadFile"
        :limit="limit"
        style="width: 100%"
        :infofileList="state.fileList"
      />
    </el-form-item>
  </el-form>
</template>
<script setup>
import ComnEditor from "@/components/common/ComnEditor";
import ComnUpload from "@/components/common/ComnUpload.vue";
import { ref, reactive, defineExpose } from "vue";
import { getUser } from "@/assets/js/auth.js";

const limit = ref(0);
const user = getUser();

const ruleFormRef = ref(null);
const labelPosition = ref("right");

const state = reactive({
  notice: {
    typeNtcTF: "1",
    ntcOperTF: "1",
    ntfTitle: "",
    ntfSbst: "",
    retvNum: "",
    prevNtfYn: false,
    popupStDt: "",
    popupFnsDt: "",
    popupWdth: "",
    popupHght: "",
    todayPopupIndcYn: "",
    clsButtIndcYn: "",
  },
  fileList: [],
  rules: {
    ntfTitle: [
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
    ntfSbst: [
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
const disabledDate1 = (time) => {
  if (state.notice.popupFnsDt == null || state.notice.popupFnsDt == "")
    return (state.notice.popupFnsDt = "");
  return time.getTime() > new Date(state.notice.popupFnsDt);
};
const disabledDate2 = (time) => {
  if (state.notice.popupStDt == null || state.notice.popupStDt == "")
    return (state.notice.popupStDt = "");
  return time.getTime() < new Date(state.notice.popupStDt);
};

const uploadFile = (payload) => {
  state.fileList = [];
  for (let i of payload.fileList) state.fileList.push(i);
};

const change = () => {
  if (state.notice.typeNtcTF == 1) {
    state.notice.clsButtIndcYn = false;
    state.notice.todayPopupIndcYn = false;
    state.notice.popupWdth = "";
    state.notice.popupHght = "";
    state.notice.popupStDt = "";
    state.notice.popupFnsDt = "";
  } else state.notice.prevNtfYn = false;
};

defineExpose({
  data: state,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss">
.sidePx {
  margin-left: 8px;
}
</style>
