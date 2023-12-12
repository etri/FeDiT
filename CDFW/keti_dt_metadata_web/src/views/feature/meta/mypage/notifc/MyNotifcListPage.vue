<template>
  <div class="cntSec">
    <div class="btnSec taR">
      <el-button type="primary" @click="() => handleClickNorifcSetting()"
        >내 알림 설정</el-button
      >
    </div>
    <div class="boxLayout">
      <div class="tab">
        <el-tabs
          type="card"
          class="demo-tabs" style="height: auto;"
          v-model="activeTab"
          @tab-click="clickTab"
        >
          <el-tab-pane label="알림" name="N">
            <div class="boxLayout">
              <div class="boxTit">
                <h3>알림 목록</h3>
                <div class="btnSec taR">
                  <el-button type="primary" @click="() => clickConfirmAll()"
                    >전체 확인</el-button
                  >
                </div>
              </div>
              <div class="boxCnt">
                <div class="listTable">
                  <el-row>
                    <el-col :span="24">
                      <ul>
                        <li
                          class="list-row"
                          v-for="item in state.unconfirmedList"
                          :key="item"
                        >
                          <div class="list-col">
                            <div
                              v-if="item.notifcLinkUrl"
                              class="list-title link-text"
                              @click="clickConfirm(item)"
                            >
                              <span v-html="item.notifcMsg"></span>
                            </div>
                            <div
                              v-else="item.notifcLinkUrl"
                              class="list-title inline-area"
                            >
                              <div><span v-html="item.notifcMsg"></span></div>
                              <div class="ml15">
                                <el-button type="default" @click="clickConfirm(item)">확인</el-button>
                              </div>
                            </div>
                            <ul class="list-info">
                              <li class="dt">등록</li>
                              <li class="dd">{{ item.notifcRegDt }}</li>
                            </ul>
                          </div>
                        </li>
                      </ul>
                    </el-col>
                  </el-row>
                  <el-row v-show="state.unconfirmedList.length == 0">
                    <el-col :span="24">
                      <ul>
                        <li class="list-row-empty">데이터 없음</li>
                      </ul>
                    </el-col>
                  </el-row>
                  <ComnPagination
                    :totalPage="state.unconfirmedPageInfo.totalListSize"
                    :curPage="state.unconfirmedPageInfo.curPage"
                    :pageSize="state.unconfirmedPageInfo.pageListSize"
                    @pagemove="pageMove1"
                  />
                </div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="확인한 알림" name="Y">
            <div class="boxLayout">
              <div class="boxTit">
                <h3>알림 검색</h3>
                <div class="btnSec taR">
                  <el-button type="primary" @click="searchInfo()">검색</el-button>
                  <el-button type="default" @click="resetSearchForm()">초기화</el-button>
                </div>                
              </div>

              <div class="boxCnt">
                <el-form label-position="left"
                  :inline="true"
                  :model="state.confirmedPageInfo"
                  class="demo-form-inline search-form"
                  label-width="120px"
                >
                  <el-row>
                    <el-col :span="12">
                      <el-form-item label="알림 메시지">
                        <el-col>
                          <el-input
                            v-model="state.confirmedPageInfo.srchNotifcMsg"
                            placeholder="알림 메시지를 입력하세요"
                            @keyup.enter="($event) => searchInfo()"
                          />
                        </el-col>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="정렬순서">
                        <el-col>
                          <div class="inline-area">
                            <el-select
                              class="mr10"
                              v-model="state.confirmedPageInfo.sortField"
                            >
                              <el-option
                                label="등록일시순"
                                value="notifcRegDt"
                              />
                            </el-select>
                            <el-select
                              v-model="state.confirmedPageInfo.sortOrder"
                            >
                              <el-option label="오름차순" value="ascending" />
                              <el-option label="내림차순" value="descending" />
                            </el-select>
                          </div>
                        </el-col>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>

              </div>
            </div>
            <div class="boxLayout">
              <div class="boxTit">
                <h3>알림 목록</h3>
              </div>
              <div class="boxCnt">
                <div class="listTable">
                  <el-row>
                    <el-col :span="24">
                      <ul>
                        <li
                          class="list-row"
                          v-for="item in state.confirmedList"
                          :key="item"
                        >
                          <div class="list-col">
                            <div
                              v-if="item.notifcLinkUrl"
                              class="list-title link-text"
                              @click="goToLinkPage(item.notifcLinkUrl)"
                            >
                              <span v-html="item.notifcMsg"></span>
                            </div>
                            <div v-else="item.notifcLinkUrl" class="list-title">
                              <span v-html="item.notifcMsg"></span>
                            </div>
                            <ul class="list-info">
                              <li class="dt">등록</li>
                              <li class="dd">{{ item.notifcRegDt }}</li>
                              <li class="dt">확인</li>
                              <li class="dd">{{ item.notifcConfDt }}</li>
                            </ul>
                          </div>
                        </li>
                      </ul>
                    </el-col>
                  </el-row>
                  <el-row v-show="state.confirmedList.length == 0">
                    <el-col :span="24">
                      <ul>
                        <li class="list-row-empty">데이터 없음</li>
                      </ul>
                    </el-col>
                  </el-row>
                  <ComnPagination
                    :totalPage="state.confirmedPageInfo.totalListSize"
                    :curPage="state.confirmedPageInfo.curPage"
                    :pageSize="state.confirmedPageInfo.pageListSize"
                    @pagemove="pageMove2"
                  />
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
  <el-dialog v-model="dialogNotifcSetting" title="내 알림 설정">
    <div class="dialog-area">
      <div class="boxLayout">
        <div class="boxTit">
          <h3>{{ user.id }}({{ user.name }}) 님의 알림 설정</h3>
        </div>
        <div class="boxCnt">
          <div class="ly-table">
            <ComnList
              :tableHeader="tableHeaderSetting"
              :tableData="notifcSettingList"
            >
              <template v-slot:notifcRcvYn="slotData">
                <div class="mb-2 flex items-center text-sm">
                  <el-switch 
                      v-model="slotData.row.notifcRcvYn" 
                      inline-prompt
                      active-text="Y"
                      active-value="Y"
                      inactive-text="N"
                      inactive-value="N"
                      class="ml-2"
                      @change="handleClickSwitchBtn(slotData.$index)"
                      style="--el-switch-on-color: var(--el-color-primary); --el-switch-off-color: #777777"
                    />
              
                </div>
              </template>
              <template v-slot:notifcPopupYn="slotData">
                <div class="mb-2 flex items-center text-sm">
                  <el-switch 
                    v-model="slotData.row.notifcPopupYn" 
                    inline-prompt
                    active-text="Y"
                    active-value="Y"
                    inactive-text="N"
                    inactive-value="N"
                    class="ml-2"
                    @change="handleClickSwitchBtn(slotData.$index)"
                    style="--el-switch-on-color: var(--el-color-primary); --el-switch-off-color: #777777"
                  />
                </div>
              </template>
            </ComnList>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>
