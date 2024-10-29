<template>
  <div>
    <div class="cntSec">

      <!-- 사용자 검색 -->
      <UserSearchForm @searchUser="searchUser" />

      <div class="boxLayout">
        <div class="boxTit">
          <h3>사용자 목록</h3>
        </div>
        <div class="boxCnt">
          <div style="overflow-x: hidden; overflow-y: auto">
            <UserList
              :userList="state.userList"
              :totalPage="state.pageInfo.totalListSize"
              :curPage="state.pageInfo.curPage"
              @pageMove="pageMove"
              @rowClick="rowClick"
            />
          </div>
        </div>
      </div>
      <ul class="btnSec taR mt10">
        <li>
          <el-button v-if="isWriteYn(route.meta.auth)" type="primary" size="large" @click="userRegist"
            >등록</el-button
          >
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import UserSearchForm from "@/components/admin/user/UserSearchForm.vue";
import UserList from "@/components/admin/user/UserList.vue";
import { getUsers, getUser } from "@/assets/js/auth.js";

import { onMounted, reactive } from "vue";
import {isWriteYn } from "@/assets/js/common.js";
import { useRoute } from "vue-router";


const route = useRoute();
const user = getUser();

const state = reactive({
  userList: [],
  pageInfo: {
    curPage: 1,
    searchType: "",
    searchWord: "",
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    grpAdminFlag: 0,
  },
});

onMounted(() => {
  getUserList();
});

const getUserList = async () => {
  let userDataList = await getUsers();
  state.userList = userDataList;
  state.pageInfo.totalListSize = userDataList.length;
  console.log(state.userList)
};

const userRegist = () => {
  if(process.env.VUE_APP_METADATA_USERINFO_YN === "Y") {
    window.open(process.env.VUE_APP_N2M_AUTH_URI + "/accounts/signup/joinMemberStep1");
  }
  else {
    openUserPopup();
  }
};

const openUserPopup = (event, userId) => {
  var popup = {
    x: (document.body.offsetWidth / 2) - (500 / 2),
    y: (document.body.offsetHeight / 2) - (720 / 2)
	};
	
  let url = '/iot/popup/userRegist';
  if (userId) {
    url += '?userId=' + userId;
  }
  var base = {
    name   : '사용자 등록(수정)',
    option : 'width=500, height=800, top=' + popup.y + ', left=' + popup.x + ', status=no, scrollbars=no, resizable=no, location=no, toolbar=no',
    url    : url
  }

  var checkWindow =window.open(base.url, base.name, base.option);

  // checkWindow.addEventListener('closeWinPop', function() {
  //   setTimeout(() => {
  //     getUserList();
  //   },200);
  // });
};



const rowClick = (data) => {
  if(process.env.VUE_APP_METADATA_USERINFO_YN === "Y") {
    return;
  }
  else {
    openUserPopup('', data.userid);
  }
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getUserList();
};

const searchUser = (payload) => {
  state.pageInfo.curPage = payload.curPage;
  state.pageInfo.searchType = payload.searchType;
  state.pageInfo.searchWord = payload.searchWord;
  getUserList();
};
</script>
<style lang="scss"></style>
