<template>
  <div class="cntSec">
    <NotificationTypeSearchForm
      @searchNotificationType="searchNotificationType"
    />
    <div class="btnSec taR mt10">
      <el-button type="primary" size="large"
        v-if="isWriteYn(route.meta.auth)"        
        @click="() => handleClickEdit()"
        >알림 유형 등록</el-button
      >
    </div>
    <div class="boxLayout">
      <div class="boxTit">
        <h3>알림 유형 목록</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <ComnList
            :tableHeader="tableHeader"
            :tableData="state.notificationTypeList"
          >
            <template v-slot:btnDetail="slotData">
              <el-button type="primary" size="small"
                @click="() => handleClickDetail(slotData.$index)"
                >관리</el-button
              >
            </template>
          </ComnList>
          <ComnPagination
            :curPage="state.pageInfo.curPage"
            :totalPage="state.pageInfo.totalListSize"
            @pagemove="pageMove"
          />
        </div>
      </div>
    </div>
    <div class="boxLayout">
      <div class="boxCnt">
        ※ 알림 유형을 신규로 등록하는 경우, 별도로 프로그래밍하여 시스템 배포를 해야 알림이 적용됩니다. <br />
        ※ 알림 사용 여부를 N 으로 하면 해당 알림이 발생하지 않습니다. <br />
        ※ 알림 사용 여부가 Y 이면 개별 사용자가 해당 알림 수신 여부를 설정하기 전까지 대상 전체에 알림이 갑니다.
      </div>
    </div>
  </div>
  <el-dialog v-model="dialogEdit" title="알림 유형 등록">
    <div class="dialog-area">
      <div class="boxLayout">
        <div class="boxTit"><h3>알림 유형 정보</h3></div>
        <div class="boxCnt">
          <el-form label-position="right"
            ref="ruleFormRef"
            :model="state.editInfo"
            :rules="state.rules"
            label-width="210px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 유형 ID" prop="notifcTypeId">
                  <div class="inline-area">
                    <el-input
                      style="width: 250px"
                      v-model="state.editInfo.notifcTypeId"
                    />
                    <el-button type="primary" class="ml15" @click="() => isIdDuplicated(true)"
                      >중복확인</el-button
                    >
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 유형 명" prop="notifcTypeNm">
                  <el-input
                    v-model="state.editInfo.notifcTypeNm"
                    style="width: 400px"
                  >
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 사용 여부" prop="notifcUseYn">
                  <el-select
                    v-model="state.editInfo.notifcUseYn"
                    placeholder="선택"
                    style="width: 400px"
                  >
                    <el-option label="Y" value="Y" />
                    <el-option label="N" value="N" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 유형 설명" prop="notifcTypeDesc">
                  <el-input
                    v-model="state.editInfo.notifcTypeDesc"
                    style="width: 400px"
                  >
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="24">
                <el-form-item
                  label="알림 메시지 제한 길이"
                  prop="notifcMsgRstrtnLen"
                >
                  <el-select
                    v-model="state.editInfo.notifcMsgRstrtnLen"
                    placeholder="선택"
                    style="width: 400px"
                  >
                    <el-option label="128" value="128" />
                    <el-option label="4000" value="4000" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 메시지 템플릿" prop="notifcMsgTmplt">
                  <el-input
                    type="textarea"
                    style="width: 400px"
                    v-model="state.editInfo.notifcMsgTmplt"
                  >
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item
                  label="알림 링크 템플릿 URL"
                  prop="notifcLinkTmpltUrl"
                >
                  <el-input
                    style="width: 400px"
                    v-model="state.editInfo.notifcLinkTmpltUrl"
                  >
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="정렬 순서" prop="notifcTypeSortOdrg">
                  <el-input
                    style="width: 400px"
                    v-model="state.editInfo.notifcTypeSortOdrg"
                    type="number"
                    maxlength="5"
                  >
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
      <div class="taR mb10">
        ※ 템플릿에 사용되는 #파라미터#는 프로그래밍이 필요합니다.
      </div>
      <div class="btnSec taR">
        <el-button type="primary" @click="editNotificationType">저장</el-button>
        <el-button type="default" @click="closeDialogEdit"
          >취소</el-button
        >
      </div>
    </div>
  </el-dialog>
</template>
<script setup>
import NotificationTypeSearchForm from "@/components/meta/notification/NotificationTypeSearchForm.vue";
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import util from "util";

import { nextTick, ref, reactive, onMounted } from "vue";
import {
  getCookie,
  routerPush,
  getGlobalProperties,
  isWriteYn,
} from "@/assets/js/common.js";
import { useRoute } from "vue-router";
const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const dialogEdit = ref();
const ruleFormRef = ref(null);

const tableHeader = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 50,
  },
  {
    prop: "notifcTypeId",
    label: "알림 유형 ID",
    width: 180,
  },
  {
    prop: "notifcTypeNm",
    label: "알림 유형 명",
    width: 180,
  },
  {
    prop: "notifcUseYn",
    label: "사용 여부",
    width: 80,
  },
  {
    prop: "notifcMsgTmplt",
    label: "알림 메시지 템플릿",
    width: 250,
  },
  {
    prop: "notifcTgtrNmsStr",
    label: "알림 대상자",
    width: 180,
  },
  {
    prop: "btnDetail",
    label: "관리",
    width: 60,
    columnType: "custom",
  },
]);