<script setup>
import {
  onMounted,
  reactive,
  ref,
  getCurrentInstance,
  watch,
  nextTick,
} from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { getUser } from "@/assets/js/auth.js";
import util from "util";
import {
  getCookie,
  routerPush,
  getGlobalProperties,
  isWriteYn,
} from "@/assets/js/common.js";
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

const $apiUrls = getGlobalProperties().$apiUrls;
const $axios = getGlobalProperties().$axios;
const $emitter =
  getCurrentInstance().appContext.config.globalProperties.$emitter;

const router = useRouter();
const user = getUser();

onMounted(() => {
  getUnconfirmedList();
});

const rcvYnList = [{ value: "Y" }, { value: "N" }];
const popupYnList = [{ value: "Y" }, { value: "N" }];
const dialogNotifcSetting = ref(false);
const notifcSettingList = ref([]);

const tableHeaderSetting = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 50,
  },
  {
    prop: "notifcTypeNm",
    label: "알림 유형",
    width: 230,
  },
  {
    prop: "notifcTgtTypeMtcdNmStr",
    label: "알림 대상 유형",
    width: 130,
  },
  {
    prop: "notifcRcvYn",
    label: "알림 수신 여부",
    width: 150,
    columnType: "custom",
  },
  {
    prop: "notifcPopupYn",
    label: "알림 팝업 여부",
    width: 150,
    columnType: "custom",
  },
]);

