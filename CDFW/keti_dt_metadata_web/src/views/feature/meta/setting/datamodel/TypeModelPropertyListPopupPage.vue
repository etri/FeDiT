<template>
  <!-- <div class="boxLayout"> -->
  <div class="dialog-area">
    <TypeModelPropertyPopupSearchForm
      :searchMode="searchMode"
      :searchModelDisabled="searchModelDisabled"
      :modelId="modelId"
      :modelNm="modelNm"
      @searchModelProperty="searchModelProperty"
    />
    <TypeModelPropertyPopupList
      :modelPropertyList="state.modelPropertyList"
      :totalPage="state.pageInfo.totalListSize"
      :curPage="state.pageInfo.curPage"
      :searchMode="searchMode"
      :modelId="modelId"
      :modelNm="modelNm"
      @selectedRow="selectedRow"
      @pageMove="pageMove"
    />
  </div>
</template>
<script setup>
import TypeModelPropertyPopupSearchForm from "@/components/meta/datamodel/TypeModelPropertyPopupSearchForm.vue";
import TypeModelPropertyPopupList from "@/components/meta/datamodel/TypeModelPropertyPopupList.vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";
import dayjs from "dayjs";

const router = useRouter();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const emits = defineEmits(["selectedRow"]);

const state = reactive({
  modelPropertyList: [],
  searchInfo: {},
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  },
});

const props = defineProps({
  searchMode: {
    type: String,
    required: false
  },
  searchModelDisabled:{
    type: String,
  },
  modelId: {
    type: String,
  },
  modelNm: {
    type: String,
  }
});

onMounted(() => {
  getModelPropertyList();
});

watch(() => props.modelId, () => {
  getModelPropertyList();
});


const searchModelProperty = (payload) => {
  state.pageInfo = {
    curPage: 1,
  };
  state.searchInfo = payload;
};

const getModelPropertyList = () => {
  if(props.searchMode === "all"){
  }
  if(props.searchMode === "model"){
    state.searchInfo.modelId = props.modelId;
  }
  let param = Object.assign({}, state.pageInfo, state.searchInfo);
  console.log(param);
  $axios
    .get(util.format($apiUrls.meta.data.model.getModelPropertyList, props.modelId), {
      params: param,
    })
    .then((res) => {
      state.pageInfo.totalListSize = res.data.page.totalListSize;
      state.modelPropertyList = res.data.list;
    })
    .catch((err) => {
      console.log(err);
    });
};

const pageMove = (curPage) => {
  state.pageInfo.curPage = curPage;
  getModelPropertyList();
};

const selectedRow = (payload) => {
  emits("selectedRow", payload);
};

</script>
<style lang="scss"></style>