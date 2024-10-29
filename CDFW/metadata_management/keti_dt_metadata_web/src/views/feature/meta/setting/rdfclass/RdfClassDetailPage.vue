<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit"><h3>RDF 클래스 정보</h3></div>
      <div class="boxCnt">
        <div class="btnSec taR mb10">
          <el-button type="primary"
            v-show="isAmdYn(route.meta.auth)"            
            @click="handleClickModify"
            >수정</el-button
          >
          <el-button type="default" @click="goToList">목록</el-button>
        </div>
        <div class="ly-table">
          <el-form label-position="right"
            label-width="200px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="12">
                <el-form-item label="RDF 클래스">{{
                  state.rdfClass.rdfClass
                }}</el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="RDF 클래스 IRI">{{
                  state.rdfClass.rdfClassIri
                }}</el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12">
                <el-form-item label="RDF 클래스 논리명">{{
                  state.rdfClass.rdfClassLogicNm
                }}</el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="RDF 매핑 형식">{{
                  state.rdfClass.rdfFormMtcdNmStr
                }}</el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
    </div>
    <div class="boxLayout">
      <div class="boxTit"><h3>RDF 프라퍼티 목록</h3></div>
      <div class="boxCnt">
        <div class="btnSec taR mb10">
          <el-button type="primary" plain
            v-show="isDelYn(route.meta.auth)"            
            @click="deleteRdfPropertyDefineList"
            >RDF 프로퍼티 삭제</el-button
          >
          <el-button type="primary"    
            v-show="isAmdYn(route.meta.auth)"
            @click="handleClickRdfPropertyDefine"
            >RDF 프로퍼티 추가</el-button
          >
        </div>
        <ComnList
          :tableHeader="tableHeader"
          :tableData="rdfPropertyList"
          @selectionChange="selectRdfProperty"
        >
        </ComnList>
        <ComnPagination
          :totalPage="rdfPropertyListPageInfo.totalListSize"
          :curPage="rdfPropertyListPageInfo.curPage"
          @pagemove="pageMoveRdfProperty"
        >
        </ComnPagination>
      </div>
    </div>
  </div>
  <el-dialog v-model="dialogModify" title="RDF 클래스 편집">
    <div class="dialog-area">
      <div class="cntSec">
        <div class="boxLayout">
          <div class="boxTit"><h3>RDF 클래스 정보</h3></div>
          <div class="boxCnt">
            <el-form label-position="right"
              ref="ruleFormRef"
              :model="state.rdfClass"
              :rules="state.rules"
              label-width="210px"
              class="demo-ruleForm"
            >
              <el-row>
                <el-col :span="24">
                  <el-form-item label="RDF 클래스 ID" prop="rdfClassId">
                    <el-input v-model="state.rdfClass.rdfClassId" disabled>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="네임스페이스" prop="rdfNmspId">
                    <el-select
                      style="width: 400px"
                      v-model="state.rdfClass.rdfNmspId"
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
                      v-model="state.rdfClass.rdfClassNm"
                      placeholer="대문자로 시작"
                      @keydown.enter.prevent="modifyRdfClass()"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item
                    label="RDF 클래스 논리명"
                    prop="rdfClassLogicNm"
                  >
                    <el-input
                      style="width: 400px"
                      v-model="state.rdfClass.rdfClassLogicNm"
                      @keydown.enter.prevent="modifyRdfClass()"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="RDF 매핑 형식" prop="rdfFormMtcdArray">
                    <el-checkbox-group
                      v-model="state.rdfClass.rdfFormMtcdArray"
                    >
                      <el-checkbox
                        v-for="item in rdfFormMtcdList"
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
                  <el-form-item
                    label="RDF 클래스 설명"
                    prop="rdfClassDesc"
                  >
                    <el-input
                      style="width: 400px"
                      v-model="state.rdfClass.rdfClassDesc"
                      @keydown.enter.prevent="modifyRdfClass()"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="상위 RDF 클래스" prop="">
                    <el-input
                      v-model="state.rdfClass.upRdfClass"
                      style="width: 300px"
                      disabled
                    >
                    </el-input>
                    <el-button type="default" class="ml15" @click="handleClickRdfClass()"
                      ><el-icon class="icon icon-search"
                    /></el-button>
                    <el-button type="delete" class="ml15" @click="refreshUpRdfProperty()"
                      ><el-icon class="icon icon-refresh"
                    /></el-button>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="등록정보">
                    <el-input
                      v-model="state.rdfClass.rdfClassRegrInfo"
                      disabled
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="수정정보">
                    <el-input
                      v-model="state.rdfClass.rdfClassAmdrInfo"
                      disabled
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </div>
        <div class="btnSec taR mt20">
          <el-button type="primary"
            v-show="isAmdYn(route.meta.auth)"            
            @click="modifyRdfClass"
            >저장</el-button
          >
          <el-button type="primary" plain
            v-show="isDelYn(route.meta.auth)"           
            @click="deleteRdfClass"
            >삭제</el-button
          >
          <el-button type="default" @click="closeDialogModify"
            >취소</el-button
          >
        </div>
      </div>
    </div>
  </el-dialog>
  <el-dialog v-model="dialogRdfClass" title="상위 RDF 클래스 검색">
    <div class="dialog-area">
      <el-form label-position="right">
        <RdfClassSearchForm
          :rdfFormMtcdList="rdfFormMtcdList"
          :rdfNmspList="rdfNamespaceList"
          :amdDtVisibleYn="amdDtVisibleYn"
          @searchRdfClass="searchRdfClass"
        />
        <div class="boxLayout">
          <div class="boxTit"><h3>RDF 클래스 목록</h3></div>
          <div class="boxCnt">
            <ComnList
              :tableHeader="tableHeaderRdfClass"
              :tableData="rdfClassList"
              @row-click="rowClickRdfClass"
            >
            </ComnList>
            <ComnPagination
              :totalPage="rdfClassListPageInfo.totalListSize"
              :curPage="rdfClassListPageInfo.curPage"
              @pagemove="pageMoveRdfClass"
            >
            </ComnPagination>
          </div>
        </div>
      </el-form>
    </div>
  </el-dialog>
  <el-dialog
    style="width: 1300px"
    title="RDF 프라퍼티 추가"
    v-model="dialogRdfPrptDefineEdit"
  >
    <div class="dialog-area">
      <div class="boxLayout">
        <div class="boxTit">
          <h3>RDF 프라퍼티 목록 {{ rdfPro }}</h3>
        </div>
        <div class="boxCnt">
          <el-form label-position="right"
            label-width="120px"
            class="demo-ruleForm"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="네임스페이스">
                  <el-select
                    style="width: 400px"
                    v-model="rdfNmspId"
                    placeholder="선택"
                  >
                    <el-option label="전체" value="" />
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
              <el-col :span="12">
                <el-form-item label="RDF 매핑 형식">
                  <el-select v-model="rdfPropertyDefineMtcd" placeholder="선택">
                    <el-option label="전체" value="" />
                    <el-option
                      v-for="item in rdfFormMtcdList"
                      :key="item.mtcd"
                      :label="item.mtcdNm"
                      :value="item.mtcd"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="RDF 프라퍼티 명">
                  <el-input
                    v-model="searchPrptyNm"
                    placeholder="물리명 또는 논리명을 입력하세요."
                    @keydown.enter.prevent="getRdfPropertyListForAdd()"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <div class="btnSec taR">
                  <el-button type="primary" @click="getRdfPropertyListForAdd"
                    >검색</el-button
                  >
                </div>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
      <div class="boxLayout">
        <el-container class="container-height">
          <el-aside width="68%" style="margin-right: 10px">
            <div class="boxTit">
              <h3>RDF 프라퍼티 목록 {{ state.rdfPropertyListSizeForAdd }}</h3>
            </div>
            <ComnList
              :tableHeader="tableHeaderAddProperty"
              :tableData="rdfPropertyListForAdd"
              className="custom-table-height"
              @selectionChange="selectAddCheckbox"
            >
            </ComnList>
          </el-aside>
          <div class="custom-btn">
            <div
              style="border-left: 1px solid #ddd"
              class="custom-table-height"
            ></div>
          </div>
          <el-aside width="28%" style="margin-left: 10px"
            >
            <div class="boxTit">
              <h3>
                선택 프라퍼티 목록 {{ state.tableDataSelectedRdfPropertySize }}
              </h3>
              <div class="btnSec taR">
                <el-button type="default" @click="handleCloseCancel"
                  >취소</el-button
                >
                <el-button type="primary"
                  v-show="isWriteYn(route.meta.auth)"                  
                  @click="editRdfPropertyDefineList"
                  >저장</el-button
                >
              </div>
            </div>
            <ComnList
              :tableHeader="tableHeaderSelectedRdfProperty"
              :tableData="state.tableDataSelectedRdfPropertyList"
              className="custom-table-height"
            >
            </ComnList>
          </el-aside>
        </el-container>
      </div>
    </div>
  </el-dialog>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import RdfClassSearchForm from "@/components/meta/rdfclass/RdfClassSearchForm.vue";
