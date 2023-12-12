<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>RDF 매핑 검색</h3>
      <div class="btnSec taR">
        <el-button type="primary" @click="getRdfMappingList(1)">검색</el-button>
      </div>
    </div>

    <div class="boxCnt">
      <el-form label-position="left"
        :inline="true"
        :model="pageInfo"
        class="demo-form-inline"
        label-width="150px"
      >
        <el-form-item label="RDF 매핑 형식" style="margin-left: 21px">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-select v-model="pageInfo.rdfFormMtcd" placeholder="선택">
                <el-option
                  v-for="item in rdfFormMtcdList"
                  :key="item.mtcdNm"
                  :label="item.mtcdNm"
                  :value="item.mtcd"
                />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="메타데이터 유형" style="margin-left: 21px">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-select v-model="pageInfo.typeModelId" placeholder="선택">
                <el-option label="전체" value="" />
                <el-option
                  v-for="item in typeModelList"
                  :key="item.modelId"
                  :label="`${item.modelNm} ${item.modelLogicNm}`"
                  :value="item.modelId"
                />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>

      <el-form label-position="left"
        :inline="true"
        :model="pageInfo"
        class="demo-form-inline"
        label-width="150px"
      >
        <el-form-item label="매핑 여부" style="margin-left: 21px">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-select v-model="pageInfo.rdfMappgYn" placeholder="선택">
                <el-option label="전체" value="" />
                <el-option label="Y" value="Y" />
                <el-option label="N" value="N" />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import { onMounted, reactive, defineEmits, ref } from "vue";
import { getUser } from "@/assets/js/auth.js";
import { getGlobalProperties } from "@/assets/js/common.js";
import { useStore } from "vuex";
import util from "util";

const emits = defineEmits(["searchRdfMapping"]);

const user = getUser();
const store = useStore();

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const typeModelList = ref([]);
const rdfFormMtcdList = ref([]);

const pageInfo = reactive({
  rdfFormMtcd: "",
  typeModelId: "",
  rdfMappgYn: "",
});

const state = reactive({});

const props = reactive({});

const getRdfMappingList = (data) => {
  emits("searchRdfMapping", {
    curPage: data,
    pageInfo,
  });
};

onMounted(() => {
  getTypeModelList();
  getRdfFormMtcdList();
});

const getTypeModelList = () => {
  $axios
    .get($apiUrls.meta.data.type.getTypeModelList, {
      params: {
        isPaging: false,
        searchMode: "type",
        modelDataSttusMtcd: "use",
      },
    })
    .then((res) => {
      typeModelList.value = res.data.list;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getRdfFormMtcdList = () => {
  $axios
    .get(util.format($apiUrls.meta.portal.code.getCodeList, "MCG00009"), {
      params: {
        isPaging: false,
        mtcdUseYn: "Y",
      },
    })
    .then((res) => {
      rdfFormMtcdList.value = res.data.list;
      pageInfo.rdfFormMtcd = res.data.list[0].mtcd;
    })
    .catch((err) => {
      console.log(err);
    });
};
</script>
<style lang="scss"></style>

