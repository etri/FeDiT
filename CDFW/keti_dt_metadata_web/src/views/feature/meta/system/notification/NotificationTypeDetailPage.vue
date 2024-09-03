<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>알림 유형 정보</h3>
      </div>
      <div class="boxCnt">
        <div class="btnSec taR mb10">
          <el-button type="primary"
            v-show="isAmdYn(route.meta.auth)"            
            @click="handleClickTypeModify"
            >수정</el-button
          >
          <el-button type="primary"
            v-show="!isAmdYn(route.meta.auth)"
            @click="handleClickTypeModify"
            >조회</el-button
          >
          <el-button type="default" @click="goToList">목록</el-button>
        </div>
        <div class="ly-table">
          <el-form label-position="right"
            label-width="170px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="12">
                <el-form-item label="알림 유형 ID">
                  {{ state.notifcType.notifcTypeId }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="알림 사용 여부">
                  {{ state.notifcType.notifcUseYn }}
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 유형 명">
                  {{ state.notifcType.notifcTypeNm }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 유형 설명">
                  {{ state.notifcType.notifcTypeDesc }}
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 메시지 제한 길이">
                  {{ state.notifcType.notifcMsgRstrtnLen }}
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 메시지 템플릿">
                  <el-input class="mt10 mb10"
                    type="textarea"
                    v-model="state.notifcType.notifcMsgTmplt"
                    disabled
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 링크 템플릿 URL">
                  {{ state.notifcType.notifcLinkTmpltUrl }}
                </el-form-item>
              </el-col>
            </el-row>            
            <el-row>
              <el-col :span="12">
                <el-form-item label="등록정보">
                  {{ state.notifcType.notifcTypeRegInfo }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="수정정보">
                  {{ state.notifcType.notifcTypeAmdInfo }}
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
    </div>
    <div class="boxLayout">
      <div class="boxTit">
        <h3>알림 대상 목록</h3>
        <div class="btnSec taR">
          <el-button type="primary"
            v-show="isWriteYn(route.meta.auth)"            
            @click="handleClickTarget(true, null)"
            >알림 대상 추가</el-button
          >
        </div>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <ComnList
            :tableHeader="tableHeader"
            :tableData="state.notifcTargetList"
          >
            tableHeader
            <template v-slot:btnModify="slotData">
              <el-button type="primary" size="small"
                @click="() => handleClickTarget(false, slotData.$index)"
                >수정</el-button
              >
            </template>
          </ComnList>
        </div>
      </div>
    </div>
  </div>
  <el-dialog v-model="dialogTargetModify" title="알림 대상 편집">
    <div class="dialog-area">
      <div class="boxLayout">
        <div class="boxTit"><h3>알림 대상 정보</h3></div>
        <div class="boxCnt">
          <el-form label-position="right"
            ref="ruleFormRefTargetModify"
            :model="state.targetModifyInfo"
            :rules="state.targetRules"
            label-width="210px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 대상 ID" prop="notifcTgtId">
                  <el-input
                    style="width: 400px"
                    v-model="state.targetModifyInfo.notifcTgtId"
                    disabled
                  >
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 대상 유형" prop="notifcTgtTypeMtcd">
                  <el-select
                    v-model="state.targetModifyInfo.notifcTgtTypeMtcd"
                    placeholder="선택"
                    @change="changeNotifcTgtTypeMtcd(false)"
                  >
                    <el-option
                      v-for="item in notifcTgtTypeMtcdList"
                      :key="item.mtcd"
                      :label="item.mtcdNm"
                      :value="item.mtcd"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 대상 구분" prop="notifcTgtDivMtcd">
                  <el-select
                    v-model="state.targetModifyInfo.notifcTgtDivMtcd"
                    placeholder="선택"
                    @change="changeNotifcTgtDivMtcd(false)"
                    :disabled="isDisabledForNotifcTgtDiv"
                  >
                    <el-option
                      v-for="item in notifcTgtDivMtcdList"
                      :key="item.mtcd"
                      :label="item.mtcdNm"
                      :value="item.mtcd"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
      <div class="boxLayout">
        <div class="boxTit"><h3>알림 대상자</h3><span>※ 알림 대상 유형이 "요청자"인 경우, 프로그래밍한 해당 요청자에게 알림이 갑니다.</span></div>
        <div class="boxCnt">
          <div class="btnSec taR mb10">
            <el-button type="primary" plain
              v-show="isAmdYn(route.meta.auth) && !isDisabledForNotifcTgtDiv"              
              @click="handleClickUserSetting(false)"
              >전체 사용자 설정</el-button
            >
            <el-button type="primary" plain
              v-show="isDelYn(route.meta.auth) && !isDisabledForNotifcTgtDiv"
              @click="deleteTargetObj(false)"
              >대상자 삭제</el-button
            >
            <el-button type="primary" plain
              v-show="isWriteYn(route.meta.auth) && !isDisabledForNotifcTgtDiv"
              @click="handleClickTargetObject(false)"
              >대상자 추가</el-button
            >
          </div>
          <ComnList
            :tableHeader="tableHeaderTarget"
            :tableData="targetIdListModify"
            @selectionChange="selectTargetId"
            :min-height="240"
          >
          </ComnList>
        </div>
      </div>
      <div class="btnSec taR mt20">
        <el-button type="primary"
          v-show="isAmdYn(route.meta.auth)"          
          @click="handleClickSaveTarget(false)"
          >저장</el-button
        >
        <el-button type="primary" plain
          v-show="isDelYn(route.meta.auth)"          
          @click="deleteTarget()"
          >삭제</el-button
        >
        <el-button type="default" @click="closeDialogTarget(false)"
          >취소</el-button
        >
      </div>
    </div>
  </el-dialog>
  <el-dialog v-model="dialogTypeModify" title="알림 유형 편집">
    <div class="dialog-area">
      <div class="boxLayout">
        <div class="boxTit"><h3>알림 유형 정보</h3></div>
        <div class="boxCnt">
          <el-form label-position="right"
            ref="ruleFormRefType"
            :model="state.modifyInfo"
            :rules="state.rules"
            label-width="210px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 유형 ID">
                  <el-input v-model="state.modifyInfo.notifcTypeId" style="width: 250px"  disabled>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 유형 명" prop="notifcTypeNm">
                  <el-input v-model="state.modifyInfo.notifcTypeNm" style="width: 400px"> </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 사용 여부" prop="notifcUseYn">
                  <el-select
                    v-model="state.modifyInfo.notifcUseYn"
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
                  <el-input v-model="state.modifyInfo.notifcTypeDesc" style="width: 400px">
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
                    v-model="state.modifyInfo.notifcMsgRstrtnLen"
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
                    v-model="state.modifyInfo.notifcMsgTmplt"
                    style="width: 400px"
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
                  <el-input v-model="state.modifyInfo.notifcLinkTmpltUrl" style="width: 400px">
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="정렬 순서" prop="notifcTypeSortOdrg">
                  <el-input
                    v-model="state.modifyInfo.notifcTypeSortOdrg"
                    type="number"
                    maxlength="5"
                    style="width: 400px"
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
        <el-button type="primary"
          v-show="isAmdYn(route.meta.auth)"          
          @click="modifyType"
          >저장</el-button
        >
        <el-button type="primary" plain
          v-show="isDelYn(route.meta.auth)"          
          @click="deleteType"
          >삭제</el-button
        >
        <el-button type="default" @click="closeDialogType()"
          >취소</el-button
        >
      </div>
    </div>
  </el-dialog>
  <el-dialog v-model="dialogTargetEdit" title="알림 대상 등록">
    <div class="dialog-area">
      <div class="boxLayout">
        <div class="boxTit"><h3>알림 대상 정보</h3></div>
        <div class="boxCnt">
          <el-form label-position="right"
            ref="ruleFormRefTargetEdit"
            :model="state.targetEditInfo"
            :rules="state.targetRules"
            label-width="210px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 대상 유형" prop="notifcTgtTypeMtcd">
                  <el-select
                    v-model="state.targetEditInfo.notifcTgtTypeMtcd"
                    placeholder="선택"
                    @change="changeNotifcTgtTypeMtcd(true)"
                  >
                    <el-option
                      v-for="item in notifcTgtTypeMtcdList"
                      :key="item.mtcd"
                      :label="item.mtcdNm"
                      :value="item.mtcd"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="알림 대상 구분" prop="notifcTgtDivMtcd">
                  <el-select
                    v-model="state.targetEditInfo.notifcTgtDivMtcd"
                    placeholder="선택"
                    @change="changeNotifcTgtDivMtcd(true)"
                    :disabled="isDisabledForNotifcTgtDiv"
                  >
                    <el-option
                      v-for="item in notifcTgtDivMtcdList"
                      :key="item.mtcd"
                      :label="item.mtcdNm"
                      :value="item.mtcd"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
      <div class="boxLayout mt20">
        <div class="boxTit"><h3>알림 대상자</h3><span>※ 알림 대상 유형이 "요청자"인 경우, 프로그래밍한 해당 요청자에게 알림이 갑니다.</span></div>
        <div class="boxCnt">
          <div class="btnSec taR mb10">
            <el-button type="primary" plain
              v-show="isAmdYn(route.meta.auth) && !isDisabledForNotifcTgtDiv"              
              @click="handleClickUserSetting(true)"
              >전체 사용자 설정</el-button
            >
            <el-button type="primary" plain
              v-show="isDelYn(route.meta.auth) && !isDisabledForNotifcTgtDiv"
              @click="deleteTargetObj(true)"
              >대상자 삭제</el-button
            >
            <el-button type="primary" plain
              v-show="isWriteYn(route.meta.auth) && !isDisabledForNotifcTgtDiv"
              @click="handleClickTargetObject(true)"
              >대상자 추가</el-button
            >
          </div>
          <ComnList
            :tableHeader="tableHeaderTarget"
            :tableData="targetIdListEdit"
            @selectionChange="selectTargetId"
            :min-height="240"
          >
          </ComnList>
        </div>
      </div>
      <div class="btnSec taR mt20">
        <el-button type="primary"
          v-show="isAmdYn(route.meta.auth)"          
          @click="handleClickSaveTarget(true)"
          >저장</el-button
        >
        <el-button type="default" @click="closeDialogTarget(true)"
          >취소</el-button
        >
      </div>
    </div>
  </el-dialog>
  <el-dialog v-model="dialogAuthEdit" title="알림 대상 등록 (권한)">
    <AuthListPopup
      :authList="authList.list"
      :autName="authList.pageInfo.autName"
      :totalPage="authList.pageInfo.totalListSize"
      :curPage="authList.pageInfo.curPage"
      @searchAuthgroup="searchAuthgroup"
      @getAuthGroupList="getAuthGroupList"
      @pagemove="pageMoveAuthgroup"
      @addAuth="addAuth"
      @selectCheckbox="selectCheckbox"
      @closeDialogAuth="closeDialogAuth"
    />
  </el-dialog>
  <el-dialog v-model="dialogUserEdit" title="알림 대상 등록 (사용자)">
    <AuthgroupUserList
      :userList="userList"
      @cancelPopup="cancelPopup"
      @selectedUser="selectedUser"
      @searchUser="searchUser"
    />
  </el-dialog>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import AuthListPopup from "@/components/meta/notification/AuthListPopup.vue";
import AuthgroupUserList from "@/components/admin/authgroup/AuthgroupUserList.vue";

import { ref, reactive, onMounted, computed, watch, defineProps } from "vue";
import {
  getGlobalProperties,
  routerPush,
  getCookie,
  isWriteYn,
  isAmdYn,
  isDelYn,
  isReadYn,
} from "@/assets/js/common.js";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { getUser, getUsers } from "@/assets/js/auth.js";
import util from "util";

const route = useRoute();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const dialogTypeModify = ref(false);
const ruleFormRefType = ref(false);
const dialogTargetModify = ref(false);
const dialogTargetEdit = ref(false);
const ruleFormRefTargetModify = ref(false);
const ruleFormRefTargetEdit = ref(false);
const dialogAuthEdit = ref(false);
const isDisabledForNotifcTgtDiv = ref(false);

const state = reactive({
  notifcType: {
    notifcTypeId: "",
    notifcTypeNm: "",
    notifcUseYn: "",
    notifcTypeDesc: "",
    notifcMsgRstrtnLen: "",
    notifcMsgTmplt: "",
    notifcTypeRegrId: "",
    notifcTypeRegDt: "",
    notifcTypeRegInfo: "",
    notifcTypeAmdrId: "",
    notifcTypeAmdDt: "",
    notifcTypeAmdInfo: "",
    notifcTypeSortOdrg: 0,
  },
  modifyInfo: {
    notifcTypeId: "",
    notifcTypeNm: "",
    notifcUseYn: "",
    notifcTypeDesc: "",
    notifcMsgRstrtnLen: "",
    notifcMsgTmplt: "",
    notifcTypeRegrId: "",
    notifcTypeRegDt: "",
    notifcTypeRegInfo: "",
    notifcTypeAmdrId: "",
    notifcTypeAmdDt: "",
    notifcTypeAmdInfo: "",
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

  notifcTargetList: [],

  targetListPageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  },
  targetEditInfo: {
    notifcTgtId: "",
    notifcTypeId: "",
    notifcTgtrIds: "",
    notifcTgtrNms: "",
    notifcTgtTypeMtcd: "",
    notifcTgtDivMtcd: "",
    notifcTgtRegDt: "",
    notifcTgtAmdDt: "",
  },
  targetModifyInfo: {
    notifcTgtId: "",
    notifcTypeId: "",
    notifcTgtrIds: "",
    notifcTgtrNms: "",
    notifcTgtTypeMtcd: "",
    notifcTgtDivMtcd: "",
    notifcTgtRegDt: "",
    notifcTgtAmdDt: "",
  },
  targetRules: {
    notifcTgtTypeMtcd: [
      {
        required: true,
        message: "선택하세요.",
        trigger: "blur",
      },
    ],
    notifcTgtDivMtcd: [
      {
        required: true,
        message: "선택하세요.",
        trigger: "blur",
      },
    ],
  },
});

const tableHeader = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 50,
  },
  {
    prop: "notifcTgtTypeMtcdNm",
    label: "알림 대상 유형",
    width: 100,
  },
  {
    prop: "notifcTgtDivMtcdNm",
    label: "알림 대상 구분",
    width: 100,
  },
  {
    prop: "notifcTgtrNms",
    label: "대상자",
    width: 230,
  },
  {
    prop: "btnModify",
    label: "수정",
    width: 60,
    columnType: "custom",
  },
]);