import { ref, reactive, onMounted, computed, watch, defineProps } from "vue";
import {
  getGlobalProperties,
  routerPush,
  getCookie,
  isWriteYn,
  isAmdYn,
  isDelYn,
} from "@/assets/js/common.js";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
const route = useRoute();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
import util from "util";
const ruleFormRef = ref(null);
const dialogModify = ref(false);
const dialogRdfPrptDefineEdit = ref(false);
const dialogRdfClass = ref(false);

const state = reactive({
  rdfClass: {
    rdfClassId: "",
    rdfFormMtcdArray: [],
    rdfFormMtcds: "",
    rdfNmspId: "",
    rdfClassNm: "",
    rdfClassDesc: "",
    rdfClassLogicNm: "",
    rdfClass: "",
    rdfFormMtcdNmStr: "",
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
  tableDataSelectedRdfPropertyList: [],
  tableDataSelectedRdfPropertySize: 0,
  rdfPropertyListSizeForAdd: 0,
});

const rdfPropertyList = ref([]);
const rdfPropertyListPageInfo = ref({
  curPage: 1,
  totalListSize: 0,
  pageListSize: 10,
});

const rdfClassList = ref([]);
const rdfClassListPageInfo = ref({
  curPage: 1,
  totalListSize: 0,
  pageListSize: 10,
});
const rdfClassListSearchInfo = ref({});

const tableHeader = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 40,
    align: "center",
  },
  {
    prop: "rdfPrpty",
    label: "RDF 프라퍼티",
    width: 120,
  },
  {
    prop: "rdfPrptyNm",
    label: "RDF 프라퍼티 명",
    width: 120,
  },
  {
    prop: "rdfPrptyLogicNm",
    label: "RDF 프라퍼티 논리명",
    width: 120,
  },
  {
    prop: "rdfClassStr",
    label: "범위 RDF 클래스",
    width: 120,
  },

  {
    prop: "deleteCheckBox",
    type: "selection",
    width: 40,
    align: "center",
  },
]);

