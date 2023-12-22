<template>
  <div class="cntSec">
    <RdfPropertySearchForm
      :rdfFormMtcdList="rdfFormMtcdList"
      :rdfNmspList="rdfNamespaceList"
      :amdDtVisibleYn="visibleY"
      @searchRdfPropertyList="searchRdfPropertyList"
    />
    <div class="btnSec taR mb10">
      <el-button type="primary" size="large"        
        v-show="isWriteYn(route.meta.auth)"        
        @click="() => handleClickEdit()"
        >등록</el-button
      >
    </div>
    <div class="boxLayout">
      <div class="boxTit"><h3>RDF 프라퍼티 목록</h3></div>
      <div class="boxCnt">
        <ComnList :tableHeader="tableHeader" :tableData="state.rdfPropertyList">
          <template v-slot:btnModify="slotData">
            <el-button type="primary" size="small"
              v-show="isAmdYn(route.meta.auth)"              
              @click="() => handleClickModify(slotData.$index)"
              >수정</el-button
            >
            <el-button type="primary" size="small"
              v-show="!isAmdYn(route.meta.auth)"              
              @click="() => handleClickModify(slotData.$index)"
              >조회</el-button
            >
          </template>
        </ComnList>
        <ComnPagination
          :totalPage="state.pageInfo.totalListSize"
          :curPage="state.pageInfo.curPage"
          @pagemove="pageMove"
        >
        </ComnPagination>
      </div>
    </div>
  </div>
<el-dialog v-model="dialogEdit" title="RDF 프라퍼티 등록">
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit"><h3>RDF 프라퍼티 등록</h3></div>
      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRefEdit"
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
              <el-form-item label="RDF 프라퍼티 명(물리명)" prop="rdfPrptyNm">
                <el-input
                  style="width: 400px"
                  v-model="state.editInfo.rdfPrptyNm"
                >
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-form-item label="RDF 프라퍼티 논리명" prop="rdfPrptyLogicNm">
                <el-input
                  style="width: 400px"
                  v-model="state.editInfo.rdfPrptyLogicNm"
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
              <el-form-item label="RDF 프라퍼티 설명" prop="rdfPrptyDesc">
                <el-input
                  style="width: 400px"
                  v-model="state.editInfo.rdfPrptyDesc"
                >
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-form-item label="상위 RDF 프라퍼티" prop="upRdfPrptyId">
                <el-input
                  v-model="state.editInfo.upRdfPrpty"
                  style="width: 400px"
                  disabled
                >
                </el-input>
                <el-button type="default" class="ml15" @click="handleClickUpRdfProperty(true)"
                  ><el-icon class="icon icon-search"
                /></el-button>
                <el-button type="delete" class="ml15" @click="refreshUpRdfProperty(true)"
                  ><el-icon class="icon icon-refresh"
                /></el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
    <div class="boxLayout">
      <div class="boxTit"><h3>범위 RDF 클래스 목록</h3>
        <div class="guide-text" style="margin-right: 155px;">※ 선택한 RDF 클래스는 저장을 해야 반영됩니다.</div>          
        <div class="btnSec taR">
          <el-button type="primary"
            v-show="isAmdYn(route.meta.auth)"
            @click="handleClickAddRdfClass(true)"
          >
            RDF 클래스 선택</el-button
          >
        </div>
      </div>   
      <div class="boxCnt">
        <el-tag
          v-for="tag in state.editInfo.rdfClassList"
          :key="tag.rdfClass"
          :value="tag.rdfPrptyDefId"
          class="mx-1 mr15"
          :closable="isAmdYn(route.meta.auth)"
          :disable-transitions="false"
          @close="handleDeleteDefineEditMode(tag)"
        >
          {{ tag.rdfClass }}
        </el-tag>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="editRdfProperty">저장</el-button>
      <el-button type="default" @click="closeDialogEdit">취소</el-button>
    </div>
  </div>
</el-dialog>

