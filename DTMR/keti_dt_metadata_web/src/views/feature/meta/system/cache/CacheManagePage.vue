<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>모델 캐시</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <el-form label-position="right"
            label-width="230px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="24">
                <el-form-item label="모델 목록 캐시 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="primary" plain
                      @click="resetModelListCache"
                      v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15">※ 모델 목록 전체를 캐시에서 삭제합니다. </span>
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.modelListResult == true">성공</div>
                    <div v-else-if="state.modelListResult == false">
                      실패<br />
                      {{ state.modelListResultErrMsg }}
                    </div>
                    <div v-else-if="state.modelListResult == 'ING'">
                      처리 중
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="24">
                <el-form-item label="유형 모델 정보 캐시 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="primary" plain
                      @click="resetTypeModelCache"
                      v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15">※ 유형 모델 정보 전체를 캐시에서 삭제합니다. </span>
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.typeModelResult == true">성공</div>
                    <div v-else-if="state.typeModelResult == false">
                      실패<br />
                      {{ state.typeModelResultErrMsg }}
                    </div>
                    <div v-else-if="state.typeModelResult == 'ING'">
                      처리 중
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="24">
                <el-form-item label="모델 정보 캐시 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="primary" plain
                      @click="resetModelInfoCache"
                      v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15">※ 모델 정보 전체를 캐시에서 삭제합니다. </span>
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.modelResult == true">성공</div>
                    <div v-else-if="state.modelResult == false">
                      실패<br />
                      {{ state.modelResultErrMsg }}
                    </div>
                    <div v-else-if="state.modelResult == 'ING'">
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
        <h3>프라퍼티 캐시</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <el-form label-position="right"
            label-width="230px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="24">
                <el-form-item label="프라퍼티 캐시 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="primary" plain
                      @click="resetPropertyInfoCache"
                      v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15">※ 프라퍼티 정보 전체를 캐시에서 삭제합니다. </span>
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.propertyResult == true">성공</div>
                    <div v-else-if="state.propertyResult == false">
                      실패<br />
                      {{ state.propertyResultErrMsg }}
                    </div>
                    <div v-else-if="state.propertyResult == 'ING'">
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
        <h3>RDF 매핑 캐시</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <el-form label-position="right"
            label-width="230px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="24">
                <el-form-item label="RDF 매핑 캐시 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="primary" plain
                      @click="resetRdfInfoCache"
                      v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15">※ RDF 매핑 정보 전체를 캐시에서 삭제합니다. </span>
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.rdfResult == true">성공</div>
                    <div v-else-if="state.rdfResult == false">
                      실패<br />
                      {{ state.rdfResultErrMsg }}
                    </div>
                    <div v-else-if="state.rdfResult == 'ING'">
                      처리 중
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="24">
                <el-form-item label="RDF 매핑 모델 캐시 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="primary" plain
                      @click="resetRdfModelInfoCache"
                      v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15">※ RDF 매핑 모델 정보 전체를 캐시에서 삭제합니다. </span>
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.rdfModelResult == true">성공</div>
                    <div v-else-if="state.rdfModelResult == false">
                      실패<br />
                      {{ state.rdfModelResultErrMsg }}
                    </div>
                    <div v-else-if="state.rdfModelResult == 'ING'">
                      처리 중
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="24">
                <el-form-item label="RDF 매핑 규칙 캐시 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="primary" plain
                      @click="resetRdfRuleInfoCache"
                      v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15">※ RDF 매핑 규칙 정보 전체를 캐시에서 삭제합니다. </span>
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.rdfRuleResult == true">성공</div>
                    <div v-else-if="state.rdfRuleResult == false">
                      실패<br />
                      {{ state.rdfRuleResultErrMsg }}
                    </div>
                    <div v-else-if="state.rdfRuleResult == 'ING'">
                      처리 중
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="24">
                <el-form-item label="RDF 매핑 네임스페이스 캐시 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="primary" plain
                      @click="resetRdfNamespaceInfoCache"
                      v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15">※ RDF 매핑 네임스페이스 정보 전체를 캐시에서 삭제합니다. </span>
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.rdfNamespaceResult == true">성공</div>
                    <div v-else-if="state.rdfNamespaceResult == false">
                      실패<br />
                      {{ state.rdfNamespaceResultErrMsg }}
                    </div>
                    <div v-else-if="state.rdfNamespaceResult == 'ING'">
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
        <h3>코드 캐시</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <el-form label-position="right"
            label-width="230px"
            class="demo-ruleForm"
          >
            <el-row>
              <el-col :span="24">
                <el-form-item label="코드 캐시 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="primary" plain
                      @click="resetCodeInfoCache"
                      v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15">※ 코드 그룹 정보와 코드 정보 전체를 캐시에서 삭제합니다. </span>
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.codeResult == true">성공</div>
                    <div v-else-if="state.codeResult == false">
                      실패<br />
                      {{ state.codeResultErrMsg }}
                    </div>
                    <div v-else-if="state.codeResult == 'ING'">
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



  </div>
</template>
<script setup>

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
const store = useStore();

const state = reactive({
  modelListResult: null,
  modelListResultErrMsg: "",
  typeModelResult: null,
  typeModelResultErrMsg: "",
  modelResult: null,
  modelResultErrMsg: "",

  propertyResult: null,
  propertyResultErrMsg: "",

  rdfResult: null,
  rdfResultErrMsg: "",
  rdfModelResult: null,
  rdfModelResultErrMsg: "",
  rdfRuleResult: null,
  rdfRuleResultErrMsg: "",
  rdfNamespaceResult: null,
  rdfNamespaceResultErrMsg: "",

  codeResult: null,
  codeResultErrMsg: "",
});

