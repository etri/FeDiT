<template>
  <div class="cntSec">
    <RdfClassSearchForm
      :rdfFormMtcdList="rdfFormMtcdList"
      :rdfNmspList="rdfNamespaceList"
      :amdDtVisibleYn="visibleY"
      @searchRdfClass="searchRdfClass"
    />
    <div class="btnSec taR mt10">
      <el-button type="primary" size="large"
        v-if="isWriteYn(route.meta.auth)"        
        @click="() => handleClickEdit()"
        >등록</el-button
      >
    </div>
    <RdfClassList
      :rdfClassList="state.rdfClassList"
      :totalPage="state.pageInfo.totalListSize"
      :curPage="state.pageInfo.curPage"
      :rdfFormMtcdList="rdfFormMtcdList"
      :rdfNmspList="rdfNamespaceList"
      @pageMove="pageMove"
    />
  </div>
  <el-dialog v-model="dialogEdit" title="RDF 클래스 등록">
    <div class="dialog-area">
      <div class="boxLayout">
        <div class="boxTit"><h3>RDF 클래스 정보</h3></div>
        <div class="boxCnt">
          <el-form label-position="right"
            ref="ruleFormRef"
            :model="state.editInfo"
            :rules="state.rules"
            label-width="210px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="24">
                <el-form-item label="네임스페이스" prop="rdfNmspId">
                  <el-select
                    style="width: 400px"
                    v-model="state.editInfo.rdfNmspId"
                    placeholder="선택"
                  >
                    <el-option
                      v-for="item in rdfNamespaceList"
                      :key="item.rdfNmspId"
                      :label="item.label"
                      :value="item.rdfNmspId"
                    >
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="RDF 클래스 명(물리명)" prop="rdfClassNm">
                  <el-input
                    style="width: 400px"
                    v-model="state.editInfo.rdfClassNm"
                    placeholer="대문자로 시작"
                  >
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="RDF 클래스 논리명" prop="rdfClassLogicNm">
                  <el-input
                    style="width: 400px"
                    v-model="state.editInfo.rdfClassLogicNm"
                  >
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="RDF 매핑 형식" prop="rdfFormMtcdArray">
                  <el-checkbox-group v-model="state.editInfo.rdfFormMtcdArray">
                    <el-checkbox
                      v-for="item in rdfFormMtcdList"
                      :checked="item.checked"
                      :key="item.mtcd"
                      :label="item.mtcd"
                      >{{ item.mtcdNm }}
                    </el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="RDF 클래스 설명" prop="rdfClassDesc">
                  <el-input
                    style="width: 400px"
                    v-model="state.editInfo.rdfClassDesc"
                  >
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="상위 RDF 클래스" prop="">
                  <el-input
                    v-model="state.editInfo.upRdfClass"
                    style="width: 250px"
                    disabled
                  >
                  </el-input>
                  <el-button type="default" class="ml15" @click="handleClickUpRdfClass"
                    ><el-icon class="icon icon-search"
                  /></el-button>
                  <el-button type="default" class="el-button--delete ml15" @click="refreshUpRdfClass"
                    ><el-icon class="icon icon-refresh"
                  /></el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
      <div class="btnSec taR mt10">
        <el-button type="primary" @click="editRdfClass">저장</el-button>
        <el-button type="default" @click="closeDialogEdit">취소</el-button>
      </div>
    </div>
  </el-dialog>
  <el-dialog v-model="dialogUpRdfClass" title="상위 RDF 클래스 검색">
    <el-form label-position="right">
      <RdfClassSearchForm
        :rdfFormMtcdList="rdfFormMtcdList"
        :rdfNmspList="rdfNamespaceList"
        :amdDtVisibleYn="visibleN"
        @searchRdfClass="searchUpRdfClass"
      />
      <div class="boxLayout">
        <div class="boxTit"><h3>RDF 클래스 목록</h3></div>
        <div class="boxCnt">
          <ComnList
            :tableHeader="tableHeaderRdfClass"
            :tableData="upRdfClassList"
            @row-click="rowClickUpRdfClass"
          >
          </ComnList>
          <ComnPagination
            :totalPage="upRdfClassListPageInfo.totalListSize"
            :curPage="upRdfClassListPageInfo.curPage"
            @pagemove="pageMoveUpRdfClass"
          >
          </ComnPagination>
        </div>
      </div>
    </el-form>
  </el-dialog>
