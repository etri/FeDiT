<template>
  <div id="headerWrap">
    <div class="headerSec fix">
      <div class="headerLft fix" >
        <div class="logo">
          <h1 class="logo-font">{{logo}}</h1>
        </div>
        <div class="gnb" :style="{left: '100px !important'}">
          <el-menu
            :default-active="activeIndex"
            mode="horizontal"
            class="top-menu"
          >            
          </el-menu>
        </div>
      </div>
      <div class="headerRgt fix">
        <ul id="gnb">
          <li><el-icon :size="20" class="icon-height" @click="userModify()"><User /></el-icon></li>
          <li style="cursor:default;">{{ $t('common.tltLoginUser', [user.id, user.name]) }}</li>
          <ContentHeaderIconAlarm :visible="alarmIcon"/>
          <!-- <li><el-icon :size="20" class="icon-height" ><Setting /></el-icon></li> -->
          <li v-if="getSuperAdminId === user.id"><el-icon  :size="20" @click="handleClickSetting" class="icon-height"><Tools /></el-icon></li>
          <li v-if="platformLanguageVisible">
            <el-switch
              v-model="platformLanguage"
              class="ml-2"
              inline-prompt
              style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;"
              active-text="KR"
              active-value="ko"
              inactive-text="EN"
              inactive-value="en"
            />
          </li>
          <li><el-icon :size="20" @click="onLogout" class="icon-height"><SwitchButton /></el-icon></li>
        </ul>
      </div>
    </div>

    <el-dialog v-model="dialogSettingVisible" :append-to-body="true" align-center title="Platform 관리자 설정">
      <el-container>
        <el-aside width="200px">
          <el-menu
            default-active="platform"
            class="el-menu-vertical-demo"
            @select="handleSettingMenu"
          >
            <el-menu-item index="platform">
              <el-icon><setting /></el-icon>
              <span>Platform 설정</span>
            </el-menu-item>
            <el-menu-item index="license">
              <el-icon><setting /></el-icon>
              <span>라이센스 관리</span>
            </el-menu-item>
            <el-menu-item index="setting">
              <el-icon><setting /></el-icon>
              <span>설정</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main>
          <template v-if="selectPlatform == 'platform'">
            <PlatformList />
          </template>
          <template v-else>
            2
          </template>
        </el-main>
      </el-container>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits , computed, watch, onMounted, getCurrentInstance, onUnmounted } from "vue";
import { logout, getUser } from "@/assets/js/auth.js";
import { getGlobalProperties, getCookie } from "@/assets/js/common.js";
import { useStore } from "vuex";
import { useI18n } from "vue-i18n";

import metaNotifcUtil from "@/assets/js/metaNotifcUtil.js"

import util from "util";

import PlatformList from "@/components/admin/platform/PlatformList.vue";

import ContentHeaderIconAlarm from "@/components/layouts/ContentHeaderIconAlarm.vue";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter = getCurrentInstance().appContext.config.globalProperties.$emitter;

const getSuperAdminId = ref("");

const emits = defineEmits(["clickPltfrm"]);
const props = defineProps({
  platform: {
    type: Array,
    required: true,
  },
  choosePltfrm: {
    type: String,
    required: true,
  },
});

const store = useStore();
const user = getUser();
const onLogout = () => {

  // meta 플랫폼 // 알림 웹소켓 연결 종료
  if (process.env.VUE_APP_METADATA_ALARM_ICON_SHOW_YN === 'Y') {
    metaNotifcUtil.disconnectWs();
  }  

  logout(true);
}

const n2mLogo = ref("N2M");
const platformLogo = null; // ref(process.env.VUE_APP_PLATFORM_LOGO_TEXT);
const logo = platformLogo ?? n2mLogo;
const alarmIcon = ref(false);

const platformLanguageVisible = ref(false);
const platformLanguage = ref('ko');
const { availblesLocales, locale } = useI18n();
watch(
  platformLanguage,
  (crr) => {
    locale.value = crr;
  }
);

onMounted(() => {
  locale.value = 'ko';

  getSuperAdmin();

  // 플랫폼 language 사용. 표시.
  if (process.env.VUE_APP_PLATFORM_LANGUAGE_USE_YN === 'Y') {
    platformLanguageVisible.value = true;
  }

  // meta 플랫폼 // 알림 웹소켓 연결
  if (process.env.VUE_APP_METADATA_ALARM_ICON_SHOW_YN === 'Y') {
    alarmIcon.value = true;
    metaNotifcUtil.connectWs(store, $axios, $emitter);
  }
});

onUnmounted(() => {
  // meta 플랫폼 // 알림 웹소켓 연결 종료
  if (process.env.VUE_APP_METADATA_ALARM_ICON_SHOW_YN === 'Y') {
    metaNotifcUtil.disconnectWs();
  }  
});

const activeIndex = computed (() => {
  return props.choosePltfrm;
})

// ---------
// 설정
const dialogSettingVisible = ref(false);
const handleClickSetting = () => {
  dialogSettingVisible.value = true;
}

let selectPlatform = ref('platform');
const handleSettingMenu = (data) => {
  selectPlatform.value = data;
}

const clickPltfrm = (event, data) => {
  emits("clickPltfrm", data);
}

// ---------

const getIconComponent = (icon) => {
  if(typeof icon !== "undefined" && icon !== "" && icon !== null){
    return icon;
  }
}

const getSuperAdmin = () => {
  $axios
    .get(util.format($apiUrls.admin.common.getSuperAdmin))
    .then((res) => {
      getSuperAdminId.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const userModify = () => {
  if(process.env.VUE_APP_METADATA_USERINFO_YN === "Y") {
    // window.open(process.env.VUE_APP_N2M_AUTH_FRONT_URI + "/users");
    return;
  }
  else {
    openUserPopup('', user.id);
  }
};

const openUserPopup = (event, userId) => {
  var popup = {
    x: (document.body.offsetWidth / 2) - (500 / 2),
    y: (document.body.offsetHeight / 2) - (720 / 2)
	};
	
  let url = '/admin/popup/userRegist';
  if (userId) {
    url += '?userId=' + userId;
  }
  var base = {
    name   : '사용자 등록(수정)',
    option : 'width=500, height=800, top=' + popup.y + ', left=' + popup.x + ', status=no, scrollbars=no, resizable=no, location=no, toolbar=no',
    url    : url
  }

  var checkWindow =window.open(base.url, base.name, base.option);
};

</script>

<style lang="scss" scoped>
.icon-height{
  top: 6px;
}
// .el-menu--horizontal .el-menu-item:not(.is-disabled):hover,
// .el-menu--horizontal .el-menu-item.is-active {
//   border-bottom: none;
//   background-color: #000000;
//   color: #000000 !important;
// }
.check-alarm{
  position:relative;
}.check-alarm:after{
  content:'';
  display:inline-block;
  width:6px;
  height:6px;
  border-radius:5px;
  background-color:#D30000;
  position:absolute;
  top:-4px;
  right:-5px;
  z-index:9999;
}
</style>