const tableHeaderTarget = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 100,
  },
  {
    prop: "nm",
    label: "대상자",
    width: 100,
  },
  {
    prop: "deleteCheckBox",
    type: "selection",
    width: 40,
    align: "center",
  },
]);

const authList = ref({
  list: [],
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    grpAdminFlag: 0,
    autName: "",
  },
});

const getNotifcTypeDetail = () => {
  let notifcTypeId = route.query.notifcTypeId;
  $axios
    .get(
      util.format(
        $apiUrls.meta.portal.notification.getNotificationType,
        notifcTypeId
      )
    )
    .then((res) => {
      console.log(res.data); 
      state.notifcType = res.data;
      state.notifcType.notifcTypeRegInfo = state.notifcType.notifcTypeRegrId + " / " + state.notifcType.notifcTypeRegDt;
      state.notifcType.notifcTypeAmdInfo = state.notifcType.notifcTypeAmdrId + " / " + state.notifcType.notifcTypeAmdDt;      
    })
    .catch((err) => {
      console.log(err);
    });
};

const getNotifcTypeDetailForModify = () => {
  let notifcTypeId = route.query.notifcTypeId;
  $axios
    .get(
      util.format(
        $apiUrls.meta.portal.notification.getNotificationType,
        notifcTypeId
      )
    )
    .then((res) => {
      console.log(res.data); 
      state.modifyInfo = res.data;
      state.modifyInfo.notifcTypeRegInfo = state.notifcType.notifcTypeRegrId + " / " + state.notifcType.notifcTypeRegDt;
      state.modifyInfo.notifcTypeAmdInfo = state.notifcType.notifcTypeAmdrId + " / " + state.notifcType.notifcTypeAmdDt;      
    })
    .catch((err) => {
      console.log(err);
    });
};

