<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>Virtuoso (버투소)</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table btn-table">
          <el-form label-position="right"
            label-width="220px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="24">
                <el-form-item label="버투소 서버">
                  <el-button type="primary" class="mt10 mb10" @click="handleClickVirtuoso"
                    >새 창 열기</el-button
                  >
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="연결 테스트">
                  <div class="inline-area mt10 mb10" >
                    <el-button type="primary"
                      @click="handleClickConnectVirtuoso"
                      >연결테스트</el-button
                    >
                    <span class="ml15"
                      >※ 버투소는 사용시에만 연결됩니다. 버투소 서버에 정상적으로 연결되는지 테스트합니다.</span
                    >
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="특정 메타데이터셋 등록 (upsert)">
                  <div class="inline-area mt10 mb10" >
                    <el-input
                      style="width: 230px"
                      v-model="state.virtusoEditInfo.medataSetId"
                      placeholder=""
                      disabled
                    >
                    </el-input>
                    <el-input class="ml10"
                      style="width: 230px"
                      v-model="state.virtusoEditInfo.medataSetNm"
                      placeholder=""
                      disabled
                    >
                    </el-input>
                    <el-button type="default" class="ml10" @click="handleClickMetaDataSetPopup(true, true)">
                      <el-icon class="icon icon-search"></el-icon>
                    </el-button>
                    <el-button type="delete" @click="handleClickDeleteMetaDataSet(true, true)"
                      ><el-icon class="icon icon-refresh"></el-icon
                    ></el-button>
                    <el-button type="primary"
                      @click="saveToGraph(true)"
                      v-show="isAmdYn(route.meta.auth)"
                      >그래프에 저장</el-button
                    >
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="특정 메타데이터셋 삭제">
                  <div class="inline-area mt10 mb10">
                    <el-input
                      style="width: 230px"
                      v-model="state.virtusoDeleteInfo.medataSetId"
                      placeholder=""
                      disabled
                    >
                    </el-input>
                    <el-input class="ml10"
                      style="width: 230px"
                      v-model="state.virtusoDeleteInfo.medataSetNm"
                      placeholder=""
                      disabled
                    >
                    </el-input>
                    <el-button type="default" class="ml10"
                      @click="handleClickMetaDataSetPopup(true, false)"
                      ><el-icon class="icon icon-search"></el-icon
                    ></el-button>
                    <el-button type="delete" @click="handleClickDeleteMetaDataSet(true, false)"
                    >
                      <el-icon class="icon icon-refresh"></el-icon>
                    </el-button>
                    <el-button type="primary"
                      @click="deleteFromGraph(true)"
                      v-show="isDelYn(route.meta.auth)"
                      >그래프에서 삭제</el-button
                    >
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="전체 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="danger"
                      @click="resetVirtuosoGraph"
                      v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15"
                      >※ 버투소 그래프를 초기화합니다. 전체 내용을 삭제 후, "사용" 상태인 메타데이터 셋 들의 정보를 등록합니다. 
                      <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                    >
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.virtuosoGraphInitResult == true">성공</div>
                    <div v-else-if="state.virtuosoGraphInitResult == false">
                      실패<br />
                      {{ state.virtuosoGraphInitResultErrMsg }}
                    </div>
                    <div v-else-if="state.virtuosoGraphInitResult == 'ING'">
                      처리 중
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="RDF 네임스페이스 정보 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="danger"
                      @click="resetVirtuosoNsGraph"
                      v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15"
                      >※ 버투소 그래프를 초기화합니다. 기존 RDF 네임스페이스 정보를 삭제 후, 시스템에서 정의한 RDF 네임스페이스 정보를 등록합니다. 
                      <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                    >
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.virtuosoNsGraphInitResult == true">성공</div>
                    <div v-else-if="state.virtuosoNsGraphInitResult == false">
                      실패<br />
                      {{ state.virtuosoNsGraphInitResultErrMsg }}
                    </div>
                    <div v-else-if="state.virtuosoNsGraphInitResult == 'ING'">
                      처리 중
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="카테고리 정보 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="danger"
                      @click="resetVirtuosoSkosGraph"
                      v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15"
                      >※ 버투소 그래프를 초기화합니다. 기존 카테고리 정보를 삭제 후, 시스템에서 정의한 카테고리 정보를 등록합니다. 
                      <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                    >
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.virtuosoSkosGraphInitResult == true">성공</div>
                    <div v-else-if="state.virtuosoSkosGraphInitResult == false">
                      실패<br />
                      {{ state.virtuosoSkosGraphInitResultErrMsg }}
                    </div>
                    <div v-else-if="state.virtuosoSkosGraphInitResult == 'ING'">
                      처리 중
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
    </div>
    <div class="boxLayout">
      <div class="boxTit">
        <h3>Neo4j</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <el-form label-position="right"
            label-width="220px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="24">
                <el-form-item label="Neo4j 서버">
                  <el-button type="primary" class="mt10 mb10" @click="handleClickNeo4j"
                    >새 창 열기</el-button
                  >
                </el-form-item>
              </el-col>
            </el-row>
            <div class="boxLayout">
              <div class="boxTit">
                <h3>메타데이터 그래프</h3>
              </div>
              <div class="boxCnt">
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="특정 메타데이터셋 등록 (upsert)"  >
                      <div class="inline-area mt10 mb10">
                        <el-input
                          style="width: 230px"
                          v-model="state.neo4jRdbEditInfo.medataSetId"
                          placeholder=""
                          disabled
                        >
                        </el-input>
                        <el-input class="ml10"
                          style="width: 230px"
                          v-model="state.neo4jRdbEditInfo.medataSetNm"
                          placeholder=""
                          disabled
                        >
                        </el-input>
                        <el-button type="default" class="ml10"
                          @click="handleClickRdbMetaDataSetPopup(false, true)"
                        >
                          <el-icon  class="icon icon-search"></el-icon>
                        </el-button>
                        <el-button  type="delete" @click="handleClickRdbDeleteMetaDataSet(true)"
                          ><el-icon  class="icon icon-refresh"></el-icon
                        ></el-button>
                        <el-button type="primary"
                          @click="saveToRdbGraph()"
                          v-show="isAmdYn(route.meta.auth)"
                          >메타데이터 그래프에 저장</el-button
                        >
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="특정 메타데이터셋 삭제">
                      <div class="inline-area mt10 mb10">
                        <el-input
                          style="width: 230px"
                          v-model="state.neo4jRdbDeleteInfo.medataSetId"
                          placeholder=""
                          disabled
                        >
                        </el-input>
                        <el-input class="ml10"
                          style="width: 230px"
                          v-model="state.neo4jRdbDeleteInfo.medataSetNm"
                          placeholder=""
                          disabled
                        >
                        </el-input>
                        <el-button type="default" class="ml10" @click="handleClickRdbMetaDataSetPopup(false, false)"
                          ><el-icon class="icon icon-search"></el-icon
                        ></el-button>
                        <el-button type="delete" @click="handleClickRdbDeleteMetaDataSet(false)"
                        >
                          <el-icon class="icon icon-refresh"></el-icon>
                        </el-button>
                        <el-button type="primary"
                          @click="deleteFromRdbGraph()"
                          v-show="isDelYn(route.meta.auth)"
                          >메타데이터 그래프에서 삭제</el-button
                        >
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="메타데이터 그래프 초기화">
                      <div class="inline-area mt10 mb10">
                        <el-button type="danger"
                          @click="resetNeo4jRdbGraph"
                          v-show="isDelYn(route.meta.auth)"
                          >초기화</el-button
                        >
                        <span class="ml15"
                          >※ Neo4j 메타데이터 그래프를 초기화합니다. 전체 내용을 삭제 후, "사용" 상태인 메타데이터 셋 들의 정보를 등록합니다.
                          <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                        >
                      </div>
                      <div class="inline-area mt10 mb10">
                        <div class="mr10">초기화 결과:</div>
                        <div v-if="state.neo4jRdbGraphInitResult == true">성공</div>
                        <div v-else-if="state.neo4jRdbGraphInitResult == false">
                          실패<br />
                          {{ state.neo4jRdbGraphInitResultErrMsg }}
                        </div>
                        <div v-else-if="state.neo4jRdbGraphInitResult == 'ING'">
                          처리 중
                        </div>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </div>
            <div class="boxLayout">
              <div class="boxTit">
                <h3>RDF 그래프</h3>
              </div>
              <div class="boxCnt">
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="특정 메타데이터셋 등록 (upsert)"  >
                      <div class="inline-area mt10 mb10">
                        <el-input
                          style="width: 230px"
                          v-model="state.neo4jEditInfo.medataSetId"
                          placeholder=""
                          disabled
                        >
                        </el-input>
                        <el-input class="ml10"
                          style="width: 230px"
                          v-model="state.neo4jEditInfo.medataSetNm"
                          placeholder=""
                          disabled
                        >
                        </el-input>
                        <el-button type="default" class="ml10"
                          @click="handleClickMetaDataSetPopup(false, true)"
                        >
                          <el-icon  class="icon icon-search"></el-icon>
                        </el-button>
                        <el-button  type="delete" @click="handleClickDeleteMetaDataSet(false, true)"
                          ><el-icon  class="icon icon-refresh"></el-icon
                        ></el-button>
                        <el-button type="primary"
                          @click="saveToGraph(false)"
                          v-show="isAmdYn(route.meta.auth)"
                          >RDF 그래프에 저장</el-button
                        >
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="특정 메타데이터셋 삭제">
                      <div class="inline-area mt10 mb10">
                        <el-input
                          style="width: 230px"
                          v-model="state.neo4jDeleteInfo.medataSetId"
                          placeholder=""
                          disabled
                        >
                        </el-input>
                        <el-input class="ml10"
                          style="width: 230px"
                          v-model="state.neo4jDeleteInfo.medataSetNm"
                          placeholder=""
                          disabled
                        >
                        </el-input>
                        <el-button type="default" class="ml10" @click="handleClickMetaDataSetPopup(false, false)"
                          ><el-icon class="icon icon-search"></el-icon
                        ></el-button>
                        <el-button type="delete" @click="handleClickDeleteMetaDataSet(false, false)"
                        >
                          <el-icon class="icon icon-refresh"></el-icon>
                        </el-button>
                        <el-button type="primary"
                          @click="deleteFromGraph(false)"
                          v-show="isDelYn(route.meta.auth)"
                          >RDF 그래프에서 삭제</el-button
                        >
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="RDF 그래프 초기화">
                      <div class="inline-area mt10 mb10">
                        <el-button type="danger"
                          @click="resetNeo4jGraph"
                          v-show="isDelYn(route.meta.auth)"
                          >초기화</el-button
                        >
                        <span class="ml15"
                          >※ Neo4j RDF 그래프를 초기화합니다. 전체 내용을 삭제 후, "사용" 상태인 메타데이터 셋 들의 정보를 등록합니다.
                          <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                        >
                      </div>
                      <div class="inline-area mt10 mb10">
                        <div class="mr10">초기화 결과:</div>
                        <div v-if="state.neo4jGraphInitResult == true">성공</div>
                        <div v-else-if="state.neo4jGraphInitResult == false">
                          실패<br />
                          {{ state.neo4jGraphInitResultErrMsg }}
                        </div>
                        <div v-else-if="state.neo4jGraphInitResult == 'ING'">
                          처리 중
                        </div>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </div>
  <el-dialog v-model="dialogVisibleMetaDataSet" title="메타데이터 셋 검색">
    <div class="dialog-area">
      <MetadataSetDialogSearch @selectedRow="selectedRow" />
    </div>
  </el-dialog>
