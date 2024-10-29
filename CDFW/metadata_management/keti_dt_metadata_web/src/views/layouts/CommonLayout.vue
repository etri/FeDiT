<template>
  <div id="bodyWrap">
    <content-header :platform="platform" :choosePltfrm="choosePltfrm" @clickPltfrm="clickPltfrm"></content-header>
    <div id="container" class="wrap" >
      <div id="contents" :class="contentCls">
        <div class="lftWrap">
          <div class="lftMenu page-title">
            <div :class="curPltfrm.menuIcon == null ? 'unchecked' : 'checked'" :style="{ width: sideWidth }">
              <div>
                <el-icon class="pltfrm-icon"><component :is="getIconComponent(curPltfrm.menuIcon)" /></el-icon>
                <span v-if="!isCollapse" class="pltfrm-title"> {{ curPltfrm.title }}</span>
              </div>
            </div>

            <el-menu class="side-menu"
              active-text-color="#3fcdd4"
              text-color="#fff"
              :default-active="routeMenuId"
              :collapse="isCollapse"
              :collapse-transition="false"
              mode="vertical"
              :style="{ width: sideWidth }"
              style="
                -webkit-box-orient: vertical;
                -webkit-box-direction: normal;
                bottom: 0;
                display: flex;
                -ms-flex-direction: column;
                flex-direction: column;
                left: 0;
                position: fixed;
                text-align: left;
                top: 101px;
                transition: max-width .3s ease;
                max-height: 100%;
                overflow-y: auto;
                z-index: 999;"
            >
              <el-scrollbar style="height: 100%;">
                <template v-for="item in menu">
                  <template v-if="item.child && item.child.length > 0">
                    <el-sub-menu :key="item.menuId" :index="item.menuId">
                      <template #title>
                        <el-icon><component :is="getIconComponent(item.menuIcon)" /></el-icon>
                        <span v-if="!isCollapse">{{ item.title }}</span>
                      </template>
                      <template v-for="subItem in item.child">
                        <template v-if="subItem.child && subItem.child.length > 0">
                          <el-sub-menu :key="subItem.menuId" :index="subItem.menuId">
                            <template #title>
                              <el-icon><component :is="getIconComponent(subItem.menuIcon)" /></el-icon>
                              <span>{{ subItem.title }}</span>
                            </template>
                            <template v-for="subSubItem in subItem.child">
                              <template v-if="subSubItem.child && subSubItem.child.length > 0">
                                <el-sub-menu :key="subSubItem.menuId" :index="subSubItem.menuId">
                                  <template #title>
                                    <el-icon><component :is="getIconComponent(subSubItem.menuIcon)" /></el-icon>
                                    <span>{{ subSubItem.title }}</span>
                                  </template>
                                  <template v-for="subSubSubItem in subSubItem.child">
                                    <template v-if="subSubSubItem.child && subSubSubItem.child.length > 0">
                                      <el-sub-menu :key="subSubSubItem.menuId" :index="subSubSubItem.menuId">
                                        <template #title>
                                          <el-icon><component :is="getIconComponent(subSubSubItem.menuIcon)" /></el-icon>
                                          <span>{{ subSubSubItem.title }}</span>
                                        </template>
                                        <el-menu-item
                                          v-for="subSubSubSubItem in subSubSubItem.child"
                                          :key="subSubSubSubItem.menuId"
                                          :index="subSubSubSubItem.menuId"
                                          @click="onItemClick(subSubSubSubItem)"
                                        >
                                          <el-icon><component :is="getIconComponent(subSubSubSubItem.menuIcon)" /></el-icon>
                                          <span>{{ subSubSubSubItem.title }}</span>
                                        </el-menu-item>
                                      </el-sub-menu>
                                    </template>
                                    <template v-else>
                                      <el-menu-item
                                        :key="subSubSubItem.menuId"
                                        :index="subSubSubItem.menuId"
                                        @click="onItemClick(subSubSubItem)"
                                      >
                                        <el-icon><component :is="getIconComponent(subSubSubItem.menuIcon)" /></el-icon>
                                      <span>{{ subSubSubItem.title }}</span>
                                      </el-menu-item>
                                    </template>
                                  </template>
                                </el-sub-menu>
                              </template>
                              <template v-else>
                                <el-menu-item
                                  :key="subSubItem.menuId"
                                  :index="subSubItem.menuId"
                                  @click="onItemClick(subSubItem)"
                                >
                                  <el-icon><component :is="getIconComponent(subSubItem.menuIcon)" /></el-icon>
                                <span>{{ subSubItem.title }}</span>
                                </el-menu-item>
                              </template>
                            </template>
                          </el-sub-menu>
                        </template>
                        <template v-else>
                          <el-menu-item
                            :key="subItem.menuId"
                            :index="subItem.menuId"
                            @click="onItemClick(subItem)"
                          >
                            <el-icon><component :is="getIconComponent(subItem.menuIcon)" /></el-icon>
                            <span>{{ subItem.title }}</span>
                          </el-menu-item>
                        </template>
                      </template>
                    </el-sub-menu>
                  </template>
                  <template v-else>
                    <el-menu-item :key="item.menuId" :index="item.menuId" @click="onItemClick(item)">
                      <el-icon><component :is="getIconComponent(item.menuIcon)" /></el-icon>
                      <span v-if="!isCollapse">{{ item.title }}</span>
                    </el-menu-item>
                  </template>
                </template>
              </el-scrollbar>
              <div class="btnSet">
                <el-button @click="toggleMenu()">
                  <span v-if="!isCollapse">
                    <el-icon :size="20"><DArrowLeft /></el-icon>
                  </span>
                  <span v-else>
                    <el-icon :size="20"><ArrowRight /></el-icon> 
                  </span>
                </el-button>
                <!-- menu fix button -->
                <el-button>
                  <!-- <el-icon :size="20" @click="onItemClick(item)"><Notebook /></el-icon> -->
                  <el-icon :size="20"><Lock /></el-icon>
                </el-button>
                <!-- // menu fix button -->
              </div>
            </el-menu>
          </div>
        </div>
        <div class="rgtWrap">
          <div>
            <!-- Main 화면 구성 시 Navigator 영역 숨김 -->
            <template v-if="route.meta.navigator != null">
              <div class="locationWrap fix">
                <h2>{{ route.meta.title }}</h2>
                <ul class="brc fix">
                  <li><span>HOME</span></li>
                  <li v-for="(nav, index) in route.meta.navigator" :key="nav">
                    <a v-if="(nav.href || nav.link) && index != route.meta.navigator.length - 1" @click="goToPage(nav)" style="cursor: pointer !important">{{ nav.breadcrumb }}</a>
                    <div v-else>{{ nav.breadcrumb }}</div>
                  </li>
                </ul>
              </div>
            </template>
            <Suspense>
              <router-view />
            </Suspense>
          </div>
          <content-footer></content-footer>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { ElLoading } from "element-plus";