const tableHeaderAddProperty = ref([
  {
    type: "selection",
    width: 40,
    align: "center",
  },
  {
    prop: "rownum",
    label: "번호",
    width: 40,
    align: "center",
  },
  {
    prop: "rdfPrpty",
    label: "RDF 프라퍼티",
    width: 140,
  },
  {
    prop: "rdfPrptyLogicNm",
    label: "RDF 프라퍼티 논리명",
    width: 120,
  },
  {
    prop: "rdfClassStr",
    label: "범위 RDF 클래스",
    width: 150,
  },
]);

const tableHeaderRdfClass = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 40,
    align: "center",
  },
  {
    prop: "rdfClass",
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

const tableHeaderSelectedRdfProperty = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 40,
    align: "center",
  },
  {
    prop: "rdfPrpty",
    label: "RDF 프라퍼티",
    width: 140,
  },
  {
    prop: "rdfPrptyLogicNm",
    label: "RDF 프라퍼티 논리명",
    width: 120,
  },
]);

const rdfClassId = route.query.rdfClassId;

const selectAddCheckbox = (selectionRows) => {
  state.tableDataSelectedRdfPropertyList = selectionRows;
  state.tableDataSelectedRdfPropertySize =
    "(" + state.tableDataSelectedRdfPropertyList.length + "건)";
};

const deleteList = ref([]);

const selectRdfProperty = (selectedRows) => {
  deleteList.value = selectedRows;
};

const parseStrToArr = (rdfFormMtcds) => {
  return rdfFormMtcds.split(",").sort();
};

