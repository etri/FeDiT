import { nextTick } from "vue";
import { createRouter, createWebHistory } from "vue-router";

import store from "@/store/index";
import axios from "axios";
import { getLoginUserId } from "@/assets/js/auth.js";

import {
  setAccessToken,
  hasRefreshToken,
  isAuthenticated,
  requestAuthToken,
  redirectLoginView,
} from "@/assets/js/auth.js";

import { metaRoutes } from './router-meta.js';

const contenxtPath = "";

const routes = [
  {
    path: "/",
    name: "Main",
    component: () =>
      import(/* webpackChunkName "main" */ "@/views/layouts/CommonLayout.vue"),
  },
  {
    path: "/logout",
    name: "Logout",
    component: () =>
      import(/* webpackChunkName "main" */ "@/views/layouts/CommonLayout.vue"),
  },

  metaRoutes,

  // router에 없는 url을 호출 했을 때 404 not found 처리
  {
    path: "/:catchAll(.*)",
    name: "NotFound",
    component: () => import("@/views/error/NotFound"),
  },
  {
    path: "/forbidden",
    name: "Forbidden",
    component: () => import("@/views/error/Forbidden"),
  },
  {
    path: "/popup",
    name: "Popup",
    component: () =>
      import(/* webpackChunkName "popup" */ "@/views/feature/admin/opernotice/OpernoticePopup.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior() {
    console.log('Scroll Init')
    return { top: 0 }
  },
});

const aiotTitle = process.env.VUE_APP_AIOT_TITLE;
router.afterEach((to, from) => {
  nextTick(() => {
    document.title = aiotTitle === null ||  aiotTitle === undefined ? 'nTom Platform' : aiotTitle;
  });
});

window.addEventListener('beforeunload', () => {
  store.commit('MetaStore/closePopup');
});

const names = [
  "NotFound",
  "Forbidden",
  "Popup",
  "iot_UserRegistPopup",
  "dashboard_DashboadrMainPopup",
  "meta_ModelPropertyListPopupPage",  
  "meta_ResourcePage",         // 메타데이터 리소스 공개 페이지
  "meta_ResourceEmptyPage",    // 메타데이터 리소스 공개 페이지
  "meta_KetidtInfoPage",       // ketidt ttl 정보 공개 페이지
  "meta_KetidtskosInfoPage",   // ketidtskos ttl 정보 공개 페이지
  "meta_SparqlQueryResultPage",// SPARQL 결과 페이지
  "meta_ElasticsearchQueryResultPage",// Elasticsearch 결과 페이지
  "meta_ExSearchListPage",     // 검색. 디지털연합트윈 제공용 화면
  "meta_ExMetadataPage",       // 검색데이터. 디지털연합트윈 제공용 화면
    
];

router.beforeEach(async (to, from, next) => {
  store.commit('MetaStore/closePopup');
  // console.log(`beforeEach : ${to.name}`);
  if (names.includes(to.name) && to.path !== "/redirect") {
    return next();
  }
  await checkSession(to, from, next);

  let chkDefalutPltfrmPage = await checkPlatformDefaultPage(to);
  if(chkDefalutPltfrmPage) return next();
});