import router from "@/router";
import util from "util";

import { getGlobalProperties, setCookie, getCookie, routerPush } from "@/assets/js/common.js";
import { getLoginUserId } from "@/assets/js/auth.js";

import ContentHeader from "@/components/layouts/ContentHeader.vue";
import ContentFooter from "@/components/layouts/ContentFooter.vue";

const properties = getGlobalProperties();
const $emitter = properties.$emitter;
const $axios = properties.$axios;
const $apiUrls = properties.$apiUrls;
const route = useRoute();

let loading = reactive({});
$emitter.on("loading", (flag) => {
  if (flag) {
    loading = ElLoading.service({
      lock: true,
      text: "Loading",
      background: "rgba(0, 0, 0, 0.7)",
    });
  } else {
    if (loading) loading.close();
  }
});

const store = useStore();
let contentCls = ref("");
let isCollapse = ref(false);
var routeMenuId = ref("");
const sideWidth = ref("250px");
const rgtWrapPadding = ref("250px");

const menu = ref([]);
const platform = ref([]);
const curPltfrm = ref("");
const choosePltfrm = ref("");

watch(() => route.meta.navigator, () => {
  try {
    for(var i=0; i<route.meta.navigator.length; i++){
      routeMenuId.value = route.meta.navigator[i].menuId;
    }
  } catch(e) {
    // TODO
  }
});

onMounted( () => {
  setPlatformList();
});

