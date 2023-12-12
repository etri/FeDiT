<template>
  <li v-if="visible">
    <el-popover placement="bottom" :width="400" trigger="click">
      <template #reference>
        <el-icon :size="20" :class="`icon-height ${ state.unconfirmedPageInfo.totalListSize > 0 ? 'check-alarm' : '' }`"><BellFilled /></el-icon>
      </template>
      <template #default>
        <div><span class="link-guide-text">■ {{ state.unconfirmedPageInfo.totalListSize }}건의 알림이 있습니다.</span></div>
        <!-- comm list 컴포넌트 미적용. ul > li 구조로 data list 출력 -->
        <div class="listTable">
          <el-row>
            <el-col :span="24">
              <ul>
                <li class="list-row" v-for="item in state.unconfirmedList" :key="item">
                  <div class="list-col">
                    <div v-if="item.notifcLinkUrl" class="list-title link-text" @click="clickConfirm( item )">
                      <span v-html="item.notifcMsg" ></span>
                    </div>
                    <div v-else="item.notifcLinkUrl" class="list-title inline-area">
                      <div><span v-html="item.notifcMsg" ></span></div>       
                      <div class="ml15"><el-button type="default" @click="clickConfirm( item )">확인</el-button></div>                                             
                    </div>
                    <ul class="list-info">
                      <li class="dt">등록</li>
                      <li class="dd">{{ item.notifcRegDt }}</li>
                    </ul>
                  </div>
                </li>
              </ul>
            </el-col>
          </el-row>
          <el-row v-show="state.unconfirmedList.length == 0">
            <el-col :span="24">
              <ul>
                <li class="list-row-empty">데이터 없음</li>
              </ul>
            </el-col>
          </el-row>
        </div>
      </template>
    </el-popover>

  </li>
</template>

<script setup>
import { ref, defineProps, onMounted, reactive, nextTick, getCurrentInstance } from "vue";
import { getGlobalProperties, getCookie } from "@/assets/js/common.js";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;

const popoverVisible = ref(false);

const props = defineProps({
  visible: {
    type: Boolean,
    required: false,
    default: true
  },
});

const state = reactive({
  unconfirmedList: [],
  unconfirmedPageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 5, // 5개만
  }
});

onMounted(() => {
  nextTick(() => {
    if (props.visible) {
      getUnconfirmedList();
      $emitter.on("Alarm.onNotifcChanged", () => {    
        getUnconfirmedList();
      });
    }
  });
});

const getUnconfirmedList = () => {
  $axios.get($apiUrls.meta.portal.mypage.getMyNotifcList, {
      params: state.unconfirmedPageInfo
    })
    .then((res) => {
      state.unconfirmedList = res.data.list.map(x => {
        x.notifcMsg = x.notifcMsg.replaceAll("\n", "<br>");
        return x;
      });
      state.unconfirmedPageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const clickConfirm = (item) => {
  const notifcId = item.notifcId;
  const notifcIdList = [ notifcId ];
  saveMyConfirmedNotifc(notifcIdList, item.notifcLinkUrl);
}

const saveMyConfirmedNotifc = (notifcIdList, linkUrl) => {
  if (!notifcIdList || notifcIdList.length == 0) return;

  $axios.put($apiUrls.meta.portal.mypage.getMyNotifcConfirmedList, notifcIdList)
    .then(() => {
      if (linkUrl) {
        getUnconfirmedList();
        goToLinkPage(linkUrl);
      } else {
        getUnconfirmedList();
      }
    })
    .catch((err) => {
      console.log(err);
      if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
        alert(err.response.data.message);
      } else {
        alert("확인에 실패하였습니다.");
      }
    });
}

const goToLinkPage = (linkUrl) => {
	if (linkUrl) router.push(linkUrl);
};

const clickIcon = () => {
  getUnconfirmedList();
}

</script>

<style lang="scss" scoped>
.icon-height{
  top: 6px;
}
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