const getRdfClassDetail = () => {
  $axios
    .get(util.format($apiUrls.meta.rdf.class.getClass, rdfClassId))
    .then((res) => {
      state.rdfClass.rdfClassId = res.data.rdfClassId;
      state.rdfClass.rdfNmspId = res.data.rdfNmspId;
      state.rdfClass.rdfClassNm = res.data.rdfClassNm;
      state.rdfClass.rdfClassLogicNm = res.data.rdfClassLogicNm;
      state.rdfClass.rdfClass = res.data.rdfClass;
      state.rdfClass.rdfFormMtcdNmStr = res.data.rdfFormMtcdNmStr;
      state.rdfClass.upRdfClassId = res.data.upRdfClassId;
      state.rdfClass.upRdfClass = res.data.upRdfClass;
      state.rdfClass.rdfClassIri = res.data.rdfClassIri;
      state.rdfClass.rdfClassRegrId = res.data.rdfClassRegrId;
      state.rdfClass.rdfClassRegrNm = res.data.rdfClassRegrNm;
      state.rdfClass.rdfClassRegDt = res.data.rdfClassRegDt;
      state.rdfClass.rdfClassRegrInfo =
        res.data.rdfClassRegrId + " / " + res.data.rdfClassRegDt;
      state.rdfClass.rdfClassAmdrId = res.data.rdfClassAmdrId;
      state.rdfClass.rdfClassAmdrNm = res.data.rdfClassAmdrNm;
      state.rdfClass.rdfClassAmdDt = res.data.rdfClassAmdDt;
      state.rdfClass.rdfClassAmdrInfo =
        res.data.rdfClassAmdrId + " / " + res.data.rdfClassAmdDt;
      state.rdfClass.rdfFormMtcds = res.data.rdfFormMtcds;
      state.rdfClass.rdfFormMtcdArray = parseStrToArr(res.data.rdfFormMtcds);
    })
    .catch((err) => {
      console.log(err);
    });
};

const getRdfPropertyList = () => {
  let param = {
    curPage: rdfPropertyListPageInfo.value.curPage,
    totalListSize: rdfPropertyListPageInfo.value.totalListSize,
    pageListSize: rdfPropertyListPageInfo.value.pageListSize,
    rdfClassId: rdfClassId,
  };
  $axios
    .get(
      util.format(
        $apiUrls.meta.rdf.class.getPropertyListByRdfClass,
        rdfClassId
      ),
      { params: param }
    )
    .then((res) => {
      rdfPropertyListPageInfo.value = res.data.page;
      rdfPropertyList.value = res.data.list;
    })
    .catch((err) => {
      console.log(err);
    });
};

const pageMoveRdfProperty = (curPage) => {
  rdfPropertyListPageInfo.value.curPage = curPage;
  getRdfPropertyList();
};

const parseArrToStr = (rdfFormMtcdArray) => {
  rdfFormMtcdArray.filter(
    (item) => item !== null || item !== "" || item.length !== 0
  );
  rdfFormMtcdArray.sort();
  return rdfFormMtcdArray.join(",");
};

const modifyRdfClass = () => {
  let ruleForm = ruleFormRef.value;
  if (!ruleForm) return;
  state.rdfClass.rdfFormMtcds = parseArrToStr(state.rdfClass.rdfFormMtcdArray);
  const editForm = state.rdfClass;
  ruleForm.validate((valid) => {
    if (valid) {
      if (!confirm("수정하시겠습니까?")) {
        return;
      }
      $axios
        .put(
          util.format($apiUrls.meta.rdf.class.modifyClass, rdfClassId),
          editForm
        )
        .then((res) => {
          alert("수정되었습니다.");
          getRdfClassDetail();
          dialogModify.value = false;
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
            alert("클래스 수정에 실패하였습니다.");
          }
        });
    } else {
      alert("입력 정보를 다시 한번 확인해주세요.");
    }
  });
};

const handleClickModify = () => {
  dialogModify.value = true;
};

