<template>
  <div>
    <div class="boxLayout">
      <div class="boxTit">
        <h3>담당자/사용자 검색</h3>
      </div>
      <div class="boxCnt">
        <el-form-item label="이름" prop="name" class="chTable">
          <el-input
            v-model="state.name"
            placeholder="검색어를 입력하세요."
            @keyup.enter="searchUserName"
            style="width: 400px"
          ></el-input>
          <el-icon
            @click="resetUserList"
            style="position: relative; right: 22px; top: 3px"
            ><Close
          /></el-icon>
          <el-button
            type="primary"
            @click="searchUserName"
            style="position: relative; left: 22px;"
            >검색</el-button
          >
        </el-form-item>
      </div>
    </div>
    
    <div class="boxLayout">
      <div class="boxTit">
        <h3>담당자 목록</h3>
      </div>
      <div>
        <comn-list
          :tableHeader="tableHeader"
          :tableData="userList"
          :height="250"
          @selectionChange="onSelectionChkbox"
        >
          <template v-slot:name="slotProps">
            <el-input v-model="slotProps.row.userID"> </el-input>
          </template>
        </comn-list>
        <div class="mt10" style="float: right">
          <el-button type="primary" @click="saveUser">선택</el-button>
          <el-button plain type="primary" @click="cancelPopup">취소</el-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import { reactive, defineProps, defineEmits, onMounted } from "vue";

const props = defineProps({
  userList: {
    type: Array,
    required: true,
  },
});
const emits = defineEmits([
  "cancelPopup",
  "selectedUser",
  "searchUser",
  "resetSearchUser",
]);
const state = reactive({
  name: "",
  selectUsers: [],
  indexList: [],
});



const tableHeader = [
  {
    type: "selection",
    width: 50,
  },
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

const onSelectionChkbox = (event) => {
  state.selectUsers = event;
};

const saveUser = () => {
  emits("selectedUser", {
    data: state.selectUsers,
  });
};
const cancelPopup = () => {
  emits("cancelPopup");
};

const searchUserName = () => {
  emits("searchUser", { data: state.name });
};

const resetUserList = () => {
  state.name = "";
  emits("resetSearchUser");
};
</script>
<style lang="scss"></style>
