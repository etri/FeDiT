<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>권한그룹 수정</h3>
      </div>
      <div class="boxCnt">
        <AuthgroupModify
          @modifyAuthgroup="modifyAuthgroup"
          @deleteAuthgroup="deleteAuthgroup"
        />
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
        @searchUser="searchUser"
        @resetSearchUser="resetSearchUser"
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
import AuthgroupModify from "@/components/admin/authgroup/AuthgroupModify.vue";
import AuthgroupMenuList from "@/components/admin/authgroup/AuthgroupMenuList.vue";
import AuthgroupPermissionSettings from "@/components/admin/authgroup/AuthgroupPermissionSettings.vue";
import AuthgroupApiList from "@/components/admin/authgroup/AuthgroupApiList.vue";
import { getUsers } from "@/assets/js/auth.js";

import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  routerPush,
  getCookie,
} from "@/assets/js/common.js";
import { reactive, ref, onMounted } from "vue";

import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const curPage = ref("modify");
const state = reactive({
  authgroup: {},
  savedUser: [],
  userList: [],
  originUser: [],
  totalUser: [],
  userIndexList: [],
  savedApiList: [],
  totalApiList: [],
  originApiList: [],
});

onMounted(async() => {
  await getAuthDetail();
  await getTotalUserList();
  await getAuthUserList();
  await getTotalApiList();
});

//-------------------auth----------------//
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