</template>
<script setup>
import RdfClassSearchForm from "@/components/meta/rdfclass/RdfClassSearchForm.vue";
import RdfClassList from "@/components/meta/rdfclass/RdfClassList.vue";
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
  isWriteYn,
  isAmdYn,
  isDelYn,
} from "@/assets/js/common.js";
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";
import dayjs from "dayjs";
import { trim } from "@amcharts/amcharts4/.internal/core/utils/Utils";
const route = useRoute();
const router = useRouter();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const visibleY = ref(true);
const visibleN = ref(false);
const ruleFormRef = ref(null);
const dialogEdit = ref(false);
const dialogUpRdfClass = ref(false);

const state = reactive({
  rdfClassList: [],
  searchInfo: {},
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  },
  editInfo: {
    rdfClassId: "",
    rdfFormMtcdArray: [],
    rdfNmspId: "",
    rdfClassNm: "",
    rdfClassDesc: "",
    rdfClassLogicNm: "",
    rdfClass: "",
    upRdfClassId: "",
    upRdfClass: "",
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
  rules: {
    rdfNmspId: [
      {
        required: true,
        message: "선택하세요.",
        trigger: "blur",
      },
    ],
    rdfClassNm: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
    ],
    rdfClassLogicNm: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
    ],
    rdfFormMtcdArray: [
      {
        type: "array",
        required: true,
        message: "선택하세요.",
        trigger: "change",
      },
    ],
  },
});

const tableHeaderRdfClass = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 40,
    align: "center",
  },
  {
    prop: "rdfClass", // rdfNmspPfix + ':' +  rdfClassNm
    label: "RDF 클래스",
    width: 140,
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
    prop: "rdfFormMtcdNmStr",
    label: "RDF 매핑 형식",
    width: 120,
  },
]);

const getCodeList = () =>
  store.dispatch("MetaStore/getMetaCodeList", {
    axios: $axios,
    apiUrls: $apiUrls,
    params: {
      mtcdGrpIdList: ["MCG00009"],
    },
  });

const rdfFormMtcdList = computed(() =>
  store.getters["MetaStore/getStoreMetaCodeList"]("MCG00009")
);

const getMetaCodeGroupList = () => {
  store.dispatch("MetaStore/getAllMetaCodeGroupList", {
    axios: $axios,
    apiUrls: $apiUrls,
  });
};

const rdfNamespaceList = ref([]);

const getRdfNamespaceList = () => {
  $axios
    .get($apiUrls.meta.rdf.namespace.getNamespaceList, {
      params: {
        isPaging: false,
      },
    })
    .then((res) => {
      rdfNamespaceList.value = res.data.list;
      makeRdfNamespaceLabel();
    })
    .catch((err) => {
      console.log(err);
    });
};

const makeRdfNamespaceLabel = () => {
  for (let rdfNamespace of rdfNamespaceList.value) {
    rdfNamespace.label =
      "[" + rdfNamespace.rdfNmspPfix + "] " + rdfNamespace.rdfNmspUri;
  }
};

const searchRdfClass = (payload) => {
  state.pageInfo = {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  };
  state.searchInfo = payload;
  getRdfClassList();
};

const getRdfClassList = () => {
  let param = Object.assign({}, state.pageInfo, state.searchInfo, {
    sqlDateFormat: "YYYY-MM-DD",
  });
  console.log(param);
  $axios
    .get($apiUrls.meta.rdf.class.getClassList, {
      params: param,
    })
    .then((res) => {
      state.pageInfo.totalListSize = res.data.page.totalListSize;
      state.rdfClassList = res.data.list;
    })
    .catch((err) => {
      console.log(err);
    });
};

const pageMove = (curPage) => {
  state.pageInfo.curPage = curPage;
  getRdfClassList();
};

const handleClickEdit = () => {
  dialogEdit.value = true;
};

