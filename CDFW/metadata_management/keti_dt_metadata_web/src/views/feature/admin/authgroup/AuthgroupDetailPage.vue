<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>권한 정보</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <AuthgroupDetail :authgroup="state.authgroup" />
        </div>
      </div>
    </div>

    <div class="boxLayout">
      <AuthgroupPermissionSettings
        :savedUser="state.savedUser"
        :userList="state.userList"
        :curPage="curPage"
        @selectedUser="selectedUser"
        @saveUserData="saveUserData"
        @removeSelectedUser="removeSelectedUser"
      />
    </div>

    <div class="boxLayout">
      <div class="boxTit">
        <h3>권한 설정(메뉴 권한)</h3>
      </div>
      <div class="boxCnt">
        <AuthgroupMenuList
          :curPage="curPage"
          @saveAuthMenuList="saveAuthMenuList"
        />
      </div>
    </div>

    <div class="boxLayout">
      <AuthgroupApiList
        :savedApiList="state.savedApiList"
        :totalApiList="state.totalApiList"
        :curPage="curPage"
        @selectedApi="selectedApi"
        @saveApiData="saveApiData"
        @removeSelectedApi="removeSelectedApi"
        @searchApi="searchApi"
        @resetSearchApi="resetSearchApi"
      />
    </div>
  </div>
</template>
<script setup>
import AuthgroupDetail from "@/components/admin/authgroup/AuthgroupDetail.vue";
import AuthgroupMenuList from "@/components/admin/authgroup/AuthgroupMenuList.vue";
import AuthgroupPermissionSettings from "@/components/admin/authgroup/AuthgroupPermissionSettings.vue";
import AuthgroupApiList from "@/components/admin/authgroup/AuthgroupApiList.vue";


import { reactive, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties, getCookie } from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const curPage = ref("detail");
const state = reactive({
  authgroup: {},
  savedUser: [],
  userList: [],
  originUser: [],
  menuList: [],
  totalUser: [],
  userIndexList: [],
  savedApiList: [],
  totalApiList: [],
  originApiList: [],
});

onMounted(async () => {
  await getAuthUserList();
  await getAuthDetail();
  await getAuthMenuList();
  await getTotalApiList();
});

//-----------auth--------------//
//auth detail 조회
const getAuthDetail = async () => {
  let autOid = route.query.autOid;

  await $axios
    .get(util.format($apiUrls.admin.auth.getAuthDetail, autOid))
    .then((res) => {
      state.authgroup = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

//-----------user--------------//

//해당 auth가 관리하는 user 정보 조회
const getAuthUserList = async () => {
  let autOid = route.query.autOid;
  await $axios
    .get(util.format($apiUrls.admin.auth.getAuthUserList, autOid))
    .then((res) => {
      state.savedUser = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};


const selectedUser = (payload) => {};

//user 신규 저장 (기존 데이터 삭제 후 저장)
const saveUserData = () => {};

const deleteBeforeAuthUsers = (autOid) => {};

const setAuthUsers = (autOid, authUser) => {};

//선택된 user 삭제 (DB 삭제 x)
const removeSelectedUser = (payload) => {};

//-----------menu--------------//
const getAuthMenuList = async () => {
  let autOid = route.query.autOid;
  await $axios
    .get(util.format($apiUrls.admin.auth.getAuthMenuList, autOid), {
      params: {
        autOid: autOid,
        searchType: "tree",
        pltfrmId: state.authgroup.pltfrmId,
        typeCd: state.authgroup.typeCd,
      },
    })
    .then((res) => {
      state.menuList = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

//이전 auth 관련 menu 삭제 후 현제 데이터 저장
const saveAuthMenuList = (payload) => {};

const deleteBeforeAuthMenuData = (autOid, authMenuList) => {};

//-----------API--------------//
//전체 api list
const getTotalApiList = async () => {
  await $axios
    .get($apiUrls.admin.api.getApigroupList, {
      params: {
        isPaging: false,
        pltfrmId: state.authgroup.pltfrmId,
      }
    })
    .then((res) => {
      state.originApiList = res.data.slice();
      state.totalApiList = res.data;
      getSavedApiList();
    })
    .catch((err) => {
      console.log(err);
    });
};
//해당 권한에서 저장된 api list
const getSavedApiList = () => {
  let autOid = route.query.autOid;
  
  let api = { 
    autOid : route.query.autOid,
    pltfrmId : state.authgroup.pltfrmId
  }
  $axios
    .get(util.format($apiUrls.admin.auth.getAuthApiList, autOid),api)
    .then((res) => {
      state.savedApiList = res.data;
      checkDuplicateApiList(state.savedApiList, state.totalApiList);
    })
    .catch((err) => {
      console.log(err);
    });
};

const saveApiData = (payload) => {};

//api 리스트 전체 삭제
const deleteApiList = (autOid, apiArr) => {};

//api 리스트 전체 저장
const setApiList = (autOid, apiArr) => {};

//total list - auth api list => dialog에 input
const selectedApi = (payload) => {};

const checkDuplicateApiList = (savedList, totalList) => {};

//선택된 api 삭제 (DB 삭제 x)
const removeSelectedApi = (payload) => {};

//api 이름 검색
const searchApi = (payload) => {};

//api 검색창 리셋 버튼
const resetSearchApi = () => {};
</script>
<style lang="scss"></style>
