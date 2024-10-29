<template>
  <el-form
    ref="ruleFormRef"
    :model="state.menuDetail"
    :rules="state.rules"
    label-width="120px"
    class="demo-ruleForm"
    :label-position="labelPosition"
  >
    <el-form-item label="메뉴명" prop="menuNm">
      <el-input v-model="state.menuDetail.menuNm"></el-input>
    </el-form-item>

    <el-form-item label="메뉴설명" prop="menuDesc">
      <el-input v-model="state.menuDetail.menuDesc"></el-input>
    </el-form-item>

    <el-form-item label="메뉴유형" prop="typeCd">
      <el-select
        v-model="state.menuDetail.typeCd"
        @change="changeRootMenu"
        placeholder="선택"
      >
        <el-option
          v-for="item in typeCdList"
          :key="item.cdId"
          :label="item.cdNm"
          :value="item.cdId"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="상위메뉴" prop="menuNm">
      <el-tree-select
        v-model="state.menuDetail.upMenuName"
        :data="menuItems"
        check-strictly
        :render-after-expand="false"
        @node-click="handleNodeClick"
        :props="defaultProps"
      >
      </el-tree-select>
    </el-form-item>

    <el-form-item label="메뉴 순서" prop="odrg">
      <el-input v-model="state.menuDetail.odrg"></el-input>
    </el-form-item>

    <el-form-item label="URL" prop="menuUrl">
      <el-input v-model="state.menuDetail.menuUrl"></el-input>
    </el-form-item>

    <el-form-item label="target" prop="menuTgtCd">
      <el-select
        v-model="state.menuDetail.menuTgtCd"
        @change="changeTgCd"
        placeholder="선택"
      >
        <el-option
          v-for="item in targetCodeList"
          :key="item.cdId"
          :label="item.cdNm"
          :value="item.cdId"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="파라미터" prop="urlParam">
      <el-input v-model="state.menuDetail.urlParam"></el-input>
    </el-form-item>

    <el-form-item label="메뉴 표시 여부" prop="useYn">
      <el-checkbox
        v-model="state.menuDetail.useYn"
        label="표시"
        name="useYn"
      ></el-checkbox>
    </el-form-item>

    <el-form-item label="메뉴 아이콘">
      <div style="margin-bottom: 60px;">
        <div v-if="state.menuDetail.menuIcon !== '' && state.menuDetail.menuIcon !== null" class="icon-card" style="width: 70px; height: 35px; float: left;">
          <el-icon size="16" style="margin-top: 10px;"><component :is="state.menuDetail.menuIcon" /></el-icon>
          <span style="font-size: 10px;">{{ state.menuDetail.menuIcon }}</span>
        </div>
        <span v-if="state.menuDetail.menuIcon !== '' && state.menuDetail.menuIcon !== null" style="font-size: 14px; color: #8a8a8a; display: inline-block; margin-top: 20px;">&nbsp;&nbsp;아이콘이 선택되었습니다.</span>
        <span v-if="state.menuDetail.menuIcon === '' || state.menuDetail.menuIcon === null" class="member-notice" style="font-size: 14px;">하단 아이콘 카드를 클릭하여 메뉴 아이콘을 선택해주세요.</span>
      </div>
      <div class="demo-collapse">
        <el-collapse v-model="activeName">

          <el-collapse-item title="System" name="System">
            <div class="icon-collection">
              <el-row>
                <el-col :span="3" v-for="icon in state.menuIconJson.System" :key="icon">
                  <div class="icon-card" @click="selectIcon(icon)">
                    <el-icon size="20"><component :is="icon" /></el-icon>
                    <span class="icon-name">{{ icon }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-collapse-item>

          <el-collapse-item title="Arrow" name="Arrow">
            <div class="icon-collection">
              <el-row>
                <el-col :span="3" v-for="icon in state.menuIconJson.Arrow" :key="icon">
                  <div class="icon-card" @click="selectIcon(icon)">
                    <el-icon size="20"><component :is="icon" /></el-icon>
                    <span class="icon-name">{{ icon }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-collapse-item>

          <el-collapse-item title="Document" name="Document">
            <div class="icon-collection">
              <el-row>
                <el-col :span="3" v-for="icon in state.menuIconJson.Document" :key="icon">
                  <div class="icon-card" @click="selectIcon(icon)">
                    <el-icon size="20"><component :is="icon" /></el-icon>
                    <span class="icon-name">{{ icon }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-collapse-item>

          <el-collapse-item title="Media" name="Media">
            <div class="icon-collection">
              <el-row>
                <el-col :span="3" v-for="icon in state.menuIconJson.Media" :key="icon">
                  <div class="icon-card" @click="selectIcon(icon)">
                    <el-icon size="20"><component :is="icon" /></el-icon>
                    <span class="icon-name">{{ icon }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-collapse-item>

          <el-collapse-item title="Traffic" name="Traffic">
            <div class="icon-collection">
              <el-row>
                <el-col :span="3" v-for="icon in state.menuIconJson.Traffic" :key="icon">
                  <div class="icon-card" @click="selectIcon(icon)">
                    <el-icon size="20"><component :is="icon" /></el-icon>
                    <span class="icon-name">{{ icon }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-collapse-item>

          <el-collapse-item title="Food" name="Food">
            <div class="icon-collection">
              <el-row>
                <el-col :span="3" v-for="icon in state.menuIconJson.Food" :key="icon">
                  <div class="icon-card" @click="selectIcon(icon)">
                    <el-icon size="20"><component :is="icon" /></el-icon>
                    <span class="icon-name">{{ icon }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-collapse-item>

          <el-collapse-item title="Items" name="Items">
            <div class="icon-collection">
              <el-row>
                <el-col :span="3" v-for="icon in state.menuIconJson.Items" :key="icon">
                  <div class="icon-card" @click="selectIcon(icon)">
                    <el-icon size="20"><component :is="icon" /></el-icon>
                    <span class="icon-name">{{ icon }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-collapse-item>

          <el-collapse-item title="Weather" name="Weather">
            <div class="icon-collection">
              <el-row>
                <el-col :span="3" v-for="icon in state.menuIconJson.Weather" :key="icon">
                  <div class="icon-card" @click="selectIcon(icon)">
                    <el-icon size="20"><component :is="icon" /></el-icon>
                    <span class="icon-name">{{ icon }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-collapse-item>

          <el-collapse-item title="Other" name="Other">
            <div class="icon-collection">
              <el-row>
                <el-col :span="3" v-for="icon in state.menuIconJson.Other" :key="icon">
                  <div class="icon-card" @click="selectIcon(icon)">
                    <el-icon size="20"><component :is="icon" /></el-icon>
                    <span class="icon-name">{{ icon }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-collapse-item>

          </el-collapse>
      </div>
    </el-form-item>

  </el-form>
</template>

<script setup>
import { computed, reactive, onMounted, ref, defineExpose } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { getGlobalProperties, getCookie } from "@/assets/js/common.js";
import { getLoginUserId } from "@/assets/js/auth.js";
import util from "util";

const route = useRoute();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const defaultProps = ref({
  children: "children",
  label: "menuNm",
  value: "menuNm",
});

const menuItems = ref([]);
const ruleFormRef = ref(null);
const labelPosition = ref("right");
const activeName = ref("");

const state = reactive({
  menuDetail: {
    menuOid: "",
    menuId: "",
    menuNm: "",
    typeCd: "",
    upMenuOid: "",
    upMenuName: "",
    chkMenuOid: "",
    rootMenuOid: "",
    odrg: "0",
    menuUrl: "",
    menuTgtCd: "",
    tgtCdNm: "",
    urlParam: "",
    admrYn: false,
    useYn: false,
    menuIcon: "",
  },
  menuIconJson: {
    "System": ["Plus", "Minus", "CirclePlus", "Search", "Female", "Male", "Aim", "House", "FullScreen", "Loading", "Link", "Service", "Pointer", "Star", "Notification", "Connection", "ChatDotRound", "Setting", "Clock", "Position", "Discount", "Odometer", "ChatSquare", "ChatRound", "ChatLineRound", "ChatLineSquare", "ChatDotSquare", "View", "Hide", "Unlock", "Lock", "RefreshRight", "RefreshLeft", "Refresh", "Bell", "MuteNotification", "User", "Check", "CircleCheck", "Warning", "CircleClose", "Close", "PieChart", "More", "Compass", "Filter", "Switch", "Select", "SemiSelect", "CloseBold", "EditPen", "Edit", "Message", "MessageBox", "TurnOff", "Finished", "Delete", "Crop", "SwitchButton", "Operation", "Open", "Remove", "ZoomOut", "ZoomIn", "InfoFilled", "CircleCheckFilled", "SuccessFilled", "WarningFilled", "CircleCloseFilled", "QuestionFilled", "WarnTriangleFilled", "UserFilled", "MoreFilled", "Tools", "HomeFilled", "Menu", "UploadFilled", "Avatar", "HelpFilled", "Share", "StarFilled", "Comment", "Histogram", "Grid", "Promotion", "DeleteFilled", "RemoveFilled", "CirclePlusFilled"],
    "Arrow": ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeftBold", "ArrowUpBold", "ArrowRightBold", "ArrowDownBold", "DArrowRight", "DArrowLeft", "Download", "Upload", "Top", "Bottom", "Back", "Right", "TopRight", "TopLeft", "BottomRight", "BottomLeft", "Sort", "SortUp", "SortDown", "Rank", "CaretLeft", "CaretTop", "CaretRight", "CaretBottom", "DCaret", "Expand", "Fold"],
    "Document": ["DocumentAdd", "Document", "Notebook", "Tickets", "Memo", "Collection", "Postcard", "ScaleToOriginal", "SetUp", "DocumentDelete", "DocumentChecked", "DataBoard", "DataAnalysis", "CopyDocument", "FolderChecked", "Files", "Folder", "FolderDelete", "FolderRemove", "FolderOpened", "DocumentCopy", "DocumentRemove", "FolderAdd", "FirstAidKit", "Reading", "DataLine", "Management", "Checked", "Ticket", "Failed", "TrendCharts", "List"],
    "Media": ["Microphone", "Mute", "Mic", "VideoPause", "VideoCamera", "VideoPlay", "Headset", "Monitor", "Film", "Camera", "Picture", "PictureRounded", "Iphone", "Cellphone", "VideoCameraFilled", "PictureFilled", "Platform", "CameraFilled", "BellFilled"],
    "Traffic": ["Location", "LocationInformation", "DeleteLocation", "Coordinate", "Bicycle", "OfficeBuilding", "School", "Guide", "AddLocation", "MapLocation", "Place", "LocationFilled", "Van"],
    "Food": ["Watermelon", "Pear", "NoSmoking", "Smoking", "Mug", "GobletSquareFull", "GobletFull", "KnifeFork", "Sugar", "Bowl", "MilkTea", "Lollipop", "Coffee", "Chicken", "Dish", "IceTea", "ColdDrink", "CoffeeCup", "DishDot", "IceDrink", "IceCream", "Dessert", "IceCreamSquare", "ForkSpoon", "IceCreamRound", "Food", "HotWater", "Grape", "Fries", "Apple", "Burger", "Goblet", "GobletSquare", "Orange", "Cherry"],
    "Items": ["Printer", "Calendar", "CreditCard", "Box", "Money", "Refrigerator", "Cpu", "Football", "Brush", "Suitcase", "SuitcaseLine", "Umbrella", "AlarmClock", "Medal", "GoldMedal", "Present", "Mouse", "Watch", "QuartzWatch", "Magnet", "Help", "Soccer", "ToiletPaper", "ReadingLamp", "Paperclip", "MagicStick", "Basketball", "Baseball", "Coin", "Goods", "Sell", "SoldOut", "Key", "ShoppingCart", "ShoppingCartFull", "ShoppingTrolley", "Phone", "Scissor", "Handbag", "ShoppingBag", "Trophy", "TrophyBase", "Stopwatch", "Timer", "CollectionTag", "TakeawayBox", "PriceTag", "Wallet", "Opportunity", "PhoneFilled", "WalletFilled", "GoodsFilled", "Flag", "BrushFilled", "Briefcase", "Stamp"],
    "Weather": ["Sunrise", "Sunny", "Ship", "MostlyCloudy", "PartlyCloudy", "Sunset", "Drizzling", "Pouring", "Cloudy", "Moon", "MoonNight", "Lightning"],
    "Other": ["ChromeFilled", "Eleme", "ElemeFilled", "ElementPlus", "Shop", "SwitchFilled", "WindPower"]
  },
  rules: {
    menuNm: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "내용 입력",
        trigger: "blur",
      },
    ],
    typeCd: {
      required: true,
      message: "내용을 입력하세요.",
      trigger: "blur",
    },
    useYn: {
      required: true,
      message: "메뉴 표시 여부를 확인해주세요.",
      trigger: "blur",
    },
    menuTgtCd: [
      {
        required: true,
        message: "옵션을 선택해주세요.",
        trigger: "choose",
      },
      {
        min: 0,
        message: "내용 입력",
        trigger: "blur",
      },
    ],
    upMenuName: [
      {
        required: true,
        message: "옵션을 선택해주세요.",
        trigger: "blur",
      },
    ],
  },
});

onMounted(async () => {
  await getCodeList();
  await getMenuDetail();
  
  for(var i=0; i<state.menuIconJson.System.length; i++){
    if(state.menuIconJson.System[i] == state.menuDetail.menuIcon) activeName.value = "System";
  }
  for(var i=0; i<state.menuIconJson.Arrow.length; i++){
    if(state.menuIconJson.Arrow[i] == state.menuDetail.menuIcon) activeName.value = "Arrow";
  }
  for(var i=0; i<state.menuIconJson.Document.length; i++){
    if(state.menuIconJson.Document[i] == state.menuDetail.menuIcon) activeName.value = "Document";
  }
  for(var i=0; i<state.menuIconJson.Media.length; i++){
    if(state.menuIconJson.Media[i] == state.menuDetail.menuIcon) activeName.value = "Media";
  }
  for(var i=0; i<state.menuIconJson.Traffic.length; i++){
    if(state.menuIconJson.Traffic[i] == state.menuDetail.menuIcon) activeName.value = "Traffic";
  }
  for(var i=0; i<state.menuIconJson.Food.length; i++){
    if(state.menuIconJson.Food[i] == state.menuDetail.menuIcon) activeName.value = "Food";
  }
  for(var i=0; i<state.menuIconJson.Items.length; i++){
    if(state.menuIconJson.Items[i] == state.menuDetail.menuIcon) activeName.value = "Items";
  }
  for(var i=0; i<state.menuIconJson.Weather.length; i++){
    if(state.menuIconJson.Weather[i] == state.menuDetail.menuIcon) activeName.value = "Weather";
  }
  for(var i=0; i<state.menuIconJson.Other.length; i++){
    if(state.menuIconJson.Other[i] == state.menuDetail.menuIcon) activeName.value = "Other";
  }

  console.log(state.menuDetail.menuIcon);
  console.log(activeName.value);
});

const getCodeList = async () =>
  await store.dispatch("CodeStore/getCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      grpIdList: ["CGR00055", "CGR00001"],
    },
  });

const getMenuList = async (data) => {
  let menu = await store.dispatch("MenuStore/getMenuList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      pltfrmId: getCookie("pltfrmId"),
      userId: getLoginUserId(),
      searchType: "tree",
      typeCd: data,
    },
  });

  let defaultData = {
    menuNm: "--선택--",
    menuOid: 0,
    typeCd: data,
  };
  menu.unshift(defaultData);
  menuItems.value = menu;
};

const getMenuDetail = async () => {
  let menuOid = route.query.menuOid;
  await $axios
    .get(util.format($apiUrls.menu.getMenuDetail, menuOid))
    .then((res) => {
      state.menuDetail = res.data;
      state.menuDetail.menuTgtCd = res.data.tgtCdVal;
      res.data.admrYn == "Y"
        ? (state.menuDetail.admrYn = true)
        : (state.menuDetail.admrYn = false);
      res.data.useYn == "Y"
        ? (state.menuDetail.useYn = true)
        : (state.menuDetail.useYn = false);

      let findTypeCd = typeCdList.value.findIndex(
        (item) => item.cdId === res.data.typeCd
      );
      if (findTypeCd != -1)
        state.menuDetail.typeCd = typeCdList.value[findTypeCd].cdId;
      getMenuList(res.data.typeCd);
    })
    .catch((err) => {
      console.log(err);
    });
};

const targetCodeList = computed(() =>
  store.getters["CodeStore/getStoreCodeList"]("CGR00055")
);
const typeCdList = computed(() =>
  store.getters["CodeStore/getStoreCodeList"]("CGR00001")
);

//메뉴 클릭 시 관리자 메뉴 여부도 체크 될 수 있도록 확인
const handleNodeClick = (data) => {
  state.menuDetail.upMenuOid = data.menuOid;
  state.menuDetail.typeCd = data.typeCd;

  if (data.typeCd == "COD_00001") {
    state.menuDetail.admrYn = true;
  } else {
    state.menuDetail.admrYn = false;
  }
};

const changeRootMenu = async (data) => {
  state.menuDetail.upMenuName = "";
  state.menuDetail.typeCd = data;
  menuItems.value = [];
  let menu = await store.dispatch("MenuStore/getMenuList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      pltfrmId: getCookie("pltfrmId"),
      userId: getLoginUserId(),
      searchType: "tree",
      typeCd: data,
    },
  });

  let defaultData = {
    menuNm: "--선택--",
    menuOid: 0,
    typeCd: data,
  };
  menu.unshift(defaultData);
  menuItems.value = menu;
};

const changeTgCd = (data) => {
  state.menuDetail.menuTgtCd = data;
};

const selectIcon = (icon) => {
  state.menuDetail.menuIcon = icon;
}

defineExpose({
  data: state,
  ruleFormRef: ruleFormRef,
});
</script>
<style lang="scss">
.icon-collection {
  margin: 20px;
}

.icon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.icon-card:hover {
  background-color: #f0f0f0;
}

.icon-name {
  margin-top: 10px;
  font-size: 12px;
}
</style>
