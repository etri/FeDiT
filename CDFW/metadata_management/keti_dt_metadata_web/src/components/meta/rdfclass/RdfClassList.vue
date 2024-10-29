<template>
  <div class="boxLayout">
    <div class="boxTit"><h3>RDF 클래스 목록</h3></div>
    <div class="boxCnt">
      <ComnList
        :tableHeader="tableHeader"
        :tableData="rdfClassList"
        @row-click="rowClick"
      >
        <template v-slot:btnModify="slotData">
          <el-button type="primary" size="small"
            @click="() => handleClickModify(slotData.$index)"
            >관리</el-button
          >
        </template>
      </ComnList>
      <ComnPagination
        :totalPage="totalPage"
        :curPage="curPage"
        @pagemove="pagemove"
      />
    </div>
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import RdfClassSearchForm from "@/components/meta/rdfclass/RdfClassSearchForm.vue";
import { ref, defineProps, defineEmits, reactive, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { getUser } from "@/assets/js/auth.js";
import {
  getCookie,
  getGlobalProperties,
  routerPush,
} from "@/assets/js/common.js";

const props = defineProps({
  rdfClassList: {

    type: Array,
    required: true,
  },
  totalPage: { // rdfClassList
    type: Number,
    required: true,
  },
  curPage: { // rdfClassList
    type: Number,
    required: true,
  },
  rdfNmspList: {
    type: Array,
    required: true,
  },
  rdfFormMtcdList: {
    type: Array,
    required: true,
  },
});

const state = reactive({
  rdfClass: { // 수정할 rdfClass
    rdfClassId: "",
    rdfNmspId: "",
    rdfClassNm: "",
    rdfClassDesc: "",
    rdfClassLogicNm: "",
    rdfClass: "",
    upRdfClassId: "",
    rdfClassIri: "",
    rdfClassRegrId: "",
    rdfClassRegrNm: "",
    rdfClassRegDt: "",
    rdfClassAmdrId: "",
    rdfClassAmdrNm: "",
    rdfClassAmdDt: "",
    rdfClassRegrInfo: "",
    rdfClassAmdrInfo: "",
  },
  /** 상위 RDF 클래스 검색 팝업창 Info **/
  searchInfo: {},
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  },
  rdfClassList: [],
});

const tableHeader = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 40,
    align: "center",
  },
  {
    prop: "rdfClassNm",
    label: "RDF 클래스 명 (물리명)",
    width: 120,
  },
  {
    prop: "rdfClassLogicNm",
    label: "RDF 클래스 논리명",
    width: 120,
  },
  {
    prop: "rdfClass", // rdfNmspPfix + ':' +  rdfClassNm
    label: "RDF 클래스",
    width: 140,
  },
  {
    prop: "rdfFormMtcdNmStr", // DB에서 조회한 배열 데이터를 콤마로 이어붙여서 string으로 변환
    label: "RDF 매핑 형식",
    width: 150,
  },
  {
    prop: "rdfClassAmdDt",
    label: "수정일",
    width: 90,
  },
  {
    prop: "btnModify",
    label: "관리",
    width: 60,
    columnType: "custom",
  },
]);

const emits = defineEmits(["pageMove"]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const handleClickModify = (index) => {
  rdfClassId = props.rdfClassList[index].rdfClassId;
  let platform = getCookie("pltfrmId");
  let query = {
    rdfClassId: rdfClassId,
  };
  routerPush(platform, "RdfClassDetailPage", query);
};

let rdfClassId = "";

// 상위 RDF 클래스
const pageMove = (curPage) => {
  state.pageInfo.curPage = curPage;
  getUpRdfClassList();
};

const rowClick = (data) => {};

const store = useStore();

watch(
  state.rdfClass,
  (crr) => {
    console.log(crr);
    store.commit("MetaStore/setRdfClass", crr.rdfClass);
  },
  { deep: true }
);

watch(
  () => store.getters["MetaStore/getRdfClass"],
  (crr) => {},
  { deep: true }
);

</script>
<style lang="scss"></style>