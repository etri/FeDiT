<template>
  <div class="dialog-area">
    <!-- 프라퍼티 검색 -->
    <PropertyDialogSearchForm @searchProperty="searchProperty" />

    <div class="boxLayout">
      <div class="boxTit">
        <h3>프라퍼티 검색결과</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <PropertyDialogSearchList
            :propertyList="state.propertyList"
            :totalPage="state.pageInfo.totalListSize"
						:curPage="state.pageInfo.curPage"
						@selectedRow="selectedRow"
            @pageMove="pageMove"
          />
        </div>
      </div>
    </div> 
  </div>  
</template>
<script setup>
import PropertyDialogSearchForm from "@/components/meta/datamodel/PropertyDialogSearchForm.vue";
import PropertyDialogSearchList from "@/components/meta/datamodel/PropertyDialogSearchList.vue";
import { reactive, onMounted } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const emits = defineEmits();
const state = reactive({
  propertyList: [],
	property: {},
  pageInfo: {
    curPage: 1,
		totalListSize: 0,
  },
});

onMounted(() => {
	getPropertyList();
});

const searchProperty = (payload) => {
	  state.pageInfo.curPage = payload.curPage;
    state.pageInfo.searchName = payload.pageInfo.searchName;
    state.pageInfo.dataArrayYn = payload.pageInfo.dataArrayYn;
	getPropertyList();
};

const getPropertyList = () => {
  $axios
    .get($apiUrls.meta.data.property.getPropertyList, {
      params: {
        curPage: state.pageInfo.curPage,
        searchName: state.pageInfo.searchName,
        dataArrayYn: state.pageInfo.dataArrayYn,
        prptyDataSttusMtcd: "use",  //사용상태인것만 검색
      },
    })
    .then((res) => {
      state.propertyList = res.data.list;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getPropertyList();
};

const selectedRow = (payload) => {
	emits("selectedRow", payload);
};

</script>
<style lang="scss">
</style>