<el-dialog v-model="dialogUpRdfProperty" title="상위 RDF 프라퍼티 검색">
  <div class="dialog-area">
    <el-form label-position="right">
      <RdfPropertySearchForm
        :rdfFormMtcdList="rdfFormMtcdList"
        :rdfNmspList="rdfNamespaceList"
        :amdDtVisibleYn="visibleN"
        @searchRdfPropertyList="searchUpRdfPropertyList"
        @refresh="refresh(true)"
      />
      <div class="boxLayout">
        <div class="boxTit"><h3>RDF 프라퍼티 목록</h3></div>
        <div class="boxCnt">
          <ComnList
            :tableHeader="tableHeaderUpProperty"
            :tableData="upRdfPropertyList"
            @row-click="rowClickUpRdfProperty"
          >
          </ComnList>
          <ComnPagination
            :totalPage="upRdfPropertyListPageInfo.totalListSize"
            :curPage="upRdfPropertyListPageInfo.curPage"
            @pagemove="pageMoveUpRdfProperty"
          >
          </ComnPagination>
        </div>
      </div>
    </el-form>
  </div>
</el-dialog>
  <el-dialog v-model="dialogUpRdfPropertyModify" title="상위 RDF 프라퍼티 검색">
    <div class="dialog-area">
      <el-form label-position="right">
        <RdfPropertySearchForm
          :rdfFormMtcdList="rdfFormMtcdList"
          :rdfNmspList="rdfNamespaceList"
          :amdDtVisibleYn="visibleN"
          @searchRdfPropertyList="searchUpRdfPropertyListModify"
          @refresh="refresh(false)"
        />
        <div class="boxLayout">
          <div class="boxTit"><h3>RDF 프라퍼티 목록</h3></div>
          <div class="boxCnt">
            <ComnList
              :tableHeader="tableHeaderUpProperty"
              :tableData="upRdfPropertyListModify"
              @row-click="rowClickUpRdfPropertyModify"
            >
            </ComnList>
            <ComnPagination
              :totalPage="upRdfPropertyListPageInfoModify.totalListSize"
              :curPage="upRdfPropertyListPageInfoModify.curPage"
              @pagemove="pageMoveUpRdfPropertyModify"
            >
            </ComnPagination>
          </div>
        </div>
      </el-form>
    </div>
  </el-dialog>
  <el-dialog v-model="dialogModify" title="RDF 프라퍼티 편집">
    <div class="dialog-area">
      <div class="cntSec">
        <div class="boxLayout">
          <div class="boxTit"><h3>RDF 프라퍼티 정보</h3></div>
          <div class="boxCnt">
            <div class="btnSec taR mb10">
              <el-button type="primary"
                v-show="isWriteYn(route.meta.auth)"                
                @click="modifyRdfProperty"
                >저장</el-button
              >
              <el-button type="primary" plain
                v-show="isDelYn(route.meta.auth)"                
                @click="deleteRdfProperty"
                >삭제</el-button
              >
              <el-button type="default" @click="closeDialogModify"
                >취소</el-button
              >
            </div>
            <el-form label-position="right"
              ref="ruleFormRefModify"
              :model="state.rdfProperty"
              :rules="state.rules"
              label-width="210px"
              class="demo-ruleForm"
            >
              <el-row>
                <el-col :span="24">
                  <el-form-item label="RDF 프라퍼티 ID" prop="rdfPrptyId">
                    <el-input
                      v-model="state.rdfProperty.rdfPrptyId"
                      disabled
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="네임스페이스" prop="rdfNmspId">
                    <el-select
                      style="width: 400px"
                      v-model="state.rdfProperty.rdfNmspId"
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
                  <el-form-item
                    label="RDF 프라퍼티 명(물리명)"
                    prop="rdfPrptyNm"
                  >
                    <el-input
                      style="width: 400px"
                      v-model="state.rdfProperty.rdfPrptyNm"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item
                    label="RDF 프라퍼티 논리명"
                    prop="rdfPrptyLogicNm"
                  >
                    <el-input
                      style="width: 400px"
                      v-model="state.rdfProperty.rdfPrptyLogicNm"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="RDF 매핑 형식" prop="rdfFormMtcdArray">
                    <el-checkbox-group
                      v-model="state.rdfProperty.rdfFormMtcdArray"
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
                    label="RDF 프라퍼티 설명"
                    prop="rdfPrptyDesc"
                  >
                    <el-input
                      style="width: 400px"
                      v-model="state.rdfProperty.rdfPrptyDesc"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="상위 RDF 프라퍼티">
                    <el-input
                      v-model="state.rdfProperty.upRdfPrpty"
                      style="width: 400px"
                      disabled
                    >
                    </el-input>
                    <el-button type="default" class="ml15"
                      @click="handleClickUpRdfProperty(false)"
                      ><el-icon class="icon icon-search"
                    /></el-button>
                    <el-button type="delete" class="ml15" @click="refreshUpRdfProperty(false)"
                      ><el-icon class="icon icon-refresh"
                    /></el-button>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="RDF 프라퍼티">
                    <el-input
                      v-model="state.rdfProperty.rdfPrpty"
                      disabled
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="등록정보">
                    <el-input
                      v-model="state.rdfProperty.rdfPrptyRegrInfo"
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
                      v-model="state.rdfProperty.rdfPrptyAmdrInfo"
                      disabled
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </div>
        <div class="boxLayout">
          <div class="boxTit"><h3>범위 RDF 클래스 목록</h3>
            <div class="btnSec taR">
              <el-button type="primary"
                v-show="isAmdYn(route.meta.auth)"
                @click="handleClickAddRdfClass(false)"
              >
                RDF 클래스 추가</el-button
              >
            </div>          
          </div>
          <div class="boxCnt">

            <el-tag
              v-for="tag in dynamicTags"
              :key="tag.rdfClass"
              :value="tag.rdfPrptyDefId"
              type="default"
              effect="light"              
              class="mx-1 mr15"
              :closable="isAmdYn(route.meta.auth)"
              :disable-transitions="false"
              @close="handleDeleteDefine(tag)"
            >
              {{ tag.rdfClass }}
            </el-tag>
          </div>
        </div>
        <div class="boxLayout">
          <div class="boxTit"><h3>도메인 RDF 클래스 목록</h3></div>
          <div class="boxCnt">
            <el-tag
              v-for="tag in dynamicTagsDomain"
              :key="tag.rdfClass"
              :value="tag.rdfPrptyDefId"
              type="info"
              effect="light"
              class="mx-1 mr15"
              :disable-transitions="false"
            >
              {{ tag.rdfClass }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
  <el-dialog v-model="dialogVisibleClassSearch" title="RDF 클래스 검색">
    <div class="dialog-area">
      <RdfClassListPopupPage
        :searchMode="classSearchMode"
        :searchTypeFix="searchTypeFix"
        @selectedRow="selectRdfClass"
      />
    </div>
  </el-dialog>
  <el-dialog v-model="dialogVisibleClassSearchEditMode" title="RDF 클래스 검색">
    <div class="dialog-area">
      <RdfClassListPopupPage
        :searchMode="classSearchMode"
        :searchTypeFix="searchTypeFix"
        @selectedRow="selectRdfClass"
      />
    </div>
  </el-dialog>
</template>
<script setup>
import RdfClassListPopupPage from "@/views/feature/meta/setting/rdfclass/RdfClassListPopupPage.vue";
import RdfPropertySearchForm from "@/components/meta/rdfproperty/RdfPropertySearchForm.vue";
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import { ElInput } from "element-plus";
import {
  getGlobalProperties,
  getCookie,
  isWriteYn,
  isAmdYn,
  isDelYn,
} from "@/assets/js/common.js";
import {
  ref,
  reactive,
  onMounted,
  computed,
  getCurrentInstance,
  watch,
  nextTick,
} from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";
import dayjs from "dayjs";
const dialogModify = ref(false);

const dialogEdit = ref(false);
const dialogUpRdfProperty = ref(false);
const dialogUpRdfPropertyModify = ref(false);
const route = useRoute();
const router = useRouter();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const rdfNamespaceList = ref([]);
const ruleFormRefEdit = ref(null);
const ruleFormRefModify = ref(null);
const visibleY = ref(true);
const visibleN = ref(false);
const dialogVisibleClassSearch = ref(false);
const dialogVisibleClassSearchEditMode = ref(false);
const rdfClassInfo = {};
const classSearchMode = ref("all"); //??
const searchTypeFix = ref(false);

const state = reactive({
  rdfPropertyList: [],
  searchInfo: {},
  pageInfo: {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  },
  editInfo: {
    rdfPrptyId: "",
    rdfFormMtcdArray: [],
    rdfFormMtcds: "",
    rdfNmspId: "",
    rdfPrptyNm: "",
    rdfPrptyDesc: "",
    rdfPrptyLogicNm: "",
    rdfPrpty: "",
    upRdfPrptyId: "",
    upRdfPrpty: "",
    rdfPrptyRegrId: "",
    rdfPrptyRegrNm: "",
    rdfPrptyRegDt: "",
    rdfPrptyAmdrId: "",
    rdfPrptyAmdrNm: "",
    rdfPrptyAmdDt: "",
    rdfPrptyRegrInfo: "",
    rdfPrptyAmdrInfo: "",
    rdfClassList: [],
  },

  rdfProperty: {
    rdfPrptyId: "",
    rdfFormMtcdArray: [],
    rdfFormMtcds: "",
    rdfNmspId: "",
    rdfPrptyNm: "",
    rdfPrptyDesc: "",
    rdfPrptyLogicNm: "",
    rdfPrpty: "", 
    upRdfPrptyId: "",
    upRdfPrpty: "",
    rdfPrptyRegrId: "",
    rdfPrptyRegrNm: "",
    rdfPrptyRegDt: "",
    rdfPrptyAmdrId: "",
    rdfPrptyAmdrNm: "",
    rdfPrptyAmdDt: "",
    rdfPrptyRegrInfo: "",
    rdfPrptyAmdrInfo: "",
  },
  rules: {
    rdfNmspId: [
      {
        required: true,
        message: "선택하세요.",
        trigger: "blur",
      },
    ],
    rdfPrptyNm: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
    ],
    rdfPrptyLogicNm: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      },
    ],
    rdfFormMtcdArray: [
      {
        required: true,
        message: "선택하세요.",
        trigger: "blur",
      },
    ],
  },
});