const getUpRdfClassList = () => {
  let param = Object.assign(
    {},
    rdfClassListPageInfo.value,
    rdfClassListSearchInfo.value
  );
  $axios
    .get($apiUrls.meta.rdf.class.getClassList, {
      params: param,
    })
    .then((res) => {
      rdfClassListPageInfo.value.totalListSize = res.data.page.totalListSize;
      rdfClassList.value = res.data.list;
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleClickRdfClass = () => {
  dialogRdfClass.value = true;
};

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

const makeRdfNamespaceLabel = () => {
  for (let rdfNamespace of rdfNamespaceList.value) {
    rdfNamespace.label =
      "[" + rdfNamespace.rdfNmspPfix + "] " + rdfNamespace.rdfNmspUri;
  }
};

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

const searchRdfClass = (payload) => {
  rdfClassListPageInfo.value.curPage = 1;
  rdfClassListSearchInfo.value = payload;
  getUpRdfClassList();
};

const rowClickRdfClass = (data) => {
  if (rdfClassId === data.rdfClassId) {
    alert("같은 RDF 클래스를 선택할 수 없습니다.");
    return;
  }
  dialogRdfClass.value = false;
  state.rdfClass.upRdfClassId = data.rdfClassId;
  state.rdfClass.upRdfClass = data.rdfClass;
};

const pageMoveRdfClass = (curPage) => {
  rdfClassListPageInfo.value.curPage = curPage;
  getUpRdfClassList();
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "RdfClassListPage", query);
};

const deleteRdfClass = () => {
  const deleteYn = confirm("삭제하시겠습니까?");
  if (!deleteYn) {
    return;
  }
  $axios
    .delete(util.format($apiUrls.meta.rdf.class.deleteClass, rdfClassId))
    .then(() => {
      alert("삭제되었습니다.");
      dialogModify.value = false;
      goToList();
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
        alert("삭제에 실패하였습니다.");
      }
    });
};

const closeDialogModify = () => {
  dialogModify.value = false;
};

const deleteRdfPropertyDefineList = () => {
  if (deleteList.value.length === 0) {
    alert("삭제할 RDF 프라퍼티를 선택해주세요.");
    return;
  }
  let deleteYn = confirm("삭제하시겠습니까?");
  if (!deleteYn) {
    return;
  }
  const serializedIds = deleteList.value
    .map((rdfPrpty) => `id=${rdfPrpty.rdfPrptyDefId}`)
    .join("&");

  $axios
    .delete(
      `${$apiUrls.meta.rdf.property.deletePropertyDefineList}?${serializedIds}`
    )
    .then((res) => {
      initRdfPrptyListPageInfo();
      dialogRdfPrptDefineEdit.value = false;
      getRdfPropertyList();
      alert("삭제되었습니다.");
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
        alert("삭제에 실패하였습니다.");
      }
    });
};

const handleClickRdfPropertyDefine = () => {
  getRdfPropertyListForAdd();
  dialogRdfPrptDefineEdit.value = true;
};

const rdfPropertyDefineMtcd = ref("");
const searchPrptyNm = ref("");
const rdfNmspId = ref("");
const rdfPropertyListForAdd = ref([]);
const rdfPropertyListForAddPageInfo = ref({
  isPaging: false,
  curPage: 1,
  totalListSize: 0,
  pageListSize: 10,
});

const getRdfPropertyListForAdd = () => {
  let params = {
    rdfFormMtcd: rdfPropertyDefineMtcd.value,
    searchPrptyNm: searchPrptyNm.value,
    rdfNmspId: rdfNmspId.value,
  };
  params = Object.assign(params, rdfPropertyListForAddPageInfo.value);
  console.log(params);
  const apiUrl = $apiUrls.meta.rdf.property.getPropertyList;
  $axios
    .get(apiUrl, { params })
    .then((res) => {
      rdfPropertyListForAddPageInfo.value = res.data.page;
      rdfPropertyListForAdd.value = res.data.list;
      state.rdfPropertyListSizeForAdd =
        "(" + res.data.page.totalListSize + "건)";
    })
    .catch((err) => {
      console.log(err);
    });
};

const refreshUpRdfProperty = () => {
  state.rdfClass.upRdfClassId = "";
  state.rdfClass.upRdfClass = "";
};

const handleCloseCancel = () => {
  dialogRdfPrptDefineEdit.value = false;
};

const initRdfPrptyListPageInfo = () => {
  rdfPropertyListPageInfo.value = {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  };
};

const editRdfPropertyDefineList = () => {
  if (state.tableDataSelectedRdfPropertyList.length === 0) {
    alert("RDF 프라퍼티를 선택하세요.");
    return;
  }
  let list = [];
  for (let i = 0; i < state.tableDataSelectedRdfPropertyList.length; ++i) {
    let editForm = {
      rdfClassId: state.rdfClass.rdfClassId,
      rdfPrptyId: state.tableDataSelectedRdfPropertyList[i].rdfPrptyId,
      domnRangeDivMtcd: "domain",
    };
    list[i] = editForm;
  }
  $axios
    .post($apiUrls.meta.rdf.property.createPropertyDefineList, list, {
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => {
      alert("저장되었습니다.");
      initRdfPrptyListPageInfo();
      dialogRdfPrptDefineEdit.value = false;
      getRdfPropertyList();
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
        alert("저장에 실패하였습니다.");
      }
    });
};

onMounted(() => {
  getRdfClassDetail();
  getRdfPropertyList();
  getCodeList();
  getMetaCodeGroupList();
  getRdfNamespaceList();
  getUpRdfClassList();
});
</script>

<style lang="scss" scoped>
.right-aligned {
  text-align: right;
}

.container-height {
  height: calc(100vh - 180px);
  display: flex;
  justify-content: space-between;
}

.custom-btn {
  flex-direction: column;
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-table-height {
  height: calc(100vh - 221px);
}
</style>