const getMyNotifcSettingList = () => {
  $axios
    .get($apiUrls.meta.portal.mypage.getMyNotifcSettingList, {
      params: {
        isPaging: false,
      },
    })
    .then((res) => {
      // console.log(res);
      let rownum = 1;
      notifcSettingList.value = res.data.list.map((item) => {
        item.rownum = rownum++;
        return item;
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleClickNorifcSetting = () => {
  dialogNotifcSetting.value = true;
  getMyNotifcSettingList();
};

const handleClickSwitchBtn = (index) => {
  if(index == -1){
    return;
  }
  let existYn =
    notifcSettingList.value[index].notifcSetupId != "" &&
    notifcSettingList.value[index].notifcSetupId != null
      ? true
      : false;
  if (existYn) {
    updateSetting(index);
  } else {
    editSetting(index);
  }
};

const editSetting = (index) => {
  let editForm = notifcSettingList.value[index];
  $axios
    .post($apiUrls.meta.portal.mypage.createNotificationSetting, editForm, {
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => {
      alert("변경되었습니다.");
      notifcSettingList.value[index].notifcSetupId = res.data.id;
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
        alert("알림 설정 수정에 실패하였습니다.");
      }
    });
};

const updateSetting = (index) => {
  let editForm = notifcSettingList.value[index];
  let notifcSetupId = notifcSettingList.value[index].notifcSetupId;
  $axios
    .put(
      util.format(
        $apiUrls.meta.portal.mypage.modifyNotificationSetting,
        notifcSetupId
      ),
      editForm
    )
    .then((res) => {
      alert("변경되었습니다.");
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
        alert("알림 설정 수정에 실패하였습니다.");
      }
    });
};

/** 확인/ 미확인 */
const state = reactive({
  unconfirmedList: [],
  unconfirmedPageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 5,
  },
  confirmedList: [],
  confirmedPageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 5,
    srchNotifcMsg: "",
    sortField: "notifcRegDt",
    sortOrder: "descending",
  },
});

const activeTab = ref("N");
const clickTab = (tabs) => {
  let tabName = tabs.props.name;
  if (tabName == "N") {
    getUnconfirmedList();
  } else {
    getConfirmedList();
  }
};

const getUnconfirmedList = () => {
  $axios
    .get($apiUrls.meta.portal.mypage.getMyNotifcList, {
      params: state.unconfirmedPageInfo,
    })
    .then((res) => {
      state.unconfirmedList = res.data.list.map((x) => {
        x.notifcMsg = x.notifcMsg.replaceAll("\n", "<br>");
        return x;
      });
      state.unconfirmedPageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getConfirmedList = () => {
  $axios
    .get($apiUrls.meta.portal.mypage.getMyNotifcConfirmedList, {
      params: state.confirmedPageInfo,
    })
    .then((res) => {
      state.confirmedList = res.data.list.map((x) => {
        x.notifcMsg = x.notifcMsg.replaceAll("\n", "<br>");
        return x;
      });
      state.confirmedPageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const pageMove1 = (curPage) => {
  state.unconfirmedPageInfo.curPage = curPage;
  getUnconfirmedList();
};

const pageMove2 = (curPage) => {
  state.confirmedPageInfo.curPage = curPage;
  getConfirmedList();
};

const clickConfirm = (item) => {
  const notifcId = item.notifcId;
  const notifcIdList = [notifcId];
  saveMyConfirmedNotifc(notifcIdList, item.notifcLinkUrl);
};

const clickConfirmAll = () => {
  if (state.unconfirmedList.length == 0) {
    alert("확인할 알림이 없습니다.");
    return;
  }
  const notifcIdList = state.unconfirmedList.map((x) => x.notifcId);
  saveMyConfirmedNotifc(notifcIdList);
};

const saveMyConfirmedNotifc = (notifcIdList, linkUrl) => {
  if (!notifcIdList || notifcIdList.length == 0) return;

  $axios
    .put($apiUrls.meta.portal.mypage.getMyNotifcConfirmedList, notifcIdList)
    .then(() => {
      // 알림 아이콘 변경
      $emitter.emit("Alarm.onNotifcChanged");

      if (linkUrl) {
        goToLinkPage(linkUrl);
      } else {
        getUnconfirmedList();
      }
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
        alert("확인에 실패하였습니다.");
      }
    });
};

const goToLinkPage = (linkUrl) => {
  if (linkUrl) router.push(linkUrl);
};

const searchInfo = () => {
  state.confirmedPageInfo.curPage = 1;
  getConfirmedList();
};

const resetSearchForm = () => {
  state.confirmedPageInfo = {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 5,
    srchNotifcMsg: "",
    sortField: "notifcRegDt",
    sortOrder: "descending",
  };
  getConfirmedList();
};
</script>
<style lang="scss"></style>