</template>
<script setup>
import MetadataSetDialogSearch from "@/components/meta/dt/MetadataSetDialogSearch.vue";

import {
  ref,
  reactive,
  onMounted,
  computed,
  watch,
  defineProps,
  defineEmits,
} from "vue";
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
import { getUser, getUsers } from "@/assets/js/auth.js";
import util from "util";
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const route = useRoute();

const dialogVisibleMetaDataSet = ref(false);

const state = reactive({
  virtusoEditInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  virtusoDeleteInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  neo4jRdbEditInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  neo4jRdbDeleteInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  neo4jEditInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  neo4jDeleteInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  virtuosoYn: null,
  editYn: null,
  virtuosoGraphInitResult: null,
  virtuosoGraphInitResultErrMsg: "",
  virtuosoNsGraphInitResult: null,
  virtuosoNsGraphInitResultErrMsg: "",
  virtuosoSkosGraphInitResult: null,
  virtuosoSkosGraphInitResultErrMsg: "",
  neo4jGraphInitResult: null,
  neo4jGraphInitResultErrMsg: "",
  neo4jRdbGraphInitResult: null,
  neo4jRdbGraphInitResultErrMsg: "",
});

const handleClickVirtuoso = () => {
  $axios
    .get(util.format($apiUrls.meta.rdf.virtuoso.getVirtuosoConductorUrl))
    .then((res) => {
      console.log(res.data);
      window.open(res.data.url);
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleClickConnectVirtuoso = async () => {
  const res = await $axios.get($apiUrls.meta.rdf.virtuoso.connectVirtuoso);
  if (res.data == true) {
    alert("연결 성공");
    return;
  }
  alert("연결 실패");
};

const handleClickNeo4j = () => {
  $axios
    .get(util.format($apiUrls.meta.rdf.neo4j.getNeo4jBrowserUrl))
    .then((res) => {
      console.log(res.data);
      window.open(res.data.url);
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleClickMetaDataSetPopup = (virtuosoYn, editYn) => {
  state.virtuosoYn = virtuosoYn;
  state.editYn = editYn;
  state.rdbYn = false;
  dialogVisibleMetaDataSet.value = true;
};

const handleClickRdbMetaDataSetPopup = (virtuosoYn, editYn) => {
  state.virtuosoYn = virtuosoYn;
  state.editYn = editYn;
  state.rdbYn = true;
  dialogVisibleMetaDataSet.value = true;
};

const handleClickDeleteMetaDataSet = (virtuosoYn, editYn) => {
  if (virtuosoYn) {
    if (editYn) {
      state.virtusoEditInfo.medataSetId = "";
      state.virtusoEditInfo.medataSetNm = "";
      state.virtusoEditInfo.medataSetSttusMtcdNm = "";
      return;
    }
    state.virtusoDeleteInfo.medataSetId = "";
    state.virtusoDeleteInfo.medataSetNm = "";
    state.virtusoDeleteInfo.medataSetSttusMtcdNm = "";
    return;
  }
  if (editYn) {
    state.neo4jEditInfo.medataSetId = "";
    state.neo4jEditInfo.medataSetNm = "";
    state.neo4jEditInfo.medataSetSttusMtcdNm = "";
    return;
  }
  state.neo4jDeleteInfo.medataSetId = "";
  state.neo4jDeleteInfo.medataSetNm = "";
  state.neo4jDeleteInfo.medataSetSttusMtcdNm = "";
};

const handleClickRdbDeleteMetaDataSet = (editYn) => {
  if (editYn) {
    state.neo4jRdbEditInfo.medataSetId = "";
    state.neo4jRdbEditInfo.medataSetNm = "";
    state.neo4jRdbEditInfo.medataSetSttusMtcdNm = "";
    return;
  }
  else {
    state.neo4jRdbDeleteInfo.medataSetId = "";
    state.neo4jRdbDeleteInfo.medataSetNm = "";
    state.neo4jRdbDeleteInfo.medataSetSttusMtcdNm = "";
    return;
  }
};

const saveToGraph = (virtuosoYn) => {
  if (virtuosoYn) {
    if (
      state.virtusoEditInfo.medataSetId == null ||
      state.virtusoEditInfo.medataSetId == ""
    ) {
      alert("등록할 메타데이터 셋을 선택해주세요.");
      return;
    }
    if (
      confirm(
        state.virtusoEditInfo.medataSetNm +
          "(상태:" +
          state.virtusoEditInfo.medataSetSttusMtcdNm +
          ") 을 그래프에 저장하시겠습니까?"
      ) == false
    ) {
      return;
    }
    $axios
      .put(
        util.format(
          $apiUrls.meta.rdf.virtuoso.createRdfInfoToVirtuoso,
          state.virtusoEditInfo.medataSetId
        )
      )
      .then((res) => {
        alert("저장 성공했습니다.");
        state.virtusoEditInfo.medataSetId = "";
        state.virtusoEditInfo.medataSetNm = "";
        state.virtusoEditInfo.medataSetSttusMtcdNm = "";
      })
      .catch((err) => {
        console.log(err);
        alert("저장 실패했습니다.");
      });
    return;
  }

  if (
    state.neo4jEditInfo.medataSetId == null ||
    state.neo4jEditInfo.medataSetId == ""
  ) {
    alert("등록할 메타데이터 셋을 선택해주세요.");
    return;
  }
  if (
    confirm(
      state.neo4jEditInfo.medataSetNm +
        "(상태:" +
        state.neo4jEditInfo.medataSetSttusMtcdNm +
        ") 을 RDF 그래프에 저장하시겠습니까?"
    ) == false
  ) {
    return;
  }
  $axios
    .put(
      util.format(
        $apiUrls.meta.rdf.neo4j.createRdfInfoToNeo4j,
        state.neo4jEditInfo.medataSetId
      )
    )
    .then((res) => {
      alert("저장 성공했습니다.");

      state.neo4jEditInfo.medataSetId = "";
      state.neo4jEditInfo.medataSetNm = "";
      state.neo4jEditInfo.medataSetSttusMtcdNm = "";
    })
    .catch((err) => {
      console.log(err);
      alert("저장 실패했습니다.");
    });
};

const saveToRdbGraph = () => {

  if (
    state.neo4jRdbEditInfo.medataSetId == null ||
    state.neo4jRdbEditInfo.medataSetId == ""
  ) {
    alert("등록할 메타데이터 셋을 선택해주세요.");
    return;
  }
  if (
    confirm(
      state.neo4jRdbEditInfo.medataSetNm +
        "(상태:" +
        state.neo4jRdbEditInfo.medataSetSttusMtcdNm +
        ") 을 RDB 그래프에 저장하시겠습니까?"
    ) == false
  ) {
    return;
  }
  $axios
    .put(
      util.format(
        $apiUrls.meta.rdf.neo4j.createRdfInfoToRdbNeo4j,
        state.neo4jRdbEditInfo.medataSetId
      )
    )
    .then((res) => {
      alert("저장 성공했습니다.");

      state.neo4jRdbEditInfo.medataSetId = "";
      state.neo4jRdbEditInfo.medataSetNm = "";
      state.neo4jRdbEditInfo.medataSetSttusMtcdNm = "";
    })
    .catch((err) => {
      console.log(err);
      alert("저장 실패했습니다.");
    });
};

const deleteFromGraph = (virtuosoYn) => {
  if (virtuosoYn) {
    if (
      state.virtusoDeleteInfo.medataSetId == null ||
      state.virtusoDeleteInfo.medataSetId == ""
    ) {
      alert("삭제할 메타데이터 셋을 선택해주세요.");
      return;
    }
    $axios
      .delete(
        util.format(
          $apiUrls.meta.rdf.virtuoso.createRdfInfoToVirtuoso,
          state.virtusoDeleteInfo.medataSetId
        )
      )
      .then((res) => {
        alert("삭제 성공했습니다.");
        state.virtusoDeleteInfo.medataSetId = "";
        state.virtusoDeleteInfo.medataSetNm = "";
        state.virtusoDeleteInfo.medataSetSttusMtcdNm = "";
      })
      .catch((err) => {
        console.log(err);
        alert("삭제 실패했습니다.");
      });
    return;
  }

  if (
    state.neo4jDeleteInfo.medataSetId == null ||
    state.neo4jDeleteInfo.medataSetId == ""
  ) {
    alert("삭제할 메타데이터 셋을 선택해주세요.");
    return;
  }
  $axios
    .delete(
      util.format(
        $apiUrls.meta.rdf.neo4j.deleteRdfInfoToNeo4j,
        state.neo4jDeleteInfo.medataSetId
      )
    )
    .then((res) => {
      alert("삭제 성공했습니다.");
      state.neo4jDeleteInfo.medataSetId = "";
      state.neo4jDeleteInfo.medataSetNm = "";
      state.neo4jDeleteInfo.medataSetSttusMtcdNm = "";
    })
    .catch((err) => {
      console.log(err);
      alert("삭제 실패했습니다.");
    });
};

const deleteFromRdbGraph = () => {

  if (
    state.neo4jRdbDeleteInfo.medataSetId == null ||
    state.neo4jRdbDeleteInfo.medataSetId == ""
  ) {
    alert("삭제할 메타데이터 셋을 선택해주세요.");
    return;
  }
  $axios
    .delete(
      util.format(
        $apiUrls.meta.rdf.neo4j.deleteRdfInfoToRdbNeo4j,
        state.neo4jRdbDeleteInfo.medataSetId
      )
    )
    .then((res) => {
      alert("삭제 성공했습니다.");
      state.neo4jRdbDeleteInfo.medataSetId = "";
      state.neo4jRdbDeleteInfo.medataSetNm = "";
      state.neo4jRdbDeleteInfo.medataSetSttusMtcdNm = "";
    })
    .catch((err) => {
      console.log(err);
      alert("삭제 실패했습니다.");
    });
};

const selectedRow = (data) => {
  if (state.virtuosoYn == true) {
    if (state.editYn) {
      state.virtusoEditInfo = JSON.parse(JSON.stringify(data.rowData));
      dialogVisibleMetaDataSet.value = false;
      return;
    }
    state.virtusoDeleteInfo = JSON.parse(JSON.stringify(data.rowData));
    dialogVisibleMetaDataSet.value = false;
    return;
  }
  else{
    if (state.rdbYn){
      if (state.editYn) {
        state.neo4jRdbEditInfo = JSON.parse(JSON.stringify(data.rowData));
        dialogVisibleMetaDataSet.value = false;
        return;
      }
      state.neo4jRdbDeleteInfo = JSON.parse(JSON.stringify(data.rowData));
      dialogVisibleMetaDataSet.value = false;
      return;
    }
    else{
      if (state.editYn) {
        state.neo4jEditInfo = JSON.parse(JSON.stringify(data.rowData));
        dialogVisibleMetaDataSet.value = false;
        return;
      }
      state.neo4jDeleteInfo = JSON.parse(JSON.stringify(data.rowData));
      dialogVisibleMetaDataSet.value = false;
      return;
    }
  }
};

const resetNeo4jGraph = () => {
  if (!confirm("neo4j 그래프(RDF)를 초기화하시겠습니까?")) {
    return;
  }
  state.neo4jGraphInitResult = "ING";
  $axios
    .put(util.format($apiUrls.meta.rdf.neo4j.initializeNeo4jGraph))
    .then((res) => {
      console.log(res.data);
      alert("neo4j 그래프(RDF) 초기화 성공했습니다.");
      state.neo4jGraphInitResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("neo4j 그래프(RDF) 초기화 실패했습니다.");
      state.neo4jGraphInitResult = false;
      state.neo4jGraphInitResultErrMsg = err.message;
    });
};

const resetNeo4jRdbGraph = () => {
  if (!confirm("neo4j 그래프(RDB)를 초기화하시겠습니까?")) {
    return;
  }
  state.neo4jRdbGraphInitResult = "ING";
  $axios
    .put(util.format($apiUrls.meta.rdf.neo4j.initializeNeo4jRdbGraph))
    .then((res) => {
      console.log(res.data);
      alert("neo4j 그래프(RDB) 초기화 성공했습니다.");
      state.neo4jRdbGraphInitResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("neo4j 그래프(RDB) 초기화 실패했습니다.");
      state.neo4jRdbGraphInitResult = false;
      state.neo4jRdbGraphInitResultErrMsg = err.message;
    });
};

const resetVirtuosoGraph = () => {
  if (!confirm("버투소 그래프를 전체 초기화하시겠습니까?")) {
    return;
  }
  state.virtuosoGraphInitResult = "ING";
  $axios
    .put(util.format($apiUrls.meta.rdf.virtuoso.initializeVirtuoso))
    .then((res) => {
      console.log(res.data);
      alert("virtuoso 그래프 전체 초기화 성공했습니다.");
      state.virtuosoGraphInitResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("virtuoso 그래프 전체 초기화 실패했습니다.");
      state.virtuosoGraphInitResult = false;
      state.virtuosoGraphInitResultErrMsg = err.message;
    });
};

const resetVirtuosoNsGraph = () => {
  if (!confirm("버투소 그래프의 RDF 네임스페이스 정보를 초기화하시겠습니까?")) {
    return;
  }
  state.virtuosoNsGraphInitResult = "ING";
  $axios
    .put(util.format($apiUrls.meta.rdf.virtuoso.initializeNsOfVirtuoso))
    .then((res) => {
      console.log(res.data);
      alert("virtuoso 그래프의 RDF 네임스페이스 정보 초기화 성공했습니다.");
      state.virtuosoNsGraphInitResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("virtuoso 그래프의 RDF 네임스페이스 정보 초기화 실패했습니다.");
      state.virtuosoNsGraphInitResult = false;
      state.virtuosoNsGraphInitResultErrMsg = err.message;
    });
};

const resetVirtuosoSkosGraph = () => {
  if (!confirm("버투소 그래프의 카테고리 정보를 초기화하시겠습니까?")) {
    return;
  }
  state.virtuosoSkosGraphInitResult = "ING";
  $axios
    .put(util.format($apiUrls.meta.rdf.virtuoso.initializeSkosOfVirtuoso))
    .then((res) => {
      console.log(res.data);
      alert("virtuoso 그래프의 카테고리 정보 초기화 성공했습니다.");
      state.virtuosoSkosGraphInitResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("virtuoso 그래프의 카테고리 정보 초기화 실패했습니다.");
      state.virtuosoSkosGraphInitResult = false;
      state.virtuosoSkosGraphInitResultErrMsg = err.message;
    });
};
</script>
<style lang="scss" scoped></style>