const resetModelListCache = () => {
  if (!confirm("모델 목록 전체를 캐시에서 삭제하시겠습니까?")) {
    return;
  }
  state.modelListResult = "ING";
  $axios
    .delete(util.format($apiUrls.meta.portal.cache.removeModelListAll))
    .then((res) => {
      alert("모델 목록 전체를 캐시에서 삭제했습니다.");
      state.modelListResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("캐시에서 모델 목록 전체를 삭제하는 것에 실패했습니다.");
      state.modelListResult = false;
      state.modelListResultErrMsg = err.message;
    });
};

const resetTypeModelCache = () => {
  if (!confirm("유형 모델 정보 전체를 캐시에서 삭제하시겠습니까?")) {
    return;
  }
  state.typeModelResult = "ING";
  $axios
    .delete(util.format($apiUrls.meta.portal.cache.removeTypeModelAllByDataUri))
    .then((res) => {
      alert("유형 모델 정보 전체를 캐시에서 삭제했습니다.");
      state.typeModelResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("캐시에서 유형 모델 정보 전체를 삭제하는 것에 실패했습니다.");
      state.typeModelResult = false;
      state.typeModelResultErrMsg = err.message;
    });
};

const resetModelInfoCache = () => {
  if (!confirm("모델 정보 전체를 캐시에서 삭제하시겠습니까?")) {
    return;
  }
  state.modelResult = "ING";
  $axios
    .delete(util.format($apiUrls.meta.portal.cache.removeModelInfoAll))
    .then((res) => {
      alert("모델 정보 전체를 캐시에서 삭제했습니다.");
      state.modelResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("캐시에서 모델 정보 전체를 삭제하는 것에 실패했습니다.");
      state.modelResult = false;
      state.modelResultErrMsg = err.message;
    });
};









const resetPropertyInfoCache = () => {
  if (!confirm("프라퍼티 정보 전체를 캐시에서 삭제하시겠습니까?")) {
    return;
  }
  state.propertyResult = "ING";
  $axios
    .delete(util.format($apiUrls.meta.portal.cache.removeModelInfoAll))
    .then((res) => {
      alert("프라퍼티 정보 전체를 캐시에서 삭제했습니다.");
      state.propertyResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("캐시에서 프라퍼티 정보 전체를 삭제하는 것에 실패했습니다.");
      state.propertyResult = false;
      state.propertyResultErrMsg = err.message;
    });
};









const resetRdfInfoCache = () => {
  if (!confirm("RDF 매핑 정보 전체를 캐시에서 삭제하시겠습니까?")) {
    return;
  }
  state.rdfResult = "ING";
  $axios
    .delete(util.format($apiUrls.meta.portal.cache.removeModelInfoAll))
    .then((res) => {
      alert("RDF 매핑 정보 전체를 캐시에서 삭제했습니다.");
      state.rdfResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("캐시에서 RDF 매핑 정보 전체를 삭제하는 것에 실패했습니다.");
      state.rdfResult = false;
      state.rdfResultErrMsg = err.message;
    });
};

const resetRdfModelInfoCache = () => {
  if (!confirm("RDF 매핑 모델 정보 전체를 캐시에서 삭제하시겠습니까?")) {
    return;
  }
  state.rdfModelResult = "ING";
  $axios
    .delete(util.format($apiUrls.meta.portal.cache.removeModelInfoAll))
    .then((res) => {
      alert("RDF 매핑 모델 정보 전체를 캐시에서 삭제했습니다.");
      state.rdfModelResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("캐시에서 RDF 매핑 모델 정보 전체를 삭제하는 것에 실패했습니다.");
      state.rdfModelResult = false;
      state.rdfModelResultErrMsg = err.message;
    });
};

const resetRdfRuleInfoCache = () => {
  if (!confirm("RDF 매핑 규칙 정보 전체를 캐시에서 삭제하시겠습니까?")) {
    return;
  }
  state.rdfRuleResult = "ING";
  $axios
    .delete(util.format($apiUrls.meta.portal.cache.removeModelInfoAll))
    .then((res) => {
      alert("RDF 매핑 규칙 정보 전체를 캐시에서 삭제했습니다.");
      state.rdfRuleResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("캐시에서 RDF 매핑 규칙 정보 전체를 삭제하는 것에 실패했습니다.");
      state.rdfRuleResult = false;
      state.rdfRuleResultErrMsg = err.message;
    });
};

const resetRdfNamespaceInfoCache = () => {
  if (!confirm("RDF 매핑 네임스페이스 정보 전체를 캐시에서 삭제하시겠습니까?")) {
    return;
  }
  state.rdfNamespaceResult = "ING";
  $axios
    .delete(util.format($apiUrls.meta.portal.cache.removeModelInfoAll))
    .then((res) => {
      alert("RDF 매핑 네임스페이스 정보 전체를 캐시에서 삭제했습니다.");
      state.rdfNamespaceResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("캐시에서 RDF 매핑 네임스페이스 정보 전체를 삭제하는 것에 실패했습니다.");
      state.rdfNamespaceResult = false;
      state.rdfNamespaceResultErrMsg = err.message;
    });
};









const resetCodeInfoCache = () => {
  if (!confirm("코드 그룹 정보와 코드 정보 전체를 캐시에서 삭제하시겠습니까?")) {
    return;
  }
  state.codeResult = "ING";
  $axios
    .delete(util.format($apiUrls.meta.portal.cache.removeCodeGroupDtoAll))
    .then((res) => {
      alert("코드 그룹 정보와 코드 정보 전체를 캐시에서 삭제했습니다.");
      state.codeResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("캐시에서 코드 그룹 정보와 코드 정보 전체를 삭제하는 것에 실패했습니다.");
      state.codeResult = false;
      state.codeResultErrMsg = err.message;
    });
};

</script>
<style lang="scss" scoped></style>