const state = reactive({
  notificationTypeList: [],
  searchInfo: {},
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  },
  editInfo: {
    notifcTypeId: "",
    notifcTypeNm: "",
    notifcUseYn: "",
    notifcTypeDesc: "",
    notifcMsgRstrtnLen: "",
    notifcMsgTmplt: "",
    duplicationStatus: null,
    notifcTypeSortOdrg: 0,
  },
  rules: {
    notifcTypeId: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
    ],
    notifcTypeNm: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
    ],
    notifcUseYn: [
      {
        required: true,
        message: "선택하세요.",
        trigger: "blur",
      },
    ],
    notifcMsgRstrtnLen: [
      {
        required: true,
        message: "선택하세요.",
        trigger: "blur",
      },
    ],
    notifcMsgTmplt: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
    ],
    notifcTypeSortOdrg: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
      {
        validator: (rule, value) => {
          const parsedValue = parseInt(value, 10);
          if (value && value.length > 5) {
            return Promise.reject("5자 이하만 가능합니다.");
          } else if (
            isNaN(parsedValue) ||
            parsedValue < 0 ||
            parsedValue > 99999
          ) {
            return Promise.reject("0 ~ 99999 사이의 값만 입력할 수 있습니다.");
          } else {
            return Promise.resolve();
          }
        },
        trigger: "blur",
      },
    ],
  },
});

const searchNotificationType = (payload) => {
  state.pageInfo = {
    curPage: 1,
    pageListSize: 10,
  };
  state.searchInfo = payload;
};

const getNotificationTypeList = () => {
  let param = Object.assign({}, state.pageInfo, state.searchInfo);

  $axios
    .get($apiUrls.meta.portal.notification.getNotificationTypeList, {
      params: param,
    })
    .then((res) => {
      state.pageInfo = res.data.page;
      state.notificationTypeList = res.data.list.map((item, idx) => {
        item.rownum =
          state.pageInfo.pageListSize * (state.pageInfo.curPage - 1) + idx + 1;
        return item;
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

onMounted(() => {
  nextTick(() => {
    getNotificationTypeList();
  });
});

const pageMove = (curPage) => {
  state.pageInfo.curPage = curPage;
  getNotificationTypeList();
};

const handleClickEdit = () => {
  dialogEdit.value = true;
};

const isIdDuplicated = async (alertYn) => {
  let id = state.editInfo.notifcTypeId;
  if (id == null || id == "") {
    alert("ID를 입력하세요.");
    return;
  }
  $axios
    .get($apiUrls.meta.portal.notification.isNotifcTypeIdDuplicated, {
      params: {
        notifcTypeId: id,
      },
    })
    .then((res) => {
      if (res.data.duplicated == true) {
        alert("중복된 ID가 존재합니다.");
        state.editInfo.duplicationStatus = true;
        return;
      }
      if (alertYn == true) {
        alert("사용 가능한 ID 입니다.");
      }
      state.editInfo.duplicationStatus = false;
    })
    .catch((err) => {
      console.log(err);
    });
};

const goToDetail = (index, notifcTypeId) => {
  if (notifcTypeId == null) {
    let platform = getCookie("pltfrmId");
    let query = {
      notifcTypeId: state.notificationTypeList[index].notifcTypeId,
    };
    routerPush(platform, "NotificationTypeDetailPage", query);
    return;
  }

  let platform = getCookie("pltfrmId");
  let query = { notifcTypeId: notifcTypeId };
  routerPush(platform, "NotificationTypeDetailPage", query);
};

const handleClickDetail = (index) => {
  goToDetail(index, null);
};

const closeDialogEdit = () => {
  dialogEdit.value = false;
};

const initEditInfo = () => {
  state.pageInfo = {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  };
  state.searchInfo = {};
  state.editInfo = {
    notifcTypeId: "",
    notifcTypeNm: "",
    notifcUseYn: "",
    notifcTypeDesc: "",
    notifcMsgRstrtnLen: "",
    notifcMsgTmplt: "",
    duplicationStatus: null,
    notifcTypeSortOdrg: 0,
  };
};

const editNotificationType = async () => {
  if (state.editInfo.duplicationStatus == null) {
    alert("ID 중복 확인 바랍니다.");
    return;
  }
  await isIdDuplicated(false);
  if (state.editInfo.duplicationStatus == true) {
    return;
  }
  let ruleForm = ruleFormRef.value;
  if (!ruleForm) {
    return;
  }
  let editForm = state.editInfo;
  ruleForm.validate((valid) => {
    if (!valid) {
      alert("입력 정보를 다시 한번 확인해주세요.");
      return;
    }
    if (!confirm("등록하시겠습니까?")) return;
    $axios
      .post($apiUrls.meta.portal.notification.createNotifcType, editForm, {
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => {
        alert("등록되었습니다.");
        dialogEdit.value = false;
        goToDetail(null, res.data.id);
        initEditInfo();
      })
      .catch((err) => {
        console.log(err);
        if (
          err.response &&
          err.response.status &&
          (err.response.status === 422 || err.response.status === 400)
        ) {
          alert(err.response.data.message);
        } else {
          alert("알림 유형 등록에 실패하였습니다.");
        }
      });
  });
};
</script>
  <style lang="scss"></style>