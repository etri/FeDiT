<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>그룹 등록</h3>
      </div>
      <div class="boxCnt">
        <GroupEdit ref="editGroup" />
      </div>
    </div>
    <div class="boxLayout">
      <div class="boxTit">
        <h3>그룹 사용자 등록</h3>
        <div class="btnSec taR">
          <el-button class="el-button--gray" size="small" :icon="Refresh" @click="resetSearchForm()">재조회</el-button>
        </div>
      </div>
      <div class="boxCnt">
        <el-transfer
          class="textCenter"
          :titles="['전체 사용자', '등록 사용자']"
          v-model="value" 
          :data="state.transferUserList"
          @change="transferUsers()"
        />
      </div>
    </div>
    <div class="btnSec taR mt20">
      <div v-if="grpId != null">
        <el-button type="dodgerblue" @click="EditGroup">저장</el-button>
        <!-- <el-button type="primary" @click="groupDetail">상세</el-button> -->
        <el-button plain type="primary" @click="goToList">목록</el-button>
      </div>
      <div v-else>
        <el-button type="dodgerblue" @click="EditGroup">저장</el-button>
        <el-button plain type="primary" @click="goToList">목록</el-button>
      </div>
    </div>
  </div>
</template>
<script setup>
import GroupEdit from "@/components/admin/group/GroupEdit.vue";

import { getGlobalProperties, getCookie, routerPush } from "@/assets/js/common.js";
import { getUser, getUsers } from "@/assets/js/auth.js";
import { useRoute } from "vue-router";
import { ref, reactive, onMounted, } from "vue";
import util from "util";

const editGroup = ref(null);
const users = getUser();
const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const state = reactive({
  groupUser: [],
  transferUserList: [],
  users: [],
});

let grpId = route.query.grpId;

onMounted(() => {
  getGroupUserList();
  getUserList();
});

const getUserList = async () => {
  let userDataList = await getUsers();
  for(let user of Object.values(userDataList)){
    let userNm = user.userid + " (" + user.name +")";
    state.transferUserList.push({
      key: user.userid,
      label: userNm,
    })
  }
};

const EditGroup = async () => {
  let ruleForm = editGroup.value.ruleFormRef;
  if (!ruleForm) return;
  await ruleForm.validate((valid) => {
    if (valid) {
      addUsers();
      let group = editGroup.value.group;
      
      let groupInfo = {
        grpId: grpId,
        grpNm: group.grpNm,
        grpDesc: group.grpDesc,
        regrId: users.id,
        regrNm: users.name,
        groupUserList: state.groupUser,
      };

      let groupUpdateInfo = {
        grpId: grpId,
        grpNm: group.grpNm,
        grpDesc: group.grpDesc,
        amdrId: users.id,
        amdrNm: users.name,
        groupUserList: state.groupUser,
      };

      if(grpId != null){
        let result = confirm("Group을 수정하시겠습니까?");
        if(result){
          $axios
            .put(
              util.format($apiUrls.common.group.modifyGroup, grpId),
              groupUpdateInfo
            )
            .then(() => {
              alert('Group이 수정되었습니다.');
              goToEdit();
            })
            .catch((err) => {
              console.log(err);
              alert("Group 수정에 실패하였습니다.");
            });
        }
      }else{
        let result = confirm("Group을 저장하시겠습니까?");
        if(result){
          $axios
            .post($apiUrls.common.group.setGroupDetail, groupInfo)
            .then(() => {
              alert("Group이 저장되었습니다.");
              goToList();
            })
            .catch((err) => {
              console.log(err);
              alert("Group 저장에 실패하였습니다.");
            });
        }
      }
    } else {
      alert("필수사항을 입력하십시오.");
    }
  });
};

const getGroupUserList = () => {
  $axios
    .get($apiUrls.common.group.getGroupUserList, {
    })
    .then((res) => {
      state.groupUser = res.data;
      generateData();
    })
    .catch((err) => {
      console.log(err);
    });
};

// element plus - transfer 적용 소스
const value = ref([])

const generateData = () => {
  let cnt = 0;
  value.value = [];
  for(let user of state.groupUser){
    if(grpId != null && user.grpId == grpId){
      value.value[cnt] = user.userId;
      cnt++;
    }
  }
}

// 우측 클릭 시 이벤트
const transferUsers = () => {
  for(let user of Object.values(value.value)){
    state.transferUserList.push({
      key: user.userId,
      label: user.userId,
    })
  }
}

const addUsers = () => {
  state.users = [];
  for(let userId of Object.values(value.value)){
    state.users.push({
      grpId: grpId,
      userId: userId,
    })
  }
  state.groupUser = state.users;
}

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "GroupList", query);
};

const goToEdit = () => {
  let platform = getCookie("pltfrmId");
  let query = {
    grpId: route.query.grpId,
  };
  routerPush(platform, "GroupEdit", query);
};

const resetSearchForm = () => {
  state.transferUserList = [];
  getUserList();
};

</script>
<style lang="scss">

.textCenter{
  text-align: center;
}
</style>
