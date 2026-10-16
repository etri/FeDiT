<template>
  <div>
    <div class="ly-table" style="margin-top: 10px">
      <div class="ly-table">
        <el-table
          :data="state.menuList"
          style="width: 100%; margin-bottom: 20px"
          row-key="menuOid"
          border
          default-expand-all
        >
          <el-table-column prop="menuNm" label="메뉴명" :min-width="200">
            <template #default="{ row }">
              {{ row.menuNm }}
            </template>
          </el-table-column>
          <el-table-column prop="menuDesc" label="설명" :min-width="150">
            <template #default="{ row }">
              {{ row.menuDesc }}
            </template>
          </el-table-column>

          <el-table-column prop="read" label="읽기" :min-width="30" header-align="center" align="center">
            <template #default="{ row }">
              <el-checkbox
                v-model="row.read"
                size="large"
                @change="onChangeAuthRead(row)"
                v-bind:disabled="curPage != 'modify'"
              />
            </template>
          </el-table-column>
          <el-table-column prop="write" label="쓰기" :min-width="30" header-align="center" align="center">
            <template #default="{ row }">
              <el-checkbox
                v-model="row.write"
                size="large"
                @change="onChangeAuthWrite(row)"
                v-bind:disabled="curPage != 'modify'"
              />
            </template>
          </el-table-column>
          <el-table-column prop="amd" label="수정" :min-width="30" header-align="center" align="center">
            <template #default="{ row }">
              <el-checkbox
                v-model="row.amd"
                size="large"
                @change="onChangeAuthAmd(row)"
                v-bind:disabled="curPage != 'modify'"
              />
            </template>
          </el-table-column>
          <el-table-column prop="del" label="삭제" :min-width="30" header-align="center" align="center">
            <template #default="{ row }">
              <el-checkbox
                v-model="row.del"
                size="large"
                @change="onChangeAuthDel(row)"
                v-bind:disabled="curPage != 'modify'"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <div class="btnSec taR">
      <el-button
        v-if="isWriteYn(route.meta.auth) && curPage == 'modify'"
        type="primary"
        @click="saveAuthMenuList"
        >저장</el-button
      >
    </div>
  </div>
</template>
<script setup>
import { reactive, onMounted, defineEmits, defineProps } from "vue";
import { getGlobalProperties, isWriteYn } from "@/assets/js/common.js";
import util from "util";
import { useRoute } from "vue-router";

const route = useRoute();
const properties = getGlobalProperties();
const $axios = properties.$axios;
const $apiUrls = properties.$apiUrls;

const emits = defineEmits(["saveAuthMenuList"]);

const state = reactive({
  authgroup: {},
  menuList: [],
  sendList: [],
});

const props = defineProps({
  curPage: {
    type: String,
    required: false,
  },
});

onMounted(async () => {
  await getAuthDetail();
  await getAuthMenuList();
});

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
      state.menuList = changeYnDataToBoolean(res.data);
    })
    .catch((err) => {
      console.log(err);
    });
};

//화면에 select box 데이터 띄우기 위해 작업
const changeYnDataToBoolean = (data) => {
  for (let i = 0; i < data.length; i++) {
    data[i].readYn == "Y" ? (data[i].read = true) : (data[i].read = false);
    data[i].writeYn == "Y" ? (data[i].write = true) : (data[i].write = false);
    data[i].amdYn == "Y" ? (data[i].amd = true) : (data[i].amd = false);
    data[i].delYn == "Y" ? (data[i].del = true) : (data[i].del = false);
    if (data[i].children.length > 0) {
      changeYnDataToBoolean(data[i].children);
    }
    if (data[i].read || data[i].write || data[i].amd || data[i].del == true) {
      addDataArray(data[i]);
    }
  }
  return data;
};

//읽기 버튼 클릭 시
const onChangeAuthRead = (data) => {
  if (data.read == false && data.write == true) {
    alert("쓰기를 위해서는 읽기 버튼은 필수입니다.");
    return (data.read = true);
  }
  checkData(data);
};

//쓰기 버튼 클릭 시
const onChangeAuthWrite = (data) => {
  checkData(data);
};

//수정 버튼 클릭 시
const onChangeAuthAmd = (data) => {
  checkData(data);
};

//삭제 버튼 클릭 시
const onChangeAuthDel = (data) => {
  checkData(data);
};

//select box 체크 및 데이터 변경
const checkData = (data) => {
  if (data.write == true) {
    data.read = data.write;
  }

  addDataArray(data);

  if (data.children.length > 0) {
    for (let i = 0; i < data.children.length; i++) {
      data.children[i].read = data.read;
      data.children[i].write = data.write;
      data.children[i].amd = data.amd;
      data.children[i].del = data.del;
      addDataArray(data.children[i]);
      if (data.children[i].children.length > 0) checkData(data.children[i]);
    }
  }
};

//**backend에 전달할 data list를 넣는다. (필요한 내용 mnuId, grpId, readTF, writeTF)
const addDataArray = (data) => {
  let object = {
    menuOid: data.menuOid,
    autOid: state.authgroup.autOid,
    readYn: data.read == true ? "Y" : "N",
    writeYn: data.write == true ? "Y" : "N",
    amdYn: data.amd == true ? "Y" : "N",
    delYn: data.del == true ? "Y" : "N",
  };

  let findDuplexData = state.sendList.findIndex(
    (item) => item.menuOid === data.menuOid
  );

  //menuOid 중복되는 배열 삭제
  if (findDuplexData >= 0) state.sendList.splice(findDuplexData, 1);
  if (
    data.read == false &&
    data.write == false &&
    data.amd == false &&
    data.del == false
  ) {
    return null;
  } else {
    state.sendList.push(object);
  }
};

const saveAuthMenuList = () => {
  emits("saveAuthMenuList", { authMenuList: state.sendList });
};
</script>
<style lang="scss"></style>