router.beforeResolve(async (to, from, next) => {
  /*
  1. to.path와 menuList를 조회해서 menuOid 찾기
  2. menuOid의 개수가 여러개면 -> to.param 정보 추가 조회하여 menuOid 찾기
  3. 이렇게 했는데도 한개 이상이면 첫번째 배열 값으로 menuOid 찾기
  -> 이후 백엔드로 bread crumb 조회 요청, 배열 값 오면 meta에 데이터 전달 
  + 메뉴마다 읽기 쓰기 수정 삭제 데이터 받아오기.
  */
  if (names.includes(to.name) || to.path == "/") {
    return next();
  }

  let chkDefalutPltfrmPage = await checkPlatformDefaultPage(to);
  if(chkDefalutPltfrmPage) return next();

  let menuList = store.getters["MenuStore/getUserMenuAllList"];

  if (menuList.length == 0 || menuList == null) {
    const { data } = await axios.get("/api/admin/usermenu", {
      params: {
        userId: getLoginUserId(),
        admrYn: "Y",
        searchType: "tree",
        readYn: "Y",
      },
    });

    menuList = data || [];
  }
  let menuArr = [];
  const menuInfo = findMenuInfo(menuArr, menuList, to.matched );

  let menuOid = 0;
  let menuData = {};
  if (menuInfo.length == 1) {
    menuOid = menuInfo[0].menuOid;
    menuData = menuInfo[0];
  }
  if (menuInfo.length > 1) {
    const findMenuParam =
      menuInfo.filter((item) => item.urlParam === to.query.param) || {};
    if (findMenuParam && findMenuParam.length > 0) {
      menuOid = findMenuParam[0].menuOid;
      menuData = findMenuParam[0];
    }
  }
  if (menuInfo.length == 0) {
    return next({ name: "Forbidden" });
  }
  if (menuInfo.length > 0 && !checkUserAuth(menuData)) {
    return next({ name: "Forbidden" });
  }

  if (menuData) {
    try {
      const { data } = await axios.get("/api/admin/getBreadCrumb/" + menuOid, {
        params: {
          userId: getLoginUserId(),
          menuOid: menuOid,
          typeCd: "COD_00001",
        },
      });
      const breadcrumbList = data.breadCrumb || [];
      to.meta.navigator = breadcrumbList.map((obj) => {
        return {
          link: obj.menuUrl,
          breadcrumb: obj.menuNm,
          menuId: obj.menuId,
        };
      });
      to.meta.title =
        to.meta.navigator[to.meta.navigator.length - 1].breadcrumb || "";
      to.meta.auth = {
        readYn: menuData.readYn,
        writeYn: menuData.writeYn,
        amdYn: menuData.amdYn,
        delYn: menuData.delYn,
      };
    } catch (e) {
      // 오류 발생시에도 메인흐름에 영향을 주지 않도록 함.
      console.error(e);
    }
  }
  next();
});

const checkUserAuth = (menuData) => {
  if (menuData.readYn == "Y") return true;
  else return false;
};


const findMenuInfo = (menuArr, menuList, pathArr) => {
  for (let data of menuList) {
    //부모일 경우 (url 없음 + 자식이 없는 경우는 패스)
    if((data.url == "" || data.url == null) && data.children.length == 0) continue;
    let pathYN = false;
    for(let pathObj of pathArr) {
      if(data.url == pathObj.path) {
        pathYN = true;
        break;
      }  
    }
    if(pathYN == true) {
      menuArr.push(data);
    }else if (data.children.length > 0)
      findMenuInfo(menuArr, data.children, pathArr);
  }
  return menuArr;
};


const checkSession = async (to, from, next) => {
  const checkAuthenticated = await isAuthenticated();

  //access token이 있다면 -> 그대로 진행
  if (checkAuthenticated) {
    if (to.path === '/redirect') {
      return next('/');
    }
    return next();
  }

  let accessToken;
  let refreshToken;

  if (process.env.VUE_APP_USE_REFRESH_TOKEN == 'true') {
    //code가 있고 + access token이 없고 + refresh token가 없다면 토큰 정보 새로 발급
    if (to.query.code) {
      refreshToken = await hasRefreshToken();
      if (!refreshToken) {
        accessToken = await requestAuthToken(to.query.code);
        if (!accessToken) {
          redirectLoginView();
          return;
        }
      }
    } else {
      refreshToken = await hasRefreshToken();
    }

    //code 가 없고 + access token이 없고 + refresh token이 있으면 access token 신규 발급
    if (refreshToken) {
      accessToken = await setAccessToken();
      if (!accessToken) { //access token의 return값이 null이라면 401에러, 로그인 페이지로 이동
        redirectLoginView();
        return;
      } else {
        return next("/");
      }
    } 
    else { //code 가 없고 + access token이 없고 + refresh token이 없으면 로그인 페이지로 이동
      redirectLoginView();
      return;
    }

  } else {
    if (to.query.code) {
      accessToken = await requestAuthToken(to.query.code);
      if(accessToken) return next("/");
      if (!accessToken) {
        redirectLoginView();
        return;
      }
    }else {
      redirectLoginView();
      return;
    }
  }
  

  return next();
}

const checkPlatformDefaultPage = async (to) => {
  let platforms = store.getters["PlatformStore/getPlatformIdList"];

  if (platforms.length == 0 || platforms == null) {
    const { data } = await axios.get("/api/admin/platform", {
      params: {
        useYn: "Y"
      },
    });

    let result = data || [];
    for (let platform of result) {
      platforms.push(platform.pltfrmId);
    }
  }

  for(let platform of platforms) {
    if(to.path == "/"+platform) return true;
  }
  return false;
}

export default router;