const getNotifcTargetList = () => {
  let notifcTypeId = route.query.notifcTypeId;
  $axios
    .get($apiUrls.meta.portal.notification.getNotificationTargetList, {
      params: {
        notifcTypeId: notifcTypeId,
        isPaging: false,
      },
    })
    .then((res) => {
      console.log(res);
      state.targetListPageInfo = res.data.page;
      state.notifcTargetList = res.data.list.map((item, idx) => {
        item.rownum =
          state.targetListPageInfo.pageListSize *
            (state.targetListPageInfo.curPage - 1) +
          idx +
          1;
        return item;
      });
      fromTypeMtcdToName();
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleClickTypeModify = () => {
  getNotifcTypeDetailForModify();
  dialogTypeModify.value = true;
};

const modifyType = () => {
  let notifcTypeId = route.query.notifcTypeId;
  let ruleForm = ruleFormRefType.value;
  if (!ruleForm) return;
  const editForm = state.modifyInfo;

  ruleForm.validate((valid) => {
    if (!valid) {
      alert("입력 정보를 다시 한번 확인해주세요.");
      return;
    }
    $axios
      .put(
        util.format(
          $apiUrls.meta.portal.notification.modifyNotifcType,
          notifcTypeId
        ),
        editForm
      )
      .then(() => {
        alert("수정되었습니다.");
        getNotifcTypeDetail();
        getNotifcTargetList();
        dialogTypeModify.value = false;
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
          alert("알림 유형 수정에 실패하였습니다.");
        }
      });
  });
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "NotificationTypeListPage", query);
};

const deleteType = () => {
  let notifcTypeId = route.query.notifcTypeId;
  const deleteYn = confirm("삭제하시겠습니까?");
  if (!deleteYn) {
    return;
  }
  $axios
    .delete(
      util.format(
        $apiUrls.meta.portal.notification.deleteNotifcType,
        notifcTypeId
      )
    )
    .then(() => {
      alert("삭제되었습니다.");
      dialogTypeModify.value = false;
      goToList();
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
        alert("삭제에 실패하였습니다.");
      }
    });
};