//auth 수정
const modifyAuthgroup = async (payload) => {
  let ruleForm = payload.ruleFormRef.value;
  if (!ruleForm) return;
  await ruleForm.validate((valid, fields) => {
    if (valid) {
      let result = confirm("수정 하시겠습니까?");
      if (result) {
        let autOid = route.query.autOid;
        let authgroup = payload.data;

        let authInfo = {
          ...authgroup,
          typeCd: authgroup.typeCd == true ? "COD_00001" : "COD_00002",
          useYn: authgroup.useYn == true ? "Y" : "N",
        };

        $axios
          .put(
            util.format($apiUrls.admin.auth.modifyAuthDetail, autOid),
            authInfo
          )
          .then(() => {
            alert("수정이 완료되었습니다.");
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

//auth 관련 전체 삭제 (auth detail, user, menu)
const deleteAuthgroup = async () => {
  let result = confirm("전체 데이터가 삭제 됩니다. 삭제 하시겠습니까?");
  if (result) {
    let autOid = route.query.autOid;
    $axios
      .delete(util.format($apiUrls.admin.auth.deleteAuthData, autOid))
      .then(() => {
        alert("삭제가 완료되었습니다.");
        let platform = getCookie("pltfrmId");
        let query = null;
        routerPush(platform, "AuthgroupListPage", query);
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

//-------------------user----------------//
//total user list 조회
const getTotalUserList = async () => {
  state.userList = await getUsers();
  state.originUser = JSON.parse(JSON.stringify(state.userList));
};

//해당 auth가 관리하는 user 정보 조회
const getAuthUserList = async () => {
  let autOid = route.query.autOid;
  await $axios
    .get(util.format($apiUrls.admin.auth.getAuthUserList, autOid))
    .then((res) => {
      state.savedUser = res.data;
      state.userList = checkDuplicateUserList(state.savedUser, state.originUser);
    })
    .catch((err) => {
      console.log(err);
    });
};

//userList (total 값) 에서 savedUser에 대한 정보가 있는지 확인 후 있다면 userList에서 제거
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

const selectedUser = (payload) => {
  for (let i of payload.data) {
    state.savedUser.push(i);
  }
  checkDuplicateUserList(state.savedUser, state.userList);
};

//user 신규 저장 (기존 데이터 삭제 후 저장)
const saveUserData = () => {
  let autOid = route.query.autOid;
  let result = confirm("등록 하시겠습니까?");
  if (result) {
    replaceAuthUsers(autOid, state.savedUser);
  }
};

const deleteBeforeAuthUsers = async (autOid, userList) => {
  await $axios
    .delete(util.format($apiUrls.admin.auth.deleteAuthUsers, autOid))
    .then(() => {
      setAuthUsers(autOid, userList);
    })
    .catch((err) => {
      console.log(err);
    });
};

const setAuthUsers = (autOid, userList) => {
  $axios
    .post(util.format($apiUrls.admin.auth.setAuthUsers, autOid), userList)
    .then(() => {
      alert("등록이 완료되었습니다.");

      state.savedUser = userList;
      state.userList = checkDuplicateUserList(
        state.savedUser,
        state.originUser
      );
    })
    .catch((err) => {
      console.log(err);
    });
};

const replaceAuthUsers = (autOid, userList) => {
  $axios
    .post(util.format($apiUrls.admin.auth.replaceAuthUsers, autOid), userList)
    .then(() => {
      alert("등록이 완료되었습니다.");

      state.savedUser = userList;
      state.userList = checkDuplicateUserList(
        state.savedUser,
        state.originUser
      );
    })
    .catch((err) => {
      console.log(err);
    });
};

//선택된 user 삭제 (DB 삭제 x)
const removeSelectedUser = (payload) => {
  const selectedArr = payload.value;

  //삭제된 arr가 몇번째 인덱스에 있는지 확인 : userList에 index번째에 추가
  //저장된 arr가 몇번째 인덱스에 있는지 확인 : savedUser에 index번째 삭제
  for (const data of selectedArr) {
    const findOriginIndex = state.originUser.findIndex(
      (user) => user.userid === data.userid
    );
    const findSavedIndex = state.savedUser.findIndex(
      (user) => user.userid === data.userid
    );

    if (findSavedIndex >= 0) {
      state.savedUser.splice(findSavedIndex, 1);
    }

    if (findOriginIndex >= 0) {
      if (state.userList.length > 0) {
        state.userList.splice(findOriginIndex, 0, data);
      } else state.userList.push(data);
    }
  }
};

const searchUser = (payload) => {
  let usrArr = [];
  for (let data of state.originUser) {
    if (data.userid.indexOf(payload.data) != -1) {
      usrArr.push(data);
    }
  }
  state.userList = checkDuplicateUserList(state.savedUser, usrArr);

  return state.userList;
};

const resetSearchUser = () => {
  state.userList = checkDuplicateUserList(state.savedUser, state.originUser);
};

//-----------menu--------------//

//이전 auth 관련 menu 삭제 후 현제 데이터 저장
const saveAuthMenuList = (payload) => {
  let autOid = route.query.autOid;
  let authMenuList = payload.authMenuList;
  let result = confirm("등록 하시겠습니까?");
  if (result) {
    deleteBeforeAuthMenuData(autOid, authMenuList);
  }
};

const deleteBeforeAuthMenuData = (autOid, authMenuList) => {
  $axios
    .delete(util.format($apiUrls.admin.auth.deleteAuthMenuList, autOid))
    .then(() => {
      $axios
        .post(util.format($apiUrls.admin.auth.setAuthMenus, autOid), authMenuList)
        .then((res) => {
          alert("저장되었습니다.");
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

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
      state.originApiList = JSON.parse(JSON.stringify(res.data));
      state.totalApiList = JSON.parse(JSON.stringify(res.data));
      getSavedApiList();
    })
    .catch((err) => {
      console.log(err);
    });
};
//해당 권한에서 저장된 api list
const getSavedApiList = () => {
  let autOid = route.query.autOid;

  $axios
    .get(util.format($apiUrls.admin.auth.getAuthApiList, autOid),{
      params: {
        autOid : route.query.autOid,
        pltfrmId : state.authgroup.pltfrmId
      }
    })
    .then((res) => {
      state.savedApiList = res.data;
      state.totalApiList = checkDuplicateApiList(state.savedApiList, state.originApiList);
    })
    .catch((err) => {
      console.log(err);
    });
};

const saveApiData = async (payload) => {
  let autOid = route.query.autOid;

  if (payload.data.length == 0 && state.savedApiList != payload.data){
    let result = confirm("체크된 버튼이 없습니다.\n데이터 전체삭제를 하시겠습니까?");
    if (result) {
      await deleteApiList(autOid);
      state.totalApiList = JSON.parse(JSON.stringify(state.originApiList));
    } else return;
  } else {
    let result = confirm("등록 하시겠습니까?");
    if (result) {
      await deleteApiList(autOid);
      await setApiList(autOid, payload.data);
    }
  }

  
};

//api 리스트 전체 삭제
const deleteApiList = async (autOid) => {
  await $axios
    .delete(util.format($apiUrls.admin.auth.deleteAuthApiList, autOid))
    .then(() => {
      state.savedApiList = [];
    })
    .catch((err) => {
      console.log(err);
    });
};

//api 리스트 전체 저장
const setApiList = async (autOid, apiArr) => {
  await $axios
    .post(util.format($apiUrls.admin.auth.setAuthApiList, autOid), apiArr)
    .then(() => {
      alert("등록이 완료되었습니다.");
      state.savedApiList = apiArr;
      state.totalApiList = state.originApiList.filter((originApi) => {
        return !state.savedApiList.some((savedApi) => savedApi.grpOid === originApi.grpOid);
      });

    })
    .catch((err) => {
      console.log(err);
    });
};

//total list - auth api list => dialog에 input
const selectedApi = (payload) => {
  for (let i of payload.data) {
    state.savedApiList.push(i);
  }
  state.totalApiList = checkDuplicateApiList(
    state.savedApiList,
    state.totalApiList
  );
};

const checkDuplicateApiList = (savedList, totalList) => {
  const clonedTotalList = JSON.parse(JSON.stringify(totalList)); // totalList를 깊은 복사

  for (let data of savedList) {
    // 저장된 리스트
    let findData = clonedTotalList.findIndex(function (e) {
      // 토탈 리스트의 복사본을 사용
      return e.grpOid == data.grpOid;
    });
    if (findData >= 0) {
      clonedTotalList.splice(findData, 1);
    }
  }
  return clonedTotalList; // 수정된 복사본 반환
};

//선택된 api 삭제 (DB 삭제 x)
const removeSelectedApi = (payload) => {
  const selectedArr = payload.value;

  //삭제된 arr가 몇번째 인덱스에 있는지 확인 : totalApiList에 index번째에 추가
  //저장된 arr가 몇번째 인덱스에 있는지 확인 : savedApiList index번째 삭제
  for (const data of selectedArr) {
    const findOriginIndex = state.originApiList.findIndex(
      (api) => api.grpOid === data.grpOid
    );
    const findSavedIndex = state.savedApiList.findIndex(
      (api) => api.grpOid === data.grpOid
    );

    if (findSavedIndex >= 0) {
      state.savedApiList.splice(findSavedIndex, 1);
    }

    if (findOriginIndex >= 0) {
      if (state.totalApiList.length > 0) {
        state.totalApiList.splice(findOriginIndex, 0, data);
      } else state.totalApiList.push(data);
    }
  }
};

//api 이름 검색
const searchApi = (payload) => {
  let apiArr = [];
  for (let data of state.originApiList) {
    if (data.grpName.indexOf(payload.data) != -1) {
      apiArr.push(data);
    }
  }
  state.totalApiList = checkDuplicateApiList(state.savedApiList, apiArr);

  return state.totalApiList;
};

//api 검색창 리셋 버튼
const resetSearchApi = () => {
  state.totalApiList = checkDuplicateApiList(
    state.savedApiList,
    state.originApiList
  );
};
</script>
<style lang="scss"></style>
