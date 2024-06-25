<template>
  <div class="dialog-area">
    <IdSchmDtSearchForm
      :idSchmType="idSchmType"
      :lctgCodeList="state.lctgCodeList"
      @searchIdSchemeCodeList="searchIdSchemeCodeList"
    />

    <div class="boxLayout">
      <div class="boxTit">
        <h3>식별체계 코드 검색 결과</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <IdSchmDtSearchList
            :idSchemeCodeList="state.idSchemeCodeList"
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
import IdSchmDtSearchList from "@/components/meta/idshemecommon/IdSchmDtSearchList.vue";
import IdSchmDtSearchForm from "@/components/meta/idshemecommon/IdSchmDtSearchForm.vue";

import { getGlobalProperties, isWriteYn } from "@/assets/js/common.js";
import {
  ref,
  toRefs,
  reactive,
  onMounted,
  getCurrentInstance,
  computed,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";

const store = useStore();
const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const emits = defineEmits(["selectedRow"]);
const props = defineProps({
  idSchmType: {
    type: String,
    required: false,
  },
});

const state = reactive({
  idSchemeCodeList: [],
  lctgCodeList: [],
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
  },
});

const propsRefs = toRefs(props);
watch(
  [propsRefs.idSchmType],
  () => {
    onChangedProps();
    if(props.idSchmType === "01") {
      getIdSchemeStdIndLctgCodeList();
    }
    if(props.idSchmType === "02") {
      getIdSchemePubRiLctgCodeList();
    }
  }
);

onMounted(() => {
  onChangedProps();
  if(props.idSchmType === "01") {
    getIdSchemeStdIndLctgCodeList();
  }
  if(props.idSchmType === "02") {
    getIdSchemePubRiLctgCodeList();
  }
});

const onChangedProps = () => {
  state.pageInfo.curPage = 1;
  state.searchType = "1";
  state.searchWord = "";
  state.pageInfo.lctgExtrCd = "";
  state.pageInfo.idSchmCdNm = "";
  state.pageInfo.idSchmCd = "";

  getIdSchemeCodeList();
};

const searchIdSchemeCodeList = (payload) => {
  state.pageInfo.curPage = payload.pageInfo.curPage;
  state.pageInfo.lctgExtrCd = payload.pageInfo.lctgExtrCd;
  if(payload.pageInfo.searchType === "1") {
    state.pageInfo.idSchmCdNm = payload.pageInfo.searchWord;
    state.pageInfo.idSchmCd = "";
  }
  if(payload.pageInfo.searchType === "2") {
    state.pageInfo.idSchmCdNm = "";
    state.pageInfo.idSchmCd = payload.pageInfo.searchWord;
  }

  getIdSchemeCodeList();
};
const getIdSchemeCodeList = () => {
  if(props.idSchmType === "01") { // 표준산업분류체계
    $axios
    .get($apiUrls.meta.schema.idschemecode.getIdSchemeStdIndCodeList, {
        params: {
          curPage: state.pageInfo.curPage,
          lctgExtrCd: state.pageInfo.lctgExtrCd,
          idSchmCdNm: state.pageInfo.idSchmCdNm,
          idSchmCd: state.pageInfo.idSchmCd,
          idfyUseYn: 'Y',
          useYn: 'Y'
        },
      })
      .then((res) => {
        state.idSchemeCodeList = res.data.list;
        state.pageInfo.totalListSize = res.data.page.totalListSize;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  if(props.idSchmType === "02") { // 공공자원분류체계
    $axios
    .get($apiUrls.meta.schema.idschemecode.getIdSchemePubRiCodeList, {
        params: {
          curPage: state.pageInfo.curPage,
          lctgExtrCd: state.pageInfo.lctgExtrCd,
          idSchmCdNm: state.pageInfo.idSchmCdNm,
          idSchmCd: state.pageInfo.idSchmCd,
          idfyUseYn: 'Y',
          useYn: 'Y'
        },
      })
      .then((res) => {
        state.idSchemeCodeList = res.data.list;
        state.pageInfo.totalListSize = res.data.page.totalListSize;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  if(props.idSchmType === "1") { // 물품
    $axios
    .get($apiUrls.meta.schema.idschemecode.getIdSchemeProductCodeList, {
        params: {
          curPage: state.pageInfo.curPage,
          idSchmCdNm: state.pageInfo.idSchmCdNm,
          idSchmCd: state.pageInfo.idSchmCd,
          idfyUseYn: 'Y',
          useYn: 'Y'
        },
      })
      .then((res) => {
        state.idSchemeCodeList = res.data.list;
        state.pageInfo.totalListSize = res.data.page.totalListSize;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  if(props.idSchmType === "2") { // 시설
    $axios
    .get($apiUrls.meta.schema.idschemecode.getIdSchemeFacilityCodeList, {
        params: {
          curPage: state.pageInfo.curPage,
          idSchmCdNm: state.pageInfo.idSchmCdNm,
          idSchmCd: state.pageInfo.idSchmCd,
          idfyUseYn: 'Y',
          useYn: 'Y'
        },
      })
      .then((res) => {
        state.idSchemeCodeList = res.data.list;
        state.pageInfo.totalListSize = res.data.page.totalListSize;
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

const getIdSchemeStdIndLctgCodeList = () => {
	$axios
		.get($apiUrls.meta.schema.idschemecode.getIdSchemeStdIndLctgCodeList)
		.then((res) => {
			state.lctgCodeList = res.data;
		})
		.catch((err) => {
			console.log(err);
		});
};

const getIdSchemePubRiLctgCodeList = () => {
	$axios
		.get($apiUrls.meta.schema.idschemecode.getIdSchemePubRiLctgCodeList)
		.then((res) => {
			state.lctgCodeList = res.data;
		})
		.catch((err) => {
			console.log(err);
		});
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getIdSchemeCodeList();
};

const selectedRow = (payload) => {
  emits("selectedRow", payload);
};
</script>
<style lang="scss"></style>