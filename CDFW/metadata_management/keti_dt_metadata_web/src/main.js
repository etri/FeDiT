import { createApp } from "vue";
import cookie from 'js-cookie'

// 다국어 설정
import { createI18n } from 'vue-i18n';
import messages from '@/i18n/i18n';

const i18n = createI18n({
  legacy: false,
  locale: 'ko',
  fallbackLocale: 'en',
  silentFallbackWarn: true,
  messages: messages
})

// Vue Element Plus
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import router from '@/router'

// Vue Grid Layout
// import VueGridLayout from "vue-grid-layout";
import GridLayout from "vue-grid-layout-v3";

// Vue Json Editor
import JsonEditor from 'json-editor-vue';

// Vue Router
import Router from "./router";

// Vue Axios
import axios from "axios";

// Quartz Cron Expression Validator
var cronValidator = require('cron-expression-validator');

// Vuex
import store from "./store/index";

import App from "./App.vue";

import mitt from "mitt";

// Vue Sidebar Menu
import VueSidebarMenu from "vue-sidebar-menu";
import "vue-sidebar-menu/dist/vue-sidebar-menu.css";

// Vue Context Menu
import ContextMenu from "@imengyu/vue3-context-menu";
import "@imengyu/vue3-context-menu/lib/vue3-context-menu.css";

// ----------------------------------------------------------------------------------------------------
// Map Module ST.

// Vue OpenLayers
import OpenLayersMap from "vue3-openlayers";
import "vue3-openlayers/dist/vue3-openlayers.css";

// Vue CesiumJS
//import VueCesium from 'vue-cesium'
//import 'vue-cesium/dist/index.css'

// Map Module ED.
// ----------------------------------------------------------------------------------------------------

// Tree table - primeVue
import PrimeVue from 'primevue/config'; // This imports the PrimeVue library.

import "@/assets/css/default.css";
//console.log(process.env.VUE_APP_METADATA_CSS_THEME);
if (process.env.VUE_APP_METADATA_CSS_THEME === "BLUEGRAY") {
  import("@/assets/css/style.css");
}

import ApiUrls from "@/assets/json/ApiUrls.json";
import CommonObj from "@/assets/js/commonObj.js";
import { Base64 } from 'js-base64';
import { getToken } from "@/assets/js/auth.js";

const emitter = mitt();
const app = createApp(App);

app.use(ElementPlus);
//app.use(VueGridLayout);
app.use(GridLayout);
app.use(JsonEditor);

app.use(Router);
app.use(store);
app.use(VueSidebarMenu);
app.use(ContextMenu);
app.use(OpenLayersMap);
//app.use(VueCesium, {
//  cesiumPath: 'path/to/Cesium.js',
//  accessToken: 'your Cesium Ion access token',
//  locale: enUS // change to English
//});
app.use(PrimeVue);
app.use(i18n);
app.mount("#app");

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// var _axios = axios.create({
//   baseURL: process.env.VUE_APP_BACKEND_SERVER_URL
// });

axios.interceptors.request.use((config) => {
  emitter.emit("loading", true);
  //console.log("TODO :: axios pre-handler");
  let access_token = getToken();
  if(access_token) {
    config.headers.Authorization = 'Bearer ' + `${access_token}`;
  }else {
    config.headers.Authorization = 'Basic ' + Base64.encode(process.env.VUE_APP_N2M_AUTH_CLIENT_ID + ':' + process.env.VUE_APP_N2M_AUTH_CLIENT_SECRET);
  }
  return config;
});

axios.interceptors.response.use(
  (response) => {
    //console.log("TODO :: axios post-handler");
    emitter.emit("loading", false);

    return response;
  },
  async (err) => {
    //401 에러 시 refreshToken 만료로 판단, 재 로그인 요청 
    //(로그아웃해서 쿠키 삭제 + 로그인페이지로 이동)
    if(err.response && err.response.status === 401) {
      cookie.remove('token');
      router.push('/');
    }
    emitter.emit("loading", false);
    return Promise.reject(err);
  }
);

app.config.productionTip = false;
app.config.globalProperties.$apiUrls = ApiUrls;
app.config.globalProperties.$emitter = emitter;
app.config.globalProperties.$common  = CommonObj;
app.config.globalProperties.cronValidator = cronValidator;
app.config.globalProperties.$axios = axios;



