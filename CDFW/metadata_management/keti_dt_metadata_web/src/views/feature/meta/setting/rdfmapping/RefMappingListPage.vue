<template>
  <div class="cntSec">
    
    <!-- RDF 매핑 검색 -->
    <RdfMappingSearchForm @searchRdfMapping="searchRdfMapping" />

    <div class="boxLayout">
      <div class="boxTit">
        <h3>RDF 매핑 검색 결과</h3>
      </div>
      <div class="boxCnt">
        <div style="overflow-x: hidden; overflow-y: auto">
          <RdfMappingList
            :rdfMappingList="state.rdfMappingList"
            :totalPage="state.pageInfo.totalListSize"
            :curPage="state.pageInfo.curPage"
            @pageMove="pageMove"
          />
        </div>
      </div>
    </div>
  </div>

</template>
<script setup>
import RdfMappingSearchForm from "@/components/meta/rdfmapping/RdfMappingSearchForm.vue";
import RdfMappingList from "@/components/meta/rdfmapping/RdfMappingList.vue";

import { onMounted, reactive, computed } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import { useRouter } from "vue-router";
import { getUser } from "@/assets/js/auth.js";
import { useStore } from "vuex";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const store = useStore();
const router = useRouter();
const user = getUser();

const state = reactive({
  rdfMappingList: [],
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
    blockSize: 5,
    mapping: {
      rdfFormMtcd: "dcat",
      typeModelId: "",
      rdfMappgYn: "",
    },
  },
});

onMounted(() => {
  getRdfMappingList();
});

const getRdfMappingList = () => {
  $axios
    .get($apiUrls.meta.rdf.mapping.getMappingList, {
      params: {
        curPage: state.pageInfo.curPage,
        rdfFormMtcd: state.pageInfo.mapping.rdfFormMtcd,
        typeModelId: state.pageInfo.mapping.typeModelId,
        rdfMappgYn: state.pageInfo.mapping.rdfMappgYn,
      },
    })
    .then((res) => {
      for (var i = 0; i < res.data.list.length; i++) {
        if (res.data.list[i].rdfClass !== null) {
          res.data.list[i].rdfMappingModel = res.data.list[i].rdfClass
            .split(",")
            .join("\n");
        } else {
          res.data.list[i].rdfMappingModel = null;
        }
      }
      state.rdfMappingList = res.data.list;
      state.pageInfo.totalListSize = res.data.page.totalListSize;
    })
    .catch((err) => {
      console.log(err);
    });
};

const pageMove = (payload) => {
  state.pageInfo.curPage = payload;
  getRdfMappingList();
};

const searchRdfMapping = (payload) => {
  state.pageInfo.mapping = payload.pageInfo;
  state.pageInfo.curPage = payload.curPage;

  getRdfMappingList();
};
</script>
<style lang="scss"></style>