const goToDetail = (rdfClassId) => {
  let platform = getCookie("pltfrmId");
  let query = { rdfClassId: rdfClassId };
  routerPush(platform, "RdfClassDetailPage", query);
};
const gotoList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "RdfClassListPage", query);
};

const initEditInfo = () => {
  state.pageInfo = {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  };
  state.searchInfo = {};
  state.editInfo = {
    rdfClassId: "",
    rdfFormMtcdArray: [],
    rdfNmspId: "",
    rdfClassNm: "",
    rdfClassLogicNm: "",
    rdfClass: "",
    upRdfClassId: "",
    upRdfClass: "",
    rdfClassIri: "",
    rdfClassRegrId: "",
    rdfClassRegrNm: "",
    rdfClassRegDt: "",
    rdfClassAmdrId: "",
    rdfClassAmdrNm: "",
    rdfClassAmdDt: "",
    rdfClassRegrInfo: "",
    rdfClassAmdrInfo: "",
  };
};

const parseArrToStr = (rdfFormMtcdArray) => {
  rdfFormMtcdArray.filter(
    (item) => item !== null || item !== "" || item.length !== 0
  );
  rdfFormMtcdArray.sort();
  return rdfFormMtcdArray.join(",");
};

const editRdfClass = () => {
  let ruleForm = ruleFormRef.value;
  if (!ruleForm) return;
  state.editInfo.rdfFormMtcds = parseArrToStr(state.editInfo.rdfFormMtcdArray);
  const editForm = state.editInfo;
  ruleForm.validate((valid) => {
    if (valid) {
      if (!confirm("등록하시겠습니까?")) return;
      $axios
        .post($apiUrls.meta.rdf.class.createClass, editForm, {
          headers: { "Content-Type": "application/json" },
        })
        .then((res) => {
          alert("등록되었습니다.");
          dialogEdit.value = false;
          goToDetail(res.data.id);
          initEditInfo();          
        })
        .catch((err) => {
          console.log(err);
          if (
            err.response &&
            err.response.status &&
            (err.response.status === 422 || err.response.status === 400)
          ) {
            alert(err.response.data.message);
          } else {
            alert("클래스 등록에 실패하였습니다.");
          }
        });
    } else {
      alert("입력 정보를 다시 한번 확인해주세요.");
    }
  });
};

const closeDialogEdit = () => {
  dialogEdit.value = false;
};

const handleClickUpRdfClass = () => {
  getUpRdfClassList();
  dialogUpRdfClass.value = true;
};

const upRdfClassList = ref([]);
const upRdfClassListPageInfo = ref({
  curPage: 1,
  totalListSize: 0,
  pageListSize: 10,
});
const upRdfClassListSearchInfo = ref({});

const getUpRdfClassList = () => {
  let param = Object.assign(
    {},
    upRdfClassListPageInfo.value,
    upRdfClassListSearchInfo.value
  );
  $axios
    .get($apiUrls.meta.rdf.class.getClassList, {
      params: param,
    })
    .then((res) => {
      upRdfClassListPageInfo.value.totalListSize = res.data.page.totalListSize;
      upRdfClassList.value = res.data.list;
    })
    .catch((err) => {
      console.log(err);
    });
};

const searchUpRdfClass = (payload) => {
  upRdfClassListPageInfo.value = {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  };
  upRdfClassListSearchInfo.value = payload;
  getUpRdfClassList();
};

const rowClickUpRdfClass = (data) => {
  state.editInfo.upRdfClassId = data.rdfClassId;
  state.editInfo.upRdfClass = data.rdfClass;
  dialogUpRdfClass.value = false;
};

const pageMoveUpRdfClass = (curPage) => {
  upRdfClassListPageInfo.value.curPage = curPage;
  getUpRdfClassList();
};

const refreshUpRdfClass = () => {
  state.editInfo.upRdfClassId = "";
  state.editInfo.upRdfClass = "";
};

onMounted(() => {
  getCodeList();
  getMetaCodeGroupList();
  getRdfNamespaceList();
  getRdfClassList();
});
</script>
<style lang="scss"></style>