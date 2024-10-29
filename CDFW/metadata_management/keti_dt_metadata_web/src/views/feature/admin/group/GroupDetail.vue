<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>그룹 정보</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <GroupDetail :group="state.group" />
        </div>
      </div>
    </div>
      <div class="boxLayout">
        <GroupUserList 
          :groupUserList="state.groupUser"
        />
      </div>
  </div>
</template>
<script setup>
import GroupDetail from "@/components/admin/group/GroupDetail.vue";
import GroupUserList from "@/components/admin/group/GroupUserList.vue";

import { reactive, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties, getCookie } from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const state = reactive({
  group: {},
  groupUser: [],
  userList: [],
  originUser: [],
  totalUser: [],
  userIndexList: [],
  option: {
    key: 0,
    label: "",
    disabled: true,
  }
});

onMounted(() => {
  getGroupUserList();
  getGroupDetail();
});

const getGroupDetail = () => {
  let grpId = route.query.grpId;
  $axios
    .get(util.format($apiUrls.common.group.getGroupDetail, grpId))
    .then((res) => {
      state.group = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getGroupUserList = () => {
  $axios
    .get($apiUrls.common.group.getGroupUserList, {
    })
    .then((res) => {
      state.groupUser = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const selectedUser = (payload) => {};

//user 신규 저장 (기존 데이터 삭제 후 저장)
const saveUserData = () => {};

const deleteBeforeGroupUsers = (grpId) => {};
const setGroupUsers = (grpId, groupUser) => {};
//선택된 user 삭제 (DB 삭제 x)
const removeSelectedUser = (payload) => {};

</script>
<style lang="scss"></style>