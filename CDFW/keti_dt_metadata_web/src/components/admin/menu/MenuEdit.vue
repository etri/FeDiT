<template>
  <el-form
    ref="ruleFormRef"
    :model="state.menu"
    :rules="state.rules"
    label-width="120px"
    class="demo-ruleForm"
    :label-position="labelPosition"
    status-icon
  >
    <el-form-item label="메뉴명" prop="menuNm">
      <el-input v-model="state.menu.menuNm"></el-input>
    </el-form-item>

    <el-form-item label="메뉴 설명" prop="menuDesc">
      <el-input v-model="state.menu.menuDesc"></el-input>
    </el-form-item>

    <el-form-item label="메뉴 유형" prop="typeCd">
      <el-select
        v-model="state.menu.typeCd"
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

    <el-form-item label="상위 메뉴" prop="upMenuName">
      <el-tree-select
        v-model="state.menu.upMenuName"
        :data="menuItems"
        check-strictly
        :render-after-expand="false"
        @node-click="handleNodeClick"
        :props="defaultProps"
        default-expand-all
      >
      </el-tree-select>
    </el-form-item>

    <el-form-item label="메뉴 순서" prop="odrg">
      <el-input v-model.number="state.menu.odrg"></el-input>
    </el-form-item>

    <el-form-item label="URL" prop="menuUrl">
      <el-input v-model="state.menu.menuUrl"></el-input>
    </el-form-item>

    <el-form-item label="target" prop="menuTgtCd">
      <el-select v-model="state.menu.menuTgtCd" placeholder="선택">
        <el-option
          v-for="item in targetCodeList"
          :key="item.cdId"
          :label="item.cdNm"
          :value="item.cdId"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="파라미터" prop="urlParam">
      <el-input v-model="state.menu.urlParam"></el-input>
    </el-form-item>

    <el-form-item label="메뉴 사용 여부" prop="useYn">
      <el-checkbox
        v-model="state.menu.useYn"
        label="표시"
        name="useYn"
      ></el-checkbox>
    </el-form-item>

    <el-form-item label="메뉴 아이콘">
      <div style="margin-bottom: 60px;">
        <div v-if="state.menu.menuIcon !== '' && state.menu.menuIcon !== null" class="icon-card" style="width: 70px; height: 35px; float: left;">
          <el-icon size="16" style="margin-top: 10px;"><component :is="state.menu.menuIcon" /></el-icon>
          <span style="font-size: 10px;">{{ state.menu.menuIcon }}</span>
        </div>
        <span v-if="state.menu.menuIcon !== '' && state.menu.menuIcon !== null" style="font-size: 14px; color: #8a8a8a; display: inline-block; margin-top: 20px;">&nbsp;&nbsp;아이콘이 선택되었습니다.</span>
        <span v-if="state.menu.menuIcon === '' || state.menu.menuIcon === null" class="member-notice" style="font-size: 14px;">하단 아이콘 카드를 클릭하여 메뉴 아이콘을 선택해주세요.</span>
      </div>
      <div class="demo-collapse">
        <el-collapse>

          <el-collapse-item title="System">
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

          <el-collapse-item title="Arrow">
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
          
          <el-collapse-item title="Document">
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
          
          <el-collapse-item title="Media">
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
          
          <el-collapse-item title="Traffic">
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
          
          <el-collapse-item title="Food">
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
          
          <el-collapse-item title="Items">
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
          
          <el-collapse-item title="Weather">
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
          
          <el-collapse-item title="Other">
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
import {
  reactive,
  ref,
  onMounted,
  defineExpose,
  defineEmits,
  defineProps,
} from "vue";

const props = defineProps({
  menuItems: {
    type: Array,
    required: false,
  },
  targetCodeList: {
    type: Array,
    required: false,
  },
  typeCdList: {
    type: Array,
    required: false,
  },
});

const defaultProps = ref({
  children: "children",
  label: "menuNm",
  value: "menuNm",
});

const ruleFormRef = ref(null);
const labelPosition = ref("right");

const checkNum = (rule, value, callback) => {
  if (!value) {
    return callback(new Error("숫자를 입력해주십시오"));
  }
  setTimeout(() => {
    if (!Number.isInteger(value)) {
      callback(new Error("숫자를 입력해주십시오"));
    } else {
      callback();
    }
  }, 500);
};

const state = reactive({
  menu: {
    mnuId: "",
    menuDesc: "",
    menuNm: "",
    typeCd: "",
    upMenuOid: "",
    upMenuName: "",
    odrg: "0",
    menuUrl: "",
    menuTgtCd: "",
    urlParam: "",
    admrYn: false,
    useYn: true,
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
        trigger: "change",
      },
    ],
    upMenuName: [
      {
        required: true,
        message: "옵션을 선택해주세요.",
        trigger: "blur",
      },
    ],
    odrg: [{ validator: checkNum, trigger: "blur" }],
  },
});
const emits = defineEmits(["checkTgMenu"]);

const changeRootMenu = (data) => {
  state.menu.upMenuName = "";
  state.menu.typeCd = data;
  emits("checkTgMenu", data);
};

const handleNodeClick = (data) => {
  state.menu.upMenuOid = data.menuOid;
  state.menu.typeCd = data.typeCd;

  if (data.typeCd == "COD_00001") {
    state.menu.admrYn = true;
  } else {
    state.menu.admrYn = false;
  }
};

const selectIcon = (icon) => {
  state.menu.menuIcon = icon;
}

defineExpose({
  menu: state.menu,
  ruleFormRef: ruleFormRef,
});
</script>
<style scoped>
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