const stringToArr = (idStrings, nmStrings) => {
  let result = [];
  let idArr = idStrings.split(",");
  let nmArr = nmStrings.split(",");
  for (let i = 0; i < idArr.length; ++i) {
    result.push({
      id: idArr[i],
      nm: nmArr[i],
      deleteCheckBox: false,
    });
  }
  return result;
};

const getNotifcTargetDetail = (notifcTgtId) => {
  $axios.get(
    util.format(
      $apiUrls.meta.portal.notification.getNotificationType,
      notifcTgtId
    )
  );
  $axios
    .get(
      util.format(
        $apiUrls.meta.portal.notification.getNotificationTarget,
        notifcTgtId
      )
    )
    .then((res) => {
      state.targetModifyInfo = res.data;

      let arr = res.data.notifcTgtrIds.split(",");
      targetIdPageInfoModify.value.totalListSize = arr.length;
      targetIdListModify.value = arr;

      let notifcTgtrIdArr = stringToArr(
        res.data.notifcTgtrIds,
        res.data.notifcTgtrNms
      );
      targetIdPageInfoModify.value.curPage = 1;
      targetIdPageInfoModify.value.totalListSize = notifcTgtrIdArr.length;
      targetIdListModify.value = notifcTgtrIdArr.map((item, idx) => {
        item.rownum =
          targetIdPageInfoModify.value.pageListSize *
            (targetIdPageInfoModify.value.curPage - 1) +
          idx +
          1;
        return item;
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleClickTarget = (editYn, index) => {
  if (editYn) {
    dialogTargetEdit.value = true;
  } else {
    let notifcTgtId = state.notifcTargetList[index].notifcTgtId;
    getNotifcTargetDetail(notifcTgtId);
    dialogTargetModify.value = true;
  }
};

const closeDialogTarget = (editModeYn) => {
  if (editModeYn) {
    dialogTargetEdit.value = false;
  } else {
    dialogTargetModify.value = false;
  }
};

const handleClickSaveTarget = (editYn) => {
  if (editYn) {
    editTarget();
  } else {
    modifyTarget();
  }
};

const initInfo = (editYn) => {
  if (editYn) {
    state.targetEditInfo = {
      notifcTgtId: "",
      notifcTypeId: "",
      notifcTgtrIds: "",
      notifcTgtrNms: "",
      notifcTgtTypeMtcd: "",
      notifcTgtDivMtcd: "",
      notifcTgtRegDt: "",
      notifcTgtAmdDt: "",
    };
  } else {
    state.targetModifyInfo = {
      notifcTgtId: "",
      notifcTypeId: "",
      notifcTgtrIds: "",
      notifcTgtrNms: "",
      notifcTgtTypeMtcd: "",
      notifcTgtDivMtcd: "",
      notifcTgtRegDt: "",
      notifcTgtAmdDt: "",
    };
  }
};

const aggregateTargetId = (editYn) => {
  if (editYn) {
    targetIdListEdit.value.sort((a, b) => a.id - b.id);
    let ids = targetIdListEdit.value.map((item) => item.id).join(",");
    let nms = targetIdListEdit.value.map((item) => item.nm).join(",");
    state.targetEditInfo.notifcTgtrIds = ids;
    state.targetEditInfo.notifcTgtrNms = nms;
  } else {
    targetIdListModify.value.sort((a, b) => a.id - b.id);
    let ids = targetIdListModify.value.map((item) => item.id).join(",");
    let nms = targetIdListModify.value.map((item) => item.nm).join(",");
    state.targetModifyInfo.notifcTgtrIds = ids;
    state.targetModifyInfo.notifcTgtrNms = nms;
  }
};

const editTarget = () => {
  let ruleForm = ruleFormRefTargetEdit.value;
  if (!ruleForm) {
    return;
  }
  aggregateTargetId(true);
  state.targetEditInfo.notifcTypeId = route.query.notifcTypeId;
  const editForm = state.targetEditInfo;

  ruleForm.validate((valid) => {
    if (!valid) {
      alert("입력 정보를 다시 한번 확인해주세요.");
      return;
    }
    if (!confirm("등록하시겠습니까?")) return;
    $axios
      .post(
        $apiUrls.meta.portal.notification.createNotificationTarget,
        editForm,
        {
          headers: { "Content-Type": "application/json" },
        }
      )
      .then((res) => {
        alert("등록되었습니다.");
        dialogTargetEdit.value = false;
        getNotifcTargetList();
        initInfo(true);
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
          alert("알림 대상 등록에 실패하였습니다.");
        }
      });
  });
};

const modifyTarget = () => {
  let ruleForm = ruleFormRefTargetModify.value;
  if (!ruleForm) return;
  if (targetIdListModify.value.length == 0) {
    alert("알림 대상자는 1건 이상이어야 합니다.");
    return;
  }
  aggregateTargetId(false);
  const notifcTgtId = state.targetModifyInfo.notifcTgtId;
  const editForm = state.targetModifyInfo;
  ruleForm.validate((valid) => {
    if (!valid) {
      alert("입력 정보를 다시 한번 확인해주세요.");
      return;
    }
    $axios
      .put(
        util.format(
          $apiUrls.meta.portal.notification.modifyNotificationTarget,
          notifcTgtId
        ),
        editForm
      )
      .then(() => {
        alert("수정되었습니다.");
        getNotifcTargetList();
        initInfo(false);
        dialogTargetModify.value = false;
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
          alert("알림 대상 수정에 실패하였습니다.");
        }
      });
  });
};

const deleteTarget = () => {
  if (
    !confirm(
      "이 알림에 대한 각 사용자의 설정 정보도 삭제됩니다. 삭제하시겠습니까?"
    )
  ) {
    return;
  }
  let notifcTgtId = state.targetModifyInfo.notifcTgtId;
  $axios
    .delete(
      util.format(
        $apiUrls.meta.portal.notification.deleteNotificationTarget,
        notifcTgtId
      )
    )
    .then(() => {
      alert("삭제되었습니다.");
      getNotifcTargetList();
      initInfo(false);
      dialogTargetModify.value = false;
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
        alert("삭제에 실패하였습니다.");
      }
    });
};

const targetIdListEdit = ref([]);
const targetIdListModify = ref([]);
const targetIdPageInfoEdit = ref({
  curPage: 1,
  totalListSize: 0,
  pageListSize: 10,
});
const targetIdPageInfoModify = ref({
  curPage: 1,
  totalListSize: 0,
  pageListSize: 10,
});

const deleteListEdit = ref([]);
const deleteListModify = ref([]);

const selectTargetId = (selectedRows) => {
  const editYn = dialogTargetEdit.value == true ? true : false;
  if (editYn) {    
    for (let row of selectedRows) {
      row.deleteCheckBox = true;
    }
    deleteListEdit.value = selectedRows;
  } else {
    for (let row of selectedRows) {
      row.deleteCheckBox = true;
    }
    deleteListModify.value = selectedRows;
  }
};

const resetRownum = (editYn) => {
  let rownum = 1;
  if (editYn) {
    for (let obj of targetIdListEdit.value) {
      obj.rownum = rownum++;
    }
    return;
  }
  for (let obj of targetIdListModify.value) {
    obj.rownum = rownum++;
  }
};

const deleteTargetObj = (editYn) => {
  if (editYn) {
    const chkCnt = targetIdListEdit.value.filter(x => x.deleteCheckBox == true).length;
    if (chkCnt === 0) {
      alert('삭제할 대상자를 선택해 주세요.');
      return;
    }

    for (let i = targetIdListEdit.value.length - 1; i >= 0; --i) {
      if (targetIdListEdit.value[i].deleteCheckBox == true) {
        targetIdListEdit.value.splice(i, 1);
      }
    }
    resetRownum(true);
    targetIdPageInfoEdit.value.totalListSize = targetIdListEdit.value.length;
  } else {
    const chkCnt = targetIdListModify.value.filter(x => x.deleteCheckBox == true).length;
    if (chkCnt === 0) {
      alert('삭제할 대상자를 선택해 주세요.');
      return;
    }

    for (let i = targetIdListModify.value.length - 1; i >= 0; --i) {
      if (targetIdListModify.value[i].deleteCheckBox == true) {
        targetIdListModify.value.splice(i, 1);
      }
    }
    resetRownum(false);
    targetIdPageInfoModify.value.totalListSize = targetIdListModify.value.length;
  }
};

const auth = ref("auth");
const user = ref("user");

const handleClickTargetObject = (editYn) => {
  if (
    (state.targetEditInfo.notifcTgtDivMtcd == "" && editYn) ||
    (state.targetModifyInfo.notifcTgtDivMtcd == "" && !editYn)
  ) {
    alert("알림 대상 구분을 선택하세요.");
    return;
  }
  if (
    state.targetEditInfo.notifcTgtDivMtcd == auth.value ||
    state.targetModifyInfo.notifcTgtDivMtcd == auth.value
  ) {
    getAuthgroupList();
    dialogAuthEdit.value = true;
    return;
  }
  dialogUserEdit.value = true;
};

const getCodeList = () =>
  store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00019", "MCG00020"],
    },
  });

const notifcTgtTypeMtcdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00019")
);

const notifcTgtDivMtcdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00020")
);

const getMetaCodeGroupList = () => {
  store.dispatch("MetaStore/getAllMetaCodeGroupList", {
    axios: $axios,
    apiUrls: $apiUrls,
  });
};

const getAuthgroupList = () => {
  $axios
    .get($apiUrls.admin.auth.getAuthList, {
      params: {
        curPage: authList.value.pageInfo.curPage,
        autName: authList.value.pageInfo.autName,
        useYn: "Y",
        pltfrmId: getCookie("pltfrmId"),
      },
    })
    .then((res) => {
      authList.value.pageInfo.totalListSize = res.data.page.totalListSize;
      authList.value.list = res.data.data.map((item, idx) => {
        item.rownum =
          authList.value.pageInfo.pageListSize *
            (authList.value.pageInfo.curPage - 1) +
          idx +
          1;
        return item;
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

const closeDialogAuth = () => {
  dialogAuthEdit.value = false;
};

const selectedAuthList = ref([]);

const selectCheckbox = (selectionRows) => {
  selectedAuthList.value = selectionRows;
};

onMounted(async () => {
  getCodeList();
  getMetaCodeGroupList();
  getNotifcTypeDetail();
  getNotifcTargetList();
  await getTotalUserList();
});

const pageMoveAuthgroup = (payload) => {
  authList.value.pageInfo.curPage = payload;
  getAuthgroupList();
};

const searchAuthgroup = (payload) => {
  authList.value.pageInfo.curPage = 1;
  authList.value.pageInfo.autName = payload.autName;
  getAuthgroupList();
};

const addAuth = () => {
  let editYn = dialogTargetEdit.value == true ? true : false;  
  if (editYn) {
    let idx = targetIdPageInfoEdit.value.totalListSize + 1;
    for (let auth of selectedAuthList.value) {
      if (!targetIdListEdit.value.some((item) => item.id === auth.autId)) {
        targetIdListEdit.value.push({
          id: auth.autId,
          nm: auth.autName,
          rownum: idx,
          deleteCheckBox: false,
        });
        ++idx;
      }
    }
    targetIdPageInfoEdit.value.totalListSize = targetIdListEdit.value.length;
    dialogAuthEdit.value = false;
  } else {

    let idx = targetIdPageInfoModify.value.totalListSize + 1;
    for (let auth of selectedAuthList.value) {
      if (!targetIdListModify.value.some((item) => item.id === auth.autId)) {
        targetIdListModify.value.push({
          id: auth.autId,
          nm: auth.autName,
          rownum: idx,
          deleteCheckBox: false,
        });
        ++idx;
      }
    }
    targetIdPageInfoModify.value.totalListSize = targetIdListModify.value.length;
    dialogAuthEdit.value = false;
  }
};

const closeDialogType = () => {
  dialogTypeModify.value = false;
};

const dialogUserEdit = ref(false);

const cancelPopup = () => {
  dialogUserEdit.value = false;
};

const userList = ref([]);
const originUser = ref("");
const savedUser = ref([]);

const getTotalUserList = async () => {
  userList.value = await getUsers();
  originUser.value = userList.value.slice();
};

const checkDuplicateUserList = (savedList, totalList) => {
  for (let data of savedList) {
    let findData = totalList.findIndex(function (e) {
      return e.userid == data.userid;
    });
    if (findData >= 0) {
      totalList.splice(findData, 1);
    }
  }
  return totalList;
};

const searchUser = (payload) => {
  let usrArr = [];
  for (let data of originUser.value) {
    if (data.userid.indexOf(payload.data) != -1) {
      usrArr.push(data);
    }
  }
  userList.value = checkDuplicateUserList(savedUser.value, usrArr);
  return userList.value;
};

const selectedUser = (selectedUsers) => {
  const editYn = dialogTargetEdit.value === true ? true : false;

  if (editYn) {  
    let idx = targetIdPageInfoEdit.value.totalListSize + 1;
    for (let user of selectedUsers.data) {
      if (!targetIdListEdit.value.some((item) => item.id === user.userid)) {
        targetIdListEdit.value.push({
          id: user.userid,
          nm: user.name,
          rownum: idx,
          deleteCheckBox: false,
        });
        ++idx;
      }
    }
    targetIdPageInfoEdit.value.totalListSize = targetIdListEdit.value.length;
    dialogUserEdit.value = false;
  } else {
    let idx = targetIdPageInfoModify.value.totalListSize + 1;
    for (let user of selectedUsers.data) {
      if (!targetIdListModify.value.some((item) => item.id === user.userid)) {
        targetIdListModify.value.push({
          id: user.userid,
          nm: user.name,
          rownum: idx,
          deleteCheckBox: false,
        });
        ++idx;
      }
    }
    targetIdPageInfoModify.value.totalListSize = targetIdListModify.value.length;
    dialogUserEdit.value = false;
  }
};

const changeNotifcTgtTypeMtcd = (editYn) => {
  if (editYn) {
    if(state.targetEditInfo.notifcTgtTypeMtcd === "rqtr") {
      state.targetEditInfo.notifcTgtDivMtcd === "auth";
      handleClickUserSetting(editYn);
      isDisabledForNotifcTgtDiv.value = true;
    }
    else {
      state.targetEditInfo.notifcTgtDivMtcd === "";
      targetIdListEdit.value = [];
      targetIdPageInfoEdit.value = {
        curPage: 1,
        totalListSize: 0,
        pageListSize: 10,
      };
      isDisabledForNotifcTgtDiv.value = false;
    }
  } 
  else {
    if(state.targetModifyInfo.notifcTgtTypeMtcd === "rqtr") {
      state.targetModifyInfo.notifcTgtDivMtcd === "auth";
      handleClickUserSetting(editYn);
      isDisabledForNotifcTgtDiv.value = true;
    }
    else {
      state.targetModifyInfo.notifcTgtDivMtcd === "";
      targetIdListEdit.value = [];
      targetIdPageInfoEdit.value = {
        curPage: 1,
        totalListSize: 0,
        pageListSize: 10,
      };
      isDisabledForNotifcTgtDiv.value = false;
    }
  }
};

const changeNotifcTgtDivMtcd = (editYn) => {
  if (editYn) {
    targetIdListEdit.value = [];
    targetIdPageInfoEdit.value = {
      curPage: 1,
      totalListSize: 0,
      pageListSize: 10,
    };
  } else {
    targetIdListModify.value = [];
    targetIdPageInfoModify.value = {
      curPage: 1,
      totalListSize: 0,
      pageListSize: 10,
    };
  }
};

const TOTAL_USER_SETTING_ID = "AUT_META_DEFAULT";
const TOTAL_USER_SETTING_NAME = "메타데이터 기본사용자";

const handleClickUserSetting = (editYn) => {
  if (editYn) {
    state.targetEditInfo.notifcTgtDivMtcd = "auth";
    targetIdListEdit.value = [];
    targetIdListEdit.value.push({
      id: TOTAL_USER_SETTING_ID,
      nm: TOTAL_USER_SETTING_NAME,
      rownum: 1,
      deleteCheckBox: false,
    });
    targetIdPageInfoEdit.value = {
      curPage: 1,
      totalListSize: 1,
      pageListSize: 10,
    };
  } else {
    state.targetModifyInfo.notifcTgtDivMtcd = "auth";
    targetIdListModify.value = [];
    targetIdListModify.value.push({
      id: TOTAL_USER_SETTING_ID,
      nm: TOTAL_USER_SETTING_NAME,
      rownum: 1,
      deleteCheckBox: false,
    });
    targetIdPageInfoModify.value = {
      curPage: 1,
      totalListSize: 1,
      pageListSize: 10,
    };
  }
};

const fromTypeMtcdToName = () => {
  state.notifcTargetList.forEach((target) => {
    const matchingMtcd = notifcTgtTypeMtcdList.value.find(
      (mtcd) => mtcd.mtcd === target.notifcTgtTypeMtcd
    );
    if (matchingMtcd) {
      target.notifcTgtTypeMtcdNm = matchingMtcd.mtcdNm;
    }
  });
  state.notifcTargetList.forEach((target) => {
    const matchingMtcd = notifcTgtDivMtcdList.value.find(
      (mtcd) => mtcd.mtcd === target.notifcTgtDivMtcd
    );
    if (matchingMtcd) {
      target.notifcTgtDivMtcdNm = matchingMtcd.mtcdNm;
    }
  });
};
</script>
  <style lang="scss"></style>