const tableHeader = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 40,
    align: "center",
  },
  {
    prop: "rdfPrptyNm",
    label: "RDF 프라퍼티 명 (물리명)",
    width: 120,
  },
  {
    prop: "rdfPrptyLogicNm",
    label: "RDF 프라퍼티 논리명",
    width: 120,
  },
  {
    prop: "rdfPrpty",
    label: "RDF 프라퍼티",
    width: 140,
  },
  {
    prop: "rdfFormMtcdNmStr",
    label: "RDF 매핑 형식",
    width: 150,
  },
  {
    prop: "rdfPrptyAmdDt",
    label: "수정일",
    width: 90,
  },
  {
    prop: "btnModify",
    label: "수정",
    width: 60,
    columnType: "custom",
  },
]);

const tableHeaderUpProperty = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 40,
    align: "center",
  },
  {
    prop: "rdfPrptyNm",
    label: "RDF 프라퍼티 명 (물리명)",
    width: 120,
  },
  {
    prop: "rdfPrptyLogicNm",
    label: "RDF 프라퍼티 논리명",
    width: 120,
  },
  {
    prop: "rdfPrpty",
    label: "RDF 프라퍼티",
    width: 140,
  },
  {
    prop: "rdfFormMtcdNmStr",
    label: "RDF 매핑 형식",
    width: 150,
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

const getRdfPropertyList = () => {
  let param = Object.assign({}, state.pageInfo, state.searchInfo);
  //console.log(param);
  $axios
    .get($apiUrls.meta.rdf.property.getPropertyList, {
      params: param,
    })
    .then((res) => {
      state.pageInfo.totalListSize = res.data.page.totalListSize;
      state.rdfPropertyList = res.data.list.map((x, idx) => {
        x.rdfPrptyAmdDt = dayjs(x.rdfPrptyAmdDt).format("YYYY-MM-DD");
        x.rdfPrptyRegDt = dayjs(x.rdfPrptyRegDt).format("YYYY-MM-DD");
        return x;
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

const searchRdfPropertyList = (payload) => {
  state.pageInfo = {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  };
  state.searchInfo = payload;
  getRdfPropertyList();
};

const pageMove = (curPage) => {
  state.pageInfo.curPage = curPage;
  getRdfPropertyList();
};

const handleClickModify = (index) => {
  editYn.value = false;
  let rdfPrptyId = state.rdfPropertyList[index].rdfPrptyId;
  getPropertyDetail(rdfPrptyId);
  getRangeRdfPropertyDefineList(rdfPrptyId);
  getDomainRdfPropertyDefineList(rdfPrptyId);
  dialogModify.value = true;
};

const handleClickEdit = () => {
  editYn.value = true;
  refresh();
  dialogEdit.value = true;
};

const closeDialogEdit = () => {
  dialogEdit.value = false;
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
  let query = null;
  routerPush(platform, "RdfPropertyList", query);
};

const editRdfProperty = () => {
  let ruleForm = ruleFormRefEdit.value;
  if (!ruleForm) return;
  state.editInfo.rdfFormMtcds = parseArrToStr(state.editInfo.rdfFormMtcdArray);
  const editForm = state.editInfo;
  ruleForm.validate((valid) => {
    if (valid) {
      if (!confirm("등록하시겠습니까?")) return;
      $axios
        .post($apiUrls.meta.rdf.property.createProperty, editForm, {
          headers: { "Content-Type": "application/json" },
        })
        .then((res) => {
          let rdfPrptyId = res.data.id;
          editRdfPropertyDefineList(rdfPrptyId);
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
            alert("프라퍼티 등록에 실패하였습니다.");
          }
        });
    } else {
      alert("입력 정보를 다시 한번 확인해주세요.");
    }
  });
};

const initEditInfo = () => {
  state.editInfo = {
    rdfPrptyId: "",
    rdfFormMtcdArray: [],
    rdfFormMtcds: "",
    rdfNmspId: "",
    rdfPrptyNm: "",
    rdfPrptyLogicNm: "",
    rdfPrpty: "",
    upRdfPrptyId: "",
    upRdfPrpty: "",
    rdfPrptyRegrId: "",
    rdfPrptyRegrNm: "",
    rdfPrptyRegDt: "",
    rdfPrptyAmdrId: "",
    rdfPrptyAmdrNm: "",
    rdfPrptyAmdDt: "",
    rdfPrptyRegrInfo: "",
    rdfPrptyAmdrInfo: "",
    rdfClassList: [],
  };
}

const modifyRdfProperty = () => {
  let ruleForm = ruleFormRefModify.value;
  if (!ruleForm) return;
  state.rdfProperty.rdfFormMtcds = parseArrToStr(
    state.rdfProperty.rdfFormMtcdArray
  );
  const editForm = state.rdfProperty;
  ruleForm.validate((valid) => {
    if (valid) {
      if (!confirm("수정하시겠습니까?")) {
        return;
      }
      $axios
        .put(
          util.format(
            $apiUrls.meta.rdf.property.modifyProperty,
            state.rdfProperty.rdfPrptyId
          ),
          editForm
        )
        .then((res) => {
          alert("저장되었습니다.");
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
            alert("프라퍼티 수정에 실패하였습니다.");
          }
        });
    } else {
      alert("입력 정보를 다시 한번 확인해주세요.");
    }
  });
};

const refreshUpRdfProperty = (editModeYn) => {
  if (editModeYn) {
    state.editInfo.upRdfPrptyId = "";
    state.editInfo.upRdfPrpty = "";
    return;
  }
  state.rdfProperty.upRdfPrptyId = "";
  state.rdfProperty.upRdfPrpty = "";
};

const deleteRdfProperty = () => {
  if (!confirm("삭제하시겠습니까?")) {
    return;
  }
  $axios
    .delete(
      util.format(
        $apiUrls.meta.rdf.property.deleteProperty,
        state.rdfProperty.rdfPrptyId
      )
    )
    .then(() => {
      alert("삭제되었습니다.");
      dialogModify.value = false;
      getRdfPropertyList();
    })
    .catch((err) => {
      console.log(err);
      if (err.response.status === 422 || err.response.status === 400) {
        alert(err.response.data.message);
      } else {
        alert("삭제에 실패하였습니다.");
      }
    });
};

const editYn = ref(false);

const handleClickAddRdfClass = () => {
   if (editYn.value) {
    dialogVisibleClassSearchEditMode.value = true;
  } else {
    dialogVisibleClassSearch.value = true;
  }
};

const selectRdfClass = (payload) => {
  dialogVisibleClassSearch.value = false;
  let selectedDefine = payload.rowData;
  if (editYn.value) {
    if (state.editInfo.rdfClassList.includes(selectedDefine)) {
      alert("이미 선택된 RDF 클래스(" + selectedDefine.rdfClass + ")입니다.");
      dialogVisibleClassSearchEditMode.value = false;
      return;
    }
    state.editInfo.rdfClassList[state.editInfo.rdfClassList.length] = selectedDefine;
    dialogVisibleClassSearchEditMode.value = false;

  } else {
    editRdfPropertyDefine(selectedDefine);
    dialogVisibleClassSearch.value = false;
  }
};

const editRdfPropertyDefine = (selectedDefine) => {
  let editForm = {
    rdfClassId: selectedDefine.rdfClassId,
    rdfPrptyId: state.rdfProperty.rdfPrptyId,
    domnRangeDivMtcd: "range",
  };
  let list = [editForm];

  $axios
    .post($apiUrls.meta.rdf.property.createPropertyDefineList, list, {
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => {
      alert("추가되었습니다.");
      getRangeRdfPropertyDefineList(state.rdfProperty.rdfPrptyId); 
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
        alert("프라퍼티 정의 등록에 실패하였습니다.");
      }
    });
};

const editRdfPropertyDefineList = (rdfPrptyId) => {
  if (state.editInfo.rdfClassList.length === 0) {
    alert("저장이 완료되었습니다.");
    dialogEdit.value = false;
    getRdfPropertyList();
    initEditInfo();
    return;
  }
  let list = [];
  for (let i = 0; i < state.editInfo.rdfClassList.length; ++i) {
    let editForm = {
      rdfClassId: state.editInfo.rdfClassList[i].rdfClassId,
      rdfPrptyId: rdfPrptyId,
      domnRangeDivMtcd: "range",
    };
    list[i] = editForm;
  }
  $axios
    .post($apiUrls.meta.rdf.property.createPropertyDefineList, list, {
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => {
      alert("저장이 완료되었습니다.");
      dialogEdit.value = false;
      getRdfPropertyList();
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
        alert("프라퍼티 정의 등록에 실패하였습니다.");
      }
    });
};

const getRangeRdfPropertyDefineList = (rdfPrptyId) => {
  let param = {
    rdfPrptyId: rdfPrptyId,
    domnRangeDivMtcd: "range",
    isPaging: false,
  };

  $axios
    .get($apiUrls.meta.rdf.property.getPropertyDefineList, {
      params: param,
    })
    .then((res) => {
      dynamicTags.value = [];
      for (let i = 0; i < res.data.list.length; ++i) {
        dynamicTags.value[i] = {
          rdfClass: res.data.list[i].rdfClass,
          rdfPrptyDefId: res.data.list[i].rdfPrptyDefId,
        };
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const upRdfPropertyList = ref([]);
const upRdfPropertyListSearchInfo = ref({});
const upRdfPropertyListPageInfo = ref({
  curPage: 1,
  totalListSize: 0,
  pageListSize: 10,
});

const upRdfPropertyListModify = ref([]);
const upRdfPropertyListSearchInfoModify = ref({});
const upRdfPropertyListPageInfoModify = ref({
  curPage: 1,
  totalListSize: 0,
  pageListSize: 10,
});

const handleClickUpRdfProperty = (editModeYn) => {
  if (editModeYn) {
    getUpRdfPropertyList(true);
    dialogUpRdfProperty.value = true;
  } else {
    getUpRdfPropertyList(false);
    dialogUpRdfPropertyModify.value = true;
  }
};

const getUpRdfPropertyList = (editModeYn) => {
  let param =
    editModeYn === true
      ? Object.assign(
          {},
          upRdfPropertyListSearchInfo.value,
          upRdfPropertyListPageInfo.value
        )
      : Object.assign(
          {},
          upRdfPropertyListSearchInfoModify.value,
          upRdfPropertyListPageInfoModify.value
        );

  $axios
    .get($apiUrls.meta.rdf.property.getPropertyList, {
      params: param,
    })
    .then((res) => {
      if (editModeYn) {
        upRdfPropertyListPageInfo.value.totalListSize =
          res.data.page.totalListSize;
        upRdfPropertyList.value = res.data.list;
      } else {
        upRdfPropertyListPageInfoModify.value.totalListSize =
          res.data.page.totalListSize;
        upRdfPropertyListModify.value = res.data.list;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const rowClickUpRdfProperty = (data) => {
  state.editInfo.upRdfPrptyId = data.rdfPrptyId;
  state.editInfo.upRdfPrpty = data.rdfPrpty;
  dialogUpRdfProperty.value = false;
};

const rowClickUpRdfPropertyModify = (data) => {
  if (state.rdfProperty.rdfPrptyId === data.rdfPrptyId) {
    alert("같은 RDF 프라퍼티를 선택할 수 없습니다.");
    return;
  }
  state.rdfProperty.upRdfPrptyId = data.rdfPrptyId;
  state.rdfProperty.upRdfPrpty = data.rdfPrpty;
  dialogUpRdfPropertyModify.value = false;
};

const pageMoveUpRdfProperty = (curPage) => {
  upRdfPropertyListPageInfo.value.curPage = curPage;
  getUpRdfPropertyList(true);
};

const pageMoveUpRdfPropertyModify = (curPage) => {
  upRdfPropertyListPageInfoModify.value.curPage = curPage;
  getUpRdfPropertyList(false);
};

const parseArrToStr = (rdfFormMtcdArray) => {
  rdfFormMtcdArray.filter(
    (item) => item !== null || item !== "" || item.length !== 0
  );
  rdfFormMtcdArray.sort();
  return rdfFormMtcdArray.join(",");
};

const parseStrToArr = (rdfFormMtcds) => {
  return rdfFormMtcds.split(",").sort();
};

const getPropertyDetail = (rdfPrptyId) => {
  $axios
    .get(util.format($apiUrls.meta.rdf.property.getProperty, rdfPrptyId))
    .then((res) => {
      state.rdfProperty.rdfPrptyId = res.data.rdfPrptyId;
      state.rdfProperty.rdfNmspId = res.data.rdfNmspId;
      state.rdfProperty.rdfPrpty = res.data.rdfPrpty;
      state.rdfProperty.rdfPrptyNm = res.data.rdfPrptyNm;
      state.rdfProperty.rdfPrptyDesc = res.data.rdfPrptyDesc;
      state.rdfProperty.rdfPrptyLogicNm = res.data.rdfPrptyLogicNm;
      state.rdfProperty.upRdfPrptyId = res.data.upRdfPrptyId;
      state.rdfProperty.upRdfPrpty = res.data.upRdfPrpty;
      state.rdfProperty.rdfPrpty = res.data.rdfPrpty;
      state.rdfProperty.rdfPrptyRegrId = res.data.rdfPrptyRegrId;
      state.rdfProperty.rdfPrptyRegDt = res.data.rdfPrptyRegDt;
      state.rdfProperty.rdfPrptyAmdrId = res.data.rdfPrptyAmdrId;
      state.rdfProperty.rdfPrptyAmdDt = res.data.rdfPrptyAmdDt;
      state.rdfProperty.rdfPrptyRegrInfo =
        res.data.rdfPrptyRegrId + " / " + res.data.rdfPrptyRegDt;
      state.rdfProperty.rdfPrptyAmdrInfo =
        res.data.rdfPrptyAmdrId + " / " + res.data.rdfPrptyAmdDt;
      state.rdfProperty.rdfFormMtcds = res.data.rdfFormMtcds;
      state.rdfProperty.rdfFormMtcdArray = parseStrToArr(res.data.rdfFormMtcds);
    })
    .catch((err) => {
      console.log(err);
    });
};

const closeDialogModify = () => {
  dialogModify.value = false;
};

onMounted(() => {
  getCodeList();
  getMetaCodeGroupList();
  getRdfNamespaceList();
  getRdfPropertyList();
});

const searchUpRdfPropertyList = (payload) => {
  upRdfPropertyListPageInfo.value = {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  };
  upRdfPropertyListSearchInfo.value = payload;
  getUpRdfPropertyList(true);
};

const searchUpRdfPropertyListModify = (payload) => {
  upRdfPropertyListPageInfoModify.value = {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  };
  upRdfPropertyListSearchInfoModify.value = payload;
  getUpRdfPropertyList(false);
};

const refresh = (editModeYn) => {
  if (editModeYn) {
    upRdfPropertyListPageInfo.value = {
      curPage: 1,
      totalListSize: 0,
      pageListSize: 10,
    };

    upRdfPropertyListSearchInfo.value = {
      searchPrptyNm: "",
      rdfFormMtcd: "",
      rdfNmspId: "",
      searchAmdStDt: "",
      searchAmdEdDt: "",
    };
    getUpRdfPropertyList(true);
    return;
  }
  upRdfPropertyListPageInfoModify.value = {
    curPage: 1,
    totalListSize: 0,
    pageListSize: 10,
  };

  upRdfPropertyListSearchInfoModify.value = {
    searchPrptyNm: "",
    rdfFormMtcd: "",
    rdfNmspId: "",
    searchAmdStDt: "",
    searchAmdEdDt: "",
  };
  getUpRdfPropertyList(false);
};

const deleteRdfPropertyDefine = (rdfPrptyDefId, tag) => {
  let list = [rdfPrptyDefId];
  const serializedIds = list.map((id) => `id=${id}`).join("&");
  $axios
    .delete(
      `${$apiUrls.meta.rdf.property.deletePropertyDefineList}?${serializedIds}`
    )
    .then(() => {
      dynamicTags.value.splice(dynamicTags.value.indexOf(tag), 1);
      getRangeRdfPropertyDefineList(state.rdfProperty.rdfPrptyId);
      alert("삭제되었습니다.");      
    })
    .catch((err) => {
      console.log(err);
      if (err.response.status === 422 || err.response.status === 400) {
        alert(err.response.data.message);
      } else {
        alert("삭제에 실패하였습니다.");
      }
    });
};

const dynamicTags = ref([]);
const handleDeleteDefine = (tag) => {
  if (!confirm('삭제하시겠습니까?')) return;
  deleteRdfPropertyDefine(tag.rdfPrptyDefId, tag);
};

const handleDeleteDefineEditMode = (tag) => {
  state.editInfo.rdfClassList.splice(state.editInfo.rdfClassList.indexOf(tag));
};

const dynamicTagsDomain = ref([]);

const getDomainRdfPropertyDefineList = (rdfPrptyId) => {
  let param = Object.assign({
    rdfPrptyId: rdfPrptyId,
    domnRangeDivMtcd: "domain",
    isPaging: false,
  });
  $axios
    .get($apiUrls.meta.rdf.property.getPropertyDefineList, {
      params: param,
    })
    .then((res) => {
      dynamicTagsDomain.value = [];
      for (let i = 0; i < res.data.list.length; ++i) {
        dynamicTagsDomain.value[i] = {
          rdfClass: res.data.list[i].rdfClass,
          rdfPrptyDefId: res.data.list[i].rdfPrptyDefId,
        };
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
</script>
<style lang="scss"></style>