<template>
    <div>
        <p v-html="state.notice.ntfSbst"></p>
    </div>
    <div style="width: 100%;position: fixed;bottom: 8px;padding-left: 4%;">
        <el-checkbox 
            style="padding-right: 10%;"
            v-if="state.notice.todayPopupIndcYn == 'Y'"
            v-model="state.closeToday"
            @change="closeTodayPopup"
        >
            <p>오늘 하루 그만 보기</p>
        </el-checkbox>
        <el-button 
            v-if="state.notice.clsButtIndcYn == 'Y'"
            @click="closePopup" 
        >
            닫기
        </el-button>
    </div>
    <div >
        
    </div>
</template>
<script setup>
import { onMounted, reactive } from "vue";
import { useRoute } from "vue-router";
import {
  getGlobalProperties,
  setCookie,
  deleteCookie
} from "@/assets/js/common.js";

import util from "util";
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const route = useRoute();

onMounted( () => {
    getOpernoticeDetail();
});
const state = reactive({
  notice: {},
  closeToday:false,
});

const closeTodayPopup = () =>{
    let t = new Date();
    t.setHours(24, 0, 0, 0); // Set to the next day's midnight
    if(state.closeToday) {
        setCookie("ntf" + state.notice.ntfOid, "Y", { expires: t });
    } else deleteCookie("ntf" + state.notice.ntfOid);
}

const getOpernoticeDetail = () =>{
    let ntfOid = route.query.ntfOid;
    $axios
    .get(util.format($apiUrls.admin.notices.getNoticeDetail, ntfOid))
    .then((res) => {
      state.notice = res.data;
      
      
    })
    .catch((err) => {
      console.log(err);
    });
}
const closePopup = () =>{
    
    window.close();
}
</script>
<style lang="scss" scoped>
    
</style>