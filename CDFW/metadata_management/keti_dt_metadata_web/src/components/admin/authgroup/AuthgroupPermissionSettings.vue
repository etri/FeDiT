<template>
  <div class="boxTit">
    <h3>권한 설정(관리자 목록)</h3>
    <div class="btnSec abs">
      <div class="settings" v-if="curPage == 'modify'">
        <el-button size="small" @click="dialogVisible = true">
          <Plus style="width: 1.3em; height: 2em" />
        </el-button>
      </div>
    </div>
  </div>
  <div class="boxCnt" v-if="curPage == 'modify'">
    <comn-list
      :tableHeader="tableHeaderModi"
      :tableData="savedUser"
    >
      <template v-slot:delete="slotProps">
        <el-button size="small" @click="removeContact(slotProps.row)">
          <Minus style="width: 1.3em; height: 2em" />
        </el-button>
      </template>
    </comn-list>

    <div class="btnSec taR" >
      <el-button
        v-if="isWriteYn(route.meta.auth)"
        type="primary"
        @click="saveAuthgroupUser"
        >저장</el-button
      >
    </div>
  </div>
  <div class="boxCnt" v-if="curPage == 'detail'">
    <comn-list
      :tableHeader="tableHeaderDetail"
      :tableData="savedUser"
    >
    </comn-list>
  </div>

  <div>
    <el-dialog v-model="dialogVisible" title="사용자 검색" style="padding-bottom: 35px;">
      <AuthgroupUserList
        @cancelPopup="cancelPopup"
        @selectedUser="selectedUser"
        :userList="userList"
        @searchUser="searchUser"
        @resetSearchUser="resetSearchUser"
      />
    </el-dialog>
  </div>
</template>
<script setup>
import AuthgroupUserList from "./AuthgroupUserList.vue";
import ComnList from "@/components/common/ComnList";
import { useRoute } from "vue-router";
import { isWriteYn } from "@/assets/js/common.js";
import { ref, defineProps, defineEmits } from "vue";

const route = useRoute();
const emits = defineEmits([
  "selectedUser",
  "saveUserData",
  "removeSelectedUser",
  "searchUser"
]);

const props = defineProps({
  savedUser: {
    type: Array,
    required: true,
  },
  userList: {
    type: Array,
    required: true,
  },
  curPage: {
    type: String,
    required: false,
  },
});

let dialogVisible = ref(false);
let userArr = ref([]);
const tableHeaderModi = [
{
    prop: "userid",
    label: "사용자ID",
    width: 250,
  },
  {
    prop: "nickname",
    label: "이름",
    width: 250,
  },
  {
    prop: "email",
    label: "이메일",
    width: 250,
  },
  {
    prop: "phone",
    label: "휴대전화",
    width: 250,
  },
  {
    prop: "delete",
    label: "삭제",
    width: 50,
    columnType: "custom",
  },
];

const tableHeaderDetail = [
{
    prop: "userid",
    label: "사용자ID",
    width: 250,
  },
  {
    prop: "nickname",
    label: "이름",
    width: 250,
  },
  {
    prop: "email",
    label: "이메일",
    width: 250,
  },
  {
    prop: "phone",
    label: "휴대전화",
    width: 250,
  },
];

const removeContact = (data) => {
  userArr.value.push(data);
  emits("removeSelectedUser", userArr);
};
const cancelPopup = () => {
  dialogVisible.value = false;
};
const saveAuthgroupUser = () => { 
  emits("saveUserData");
};
const selectedUser = (payload) => {
  emits("selectedUser", payload);
  cancelPopup();
};

const searchUser = (payload) => {
  emits("searchUser", payload);
};

const resetSearchUser = () => {
  emits("resetSearchUser");
};
</script>
<style lang="scss">
@import "~@/assets/scss/common/dialog.scss";
</style>