const setPlatformList =  () => {
  // TODO 임시 2024-08-21 기본 플랫폼 ID
  const defaultPltfrmId = "meta";

  store
    .dispatch("PlatformStore/getPlatformList", {
      axios: $axios,
      apiUrls: $apiUrls,
      params: { useYn: "Y" },
    })
    .then((result) => {
      for(let data of result) {
        platform.value.push(setPlatformValue(data));
      }
      let cokiplatform = getCookie("pltfrmId");

      if(cokiplatform == null && platform.value.length > 0) {
        // TODO 임시 2024-08-21 기본 플랫폼 ID 가 있다면 우선 설정.
        const foundPltfrm = platform.value.find((x) => x.pltfrmId === defaultPltfrmId);
        if (foundPltfrm) {
          setCookie("pltfrmId", foundPltfrm.pltfrmId);
        } else {
          setCookie("pltfrmId", platform.value ? platform.value[0].pltfrmId : "");
        }
        cokiplatform = getCookie("pltfrmId");
      }

      if(cokiplatform != null) {
        const pltData = platform.value.find(data => data.pltfrmId === cokiplatform);

        if(pltData == null || pltData == '') return;
        else {
          curPltfrm.value = pltData;
          choosePltfrm.value = pltData.title;
          if (route.path == '/') {
            setNavMenu(pltData.pltfrmId, pltData.mainScrnExistYn);
          } else {
            setNavMenu();
          }
          hasPopupNotice();
        }
      }
    });
}

//팝업창이 있냐 -> 백엔드로 연결해서 물어보기
const hasPopupNotice = () => {
  let pltfrmId = getCookie('pltfrmId');
  $axios
    .get(util.format($apiUrls.admin.notices.hasPopupNoticeByPltfrm, pltfrmId))
    .then((res) => {
      // console.log(res.data);
      if (res.data.length > 0) {
        for (let data of res.data) {
          let coki = getCookie('ntf' + data.ntfOid);
          if (coki) continue;
          isPopupOpen(data);
        }
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const isPopupOpen = (data) => {
  var popup = {
    x: (document.body.offsetWidth / 2) - (500 / 2),
    y: (document.body.offsetHeight / 2) - (720 / 2)
  };

  let ntfOid = data.ntfOid; // 동적으로 변경되는 noticeNo 값

  let url = `/popup?ntfOid=${ntfOid}`;

  var base = {
    name: '메인 공지사항' + ntfOid, // 고유한 이름 생성
    option: 'width=' + data.popupWdth + ', height=' + data.popupHght + ', top=' + popup.y + ', left=' + popup.x + ', status=no, scrollbars=no, resizable=no, location=no, toolbar=no',
    url: url
  };

  let popupWindow = window.open(base.url, base.name, base.option);
  // 팝업 창을 저장하여 관리
  popupWindow.focus(); // 포커스 설정
};

const clickPltfrm = (payload) =>{
  curPltfrm.value = payload;

  const pltfrmId = payload ? payload.pltfrmId : "";
  const mainScrnExistYn = payload ? payload.mainScrnExistYn : "N";

  setCookie("pltfrmId", pltfrmId);
  setNavMenu(pltfrmId, mainScrnExistYn);
  choosePltfrm.value = payload.title;

  hasPopupNotice();
}

const setPlatformValue = (data) => {
  const platform = {
      title: data.pltfrmNm,
      useYn: data.useYn,
      pltfrmId: data.pltfrmId,
      menuId: data.pltfrmId,
      odrg: data.odrg,
      menuIcon: "", // 플랫폼 아이콘 임시!!!!!!!!!!!!!!!
      mainScrnExistYn: data.mainScrnExistYn,
      child: [],
  }

  // 플랫폼 아이콘 임시!!!!!!!!!!!!!!! start
  if(platform.menuId === "meta"){
    platform.menuIcon = "Histogram"; //"HomeFilled"
  }
  // 플랫폼 아이콘 임시!!!!!!!!!!!!!!! end
  return platform;
}

const setNavMenu = (pltfrmId, mainScrnExistYn) =>{
  menu.value = [];
    store
    .dispatch("MenuStore/getUserMenuList", {
      axios: $axios,
      apiUrls: $apiUrls,
      params: {
        userId: getLoginUserId(),
        searchType: "tree",
        pltfrmId: curPltfrm.value.pltfrmId,
        typeCd: "COD_00001",
        readYn: "Y",
      },
    })
    .then((result) => {
      if (result && result.length > 0) {
        let list = getAdminMenuList(result);
        menu.value = list;
        
        if (pltfrmId) {
          if (mainScrnExistYn == "Y") {
            router.push({ path: "/"+pltfrmId});
          } 
          else {
            setFirstMenu(list);
          } 
        }
      } 
    });
}

const setFirstMenu = (menuList) => {
  if (!menuList && menuList.length == 0) return;
  let path = route.path;
  let curMenu = menuList.find(menu => {
    let chkMenuPath = path.indexOf(menu.url);
    if(chkMenuPath == 0) return menu;
  } );
  if(!curMenu) {
    let hasChildren = menuList.some(menu => Array.isArray(menu.children));
    if (hasChildren) {
      menuList.forEach(menu => {
        const childMenu = menu.children.find(child =>
        {
          let chkChildMenuPath = path.indexOf(child.url);
          if(chkChildMenuPath == 0) curMenu = child
        });
        if(childMenu) {
          curMenu = childMenu;
        }
      });
    } 
  }
  
  if(!curMenu) curMenu = menuList[0];

  // if(curMenu.href !== route.path) {
  //   curMenu.url = route.path;
  // }

  if (!curMenu.child || curMenu.child.length == 0) {
    onItemClick(curMenu);
  } else {
    setFirstMenu(curMenu.child);
  }
}

const toggleMenu = () => {
  isCollapse.value = !isCollapse.value;
  sideWidth.value = isCollapse.value ? '50px' : '250px';
  rgtWrapPadding.value = isCollapse.value ? '50px' : '250px';
  const menuElement = document.querySelector('.rgtWrap');
  if (!isCollapse.value) {
    menuElement.style.paddingLeft = '250px';
  } else {
    menuElement.style.paddingLeft = '50px';
  }
}

const getIconComponent = (icon) => {
  if(typeof icon !== "undefined" && icon !== "" && icon !== null){
    return icon;
  }
}

const getAdminMenuList = (list) => {
  let updatedList = [];
  for (let i = 0; i < list.length; i++) {
    let item = list[i];
    item.href = item.url;
    item.title = item.menuNm;
    item.param = item.urlParam;

    if (item.children.length === 0) {
      item.child = [];
      item.parent = false;
    } else {
      item.child = getAdminMenuList(item.children);
      item.parent = true;
    }
    updatedList.push(item);
  }

  return updatedList;
};

const onItemClick = (item) => {
  if (item.popupYn === "Y") {
    let _width = 1000;
    let _height = 800;
    let xPos = document.body.offsetWidth / 2 - _width / 2;
    xPos += window.screenLeft;
    let yPos = document.body.offsetHeight / 2 - _height / 2;

    window.open(
      item.href,
      "myWindow",
      `location=no, width=${_width}, height=${_height}, left=${xPos}, top=${yPos}`
    );
  } else {
    if (item.href) {
      setCookie("pltfrmId", item ? item.pltfrmId : "");
      if (item.param) {
        router.push({ path: item.url, query: { param: item.param } });
      } else {
        router.push({ path: item.url });
      }
    }
  }
  routeMenuId.value = item.menuId;
};

const goToPage = (item) => {
  if (item.href && item.param) {
    if (item.pltfrmId) setCookie("pltfrmId", item.pltfrmId);
    router.push({ path: item.href, query: { param: item.param } });
  } else if (item.href) {
    if (item.pltfrmId) setCookie("pltfrmId", item.pltfrmId);
    router.push({ path: item.href });
  } else if (item.link) {
    if (item.pltfrmId) setCookie("pltfrmId", item.pltfrmId);
    router.push({ path: item.link });
  }
};
</script>

<style lang="scss" scoped>
.el-menu--popup {
  width: 200px;
  height: 300px !important;
  overflow-y: scroll !important;
}

// .checked {
//   color: #ffffff;
//   background-color:#08A2B7;
//   width: 250px;
//   height: 42px;
//   line-height:40px;
//   font-size: 100%;
//   padding-top: 10px;
//   box-sizing:border-box;
// }

.unchecked {
  background-color:#36363b;
  width: 250px;
  height: 42px; 
}

// .pltfrm-title {
//   position: relative;
//   bottom: 5px;
//   padding: 0 0 0 5%;
  
// }

</style>
