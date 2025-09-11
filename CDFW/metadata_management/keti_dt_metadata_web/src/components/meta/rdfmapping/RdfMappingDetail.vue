<template>
  <div class="boxLayout">
    <div class="boxTit">
      <h3>RDF 매핑 정보</h3>
    </div>
    <div class="boxCnt">
      <div class="btnSec taR mb10">
        <el-button type="primary" v-if="isAmdYn(route.meta.auth)" @click="modifyRdfMapping">수정</el-button>
        <el-button type="default" @click="goToList">목록</el-button>
      </div>

      <div class="ly-table">
        <el-form label-width="160px" :model="rdfMapping" label-position="right">
          <el-row>
            <el-col :span="12">
              <el-form-item label="RDF 매핑 형식"> 
                {{ rdfMapping.rdfFormMtcdNm }}
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="메타데이터 유형"> 
                {{ rdfMapping.typeModelNm }} {{ rdfMapping.modelLogicNm }}
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="12">
              <el-form-item label="매핑 명"> 
                {{ rdfMapping.rdfMappgNm }}
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="매핑 상태"> 
                {{ rdfMapping.rdfMappgDataSttusMtcdNm }}
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="12">
              <el-form-item label="등록정보"> 
                {{ rdfMapping.rdfMappgRegrId }} / {{ rdfMapping.rdfMappgRegDt }}
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="수정정보"> 
                {{ rdfMapping.rdfMappgAmdrId }} / {{ rdfMapping.rdfMappgAmdDt }}
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
  </div>

  <div class="boxLayout">
    <div class="boxTit">
      <h3>RDF 매핑 모델</h3>
    </div>
    <div class="boxCnt">
      <div class="inline-area mb10" style="justify-content: space-between; align-items:center;">
        <div class="taL">
          <span class="member-notice" style="vertical-align: middle;">row 클릭 시 해당 RDF 매핑 모델의 트리 구조가 하단 영역에 나타납니다. </span>
        </div>
        <div class="taR">        
          <span class="guide-text-red" style="vertical-align: middle; margin-right: 5px; ">※ 대표 모델이 반드시 1건 존재해야합니다.</span>         
          <el-button type="primary" v-show="isWriteYn(route.meta.auth)" @click="rdfMappingModelAdd">RDF 매핑 모델 추가</el-button>
        </div>
      </div>     
      <div class="ly-table">
        <el-table 
            :data="state.rdfMappingModelList" 
            row-key="rdfMappgModelId"
            border style="width: 100%"
            :highlight-current-row="true"
            :current-row-key="defaultRowKey"
            @row-click="modelRowClick"
          >
          <el-table-column prop="rdfClass" label="RDF Class" :min-width="80" />
          <el-table-column prop="rdfRepModelYn" label="대표 모델 여부" :min-width="30" />
          <el-table-column prop="condModelNm" label="조건 메타데이터 모델" :min-width="100" />
          <el-table-column label="수정" :min-width="20">
            <template #default="{ row }">
              <el-button type="primary" size="small" v-if="isAmdYn(route.meta.auth)" @click.stop @click="rdfMappingModelModify(row)">수정</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>

  <div v-if="state.treeTableVisible" class="boxSectionTit mt20">
    <h3> {{ state.selectedRdfClass }} </h3>
  </div>	

  <div v-if="state.treeTableVisible" class="boxLayout">
    <div class="boxTit">
      <h3>RDF - {{ rdfMapping.rdfFormMtcdNm }}</h3>
    </div>
    <div class="boxCnt">
      <div class="btnSec taR mb10">
        <el-button type="primary" plain v-show="isReadYn(route.meta.auth)" @click="modelPropertyView">모델 프라퍼티 보기</el-button>
        <el-button type="primary" plain v-show="isReadYn(route.meta.auth)" @click="getRdfStr">RDF 확인</el-button> 
      </div>      
      <div class="ly-table">
        <el-table
            :data="state.tableData"
            style="width: 100%; margin-bottom: 20px;"
            row-key="nodeId"
            border
            default-expand-all
          >
          <el-table-column label="RDF" :min-width="160" > 
            <template #default="{ row }">
              <img v-if="row.nodeDiv === 'c'" src="@/assets/images/meta/rdf/icon_rdf_c.png" />
              <img v-if="row.nodeDiv === 'm'" src="@/assets/images/meta/rdf/icon_rdf_m.png" />
              <img v-if="row.nodeDiv === 'p'" src="@/assets/images/meta/rdf/icon_rdf_p.png" />
              &nbsp;{{ row.nodeNm }}<span v-if="row.nodeDiv === 'p' && row.nodeObjtId !== null && row.nodeObjtId !== ''"> - {{ row.nodeObjtId }}</span>
            </template>
          </el-table-column>

          <el-table-column label="추가 & 매핑" :min-width="160">
            <template #default="{ row }">
              <el-button type="primary" size="small" v-if="row.nodeDiv === 'c' && isWriteYn(route.meta.auth)" @click="rdfPropertyAdd(row)">RDF 프라퍼티 추가</el-button>
              <el-button type="primary" size="small" v-if="row.nodeDiv === 'p' && isWriteYn(route.meta.auth)" @click="rdfClassAdd(row)">RDF 클래스 추가</el-button>
              <el-button type="primary" size="small" v-if="row.nodeDiv === 'p' && isWriteYn(route.meta.auth)" @click="typePropertyMapping(row)">유형 프라퍼티 매핑</el-button>                
              <el-button type="primary" size="small" v-if="row.nodeDiv === 'p' && isWriteYn(route.meta.auth)" @click="metaModelMapping(row)">메타데이터 모델명 매핑</el-button>
            </template>
          </el-table-column>
         
          <el-table-column label="순서 변경" :min-width="70">
            <template #default="{ row }">
              <el-button type="default" size="small" v-if="row.nodeDiv === 'p' && isAmdYn(route.meta.auth)" @click="rowUp(row)">▲ 위로</el-button>
              <el-button type="default" size="small" v-if="row.nodeDiv === 'p' && isAmdYn(route.meta.auth)" @click="rowDown(row)">▼ 아래로</el-button> 
            </template>
          </el-table-column>  
           
          <el-table-column label="삭제" :min-width="25">
            <template #default="{ row }">
                <el-button type="primary" plain size="small" v-if="row.nodeDiv === 'c' && row.nodeId !== 'ROOT' && isDelYn(route.meta.auth)" @click="cDelete(row)">삭제</el-button>
                <el-button type="primary" plain size="small" v-if="row.nodeDiv === 'p' && isDelYn(route.meta.auth)" @click="pDelete(row)">삭제</el-button>
              </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="taL">
        <span class="member-notice" style="vertical-align: middle;">※ 유형 프라퍼티 의 범위모델이 address 인 경우 schema:PostalAddress 객체로 매핑 됩니다. (schema:spatial, vcard:hasAddress 사용시)</span>
      </div>        
    </div>  
  </div>

  <div>
    <el-dialog title="RDF 매핑 수정" v-model="state.rdfMappingModifyVisible">
      <RdfMappingDialogModify 
        :rdfInfo="rdfMapping"
        :refreshKey="refreshKey"
        @cancelPopup="cancelPopup"
      />
    </el-dialog>
  </div>

  <div>
    <el-dialog title="RDF 매핑 모델 등록" v-model="state.rdfMappingModelEditVisible">
      <RdfMappingModelDialogEdit
        :rdfInfo="rdfMapping"
        :rdfMappingModelList="state.rdfMappingModelList"
        :refreshKey="refreshKey"
        @getRdfMappingModelList="getRdfMappingModelList"
        @cancelPopup="cancelPopup"
      />
    </el-dialog>
  </div>

  <div>
    <el-dialog title="RDF 매핑 모델 수정" v-model="state.rdfMappingModelModifyVisible">
      <RdfMappingModelDialogModify
        :rdfInfo="rdfMapping"
        :modifyInfo="state.modifyInfo"
        :rdfMappingModelList="state.rdfMappingModelList"
        @getRdfMappingModelList="getRdfMappingModelList"
        @deleteAction="deleteAction"
        @cancelPopup="cancelPopup"
      />
    </el-dialog>
  </div>

  <div>
    <el-dialog v-model="state.dialogVisibleClassSearch" title="RDF 클래스 검색">
      <RdfClassListPopupPage
        :searchMode="classSearchMode"
        :searchTypeFix="searchTypeFix"
        :rdfInfo="rdfMapping"
        @selectedRow="selectedRangeClass"
      /> 
    </el-dialog>
  </div>

  <div>
    <el-dialog v-model="state.dialogVisiblePropertySearch" title="RDF 프라퍼티 검색">
      <RdfPropertyListPopupPage
        :searchMode="propertySearchMode"
        :searchTypeFix="searchTypeFix"
        :rdfInfo="rdfMapping"
        @selectedRow="selectedDomainProperty"
      /> 
    </el-dialog>
  </div>

  <div>
    <el-dialog v-model="state.dialogVisibleModelPropertySearch" title="메타데이터 모델 프라퍼티 검색">
      <TypeModelPropertyListPopupPage
        :searchMode="modelPropertySearchMode"
        :searchModelDisabled="searchModelDisabled"
        :modelId="state.modelIdForTypeModelProperty"
        :modelNm="state.modelNmForTypeModelProperty"
        @selectedRow="selectedModelProperty"
      /> 
    </el-dialog>
  </div>

  <div>
    <el-dialog v-model="state.dialogVisibleRdfSearch" title="메타데이터 RDF 확인">
      <RdfViewPopupPage
      :searchParam="state.rdfSearchParam"
      :emptyPrptyShowYn="emptyPrptyShowYn"
      :refreshKey="refreshKey"
      /> 
    </el-dialog>
  </div>

</template>
<script setup>
import { defineProps, reactive, ref, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import { routerPush, getCookie, isWriteYn, isAmdYn, isReadYn, isDelYn, getGlobalProperties } from "@/assets/js/common.js";
import RdfMappingDialogModify from "@/components/meta/rdfmapping/RdfMappingDialogModify.vue";
import RdfMappingModelDialogEdit from "@/components/meta/rdfmapping/RdfMappingModelDialogEdit.vue";
import RdfMappingModelDialogModify from "@/components/meta/rdfmapping/RdfMappingModelDialogModify.vue";
import RdfClassListPopupPage from "@/views/feature/meta/setting/rdfclass/RdfClassListPopupPage.vue";
import RdfPropertyListPopupPage from "@/views/feature/meta/setting/rdfproperty/RdfPropertyListPopupPage.vue";
import TypeModelPropertyListPopupPage from "@/views/feature/meta/setting/datamodel/TypeModelPropertyListPopupPage.vue";
import RdfViewPopupPage from "@/views/feature/meta/setting/rdfmapping/RdfViewPopupPage.vue";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const router = useRouter();
const route = useRoute();
const store = useStore();

const refreshKey = ref({
  nowDate:  Date.now()
});
const defaultRowKey = ref(null);
const emptyPrptyShowYn = ref("Y");

const state = reactive({
  rdfMappingModelList: [],
  tableData: [],
  beforeSortTreeList: [],
  
  dialogVisibleRdfSearch: false,
  rdfMappingModifyVisible: false,
  rdfMappingModelEditVisible: false,
  rdfMappingModelModifyVisible: false,

  dialogVisibleClassSearch: false,
  dialogVisiblePropertySearch: false,
  dialogVisibleModelPropertySearch: false,

  treeTableVisible: false,

  rdfSearchParam: {},
  modifyInfo: {},

  selectedRdfInfo: {},
  selectedRdfMappgModelInfo: {},
  selectedRdfMappgModelId: "",
  modelIdForTypeModelProperty: "",
  modelNmForTypeModelProperty: "",
});

const props = defineProps({
  rdfMapping: {
    type: Object,
    required: true,
  },
});

onMounted(() => {
  getRdfMappingModelList(true);
});

const getRdfMappingModelList = (isFirst) => {
  state.rdfMappingModelEditVisible = false;
  state.rdfMappingModelModifyVisible = false;
  $axios
    .get($apiUrls.meta.rdf.mapping.getMappingModelList, {
      params: {
        rdfMappgId: route.query.rdfMappgId,
      },
    })
    .then((res) => {
      state.rdfMappingModelList = res.data.list;
      if(isFirst){
        if(state.rdfMappingModelList.length > 0) {
          modelRowClick(state.rdfMappingModelList[0]);
          defaultRowKey.value = state.rdfMappingModelList[0].rdfMappgModelId;
        }
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const deleteAction = () => {
  state.selectedRdfMappgModelInfo = {};
  state.selectedRdfClass = "";
  state.selectedRdfMappgModelId = "";
  state.treeTableVisible = false;
};

const getRdfStr = () => {
  if(state.rdfMappingModelList.length === 0) {
    alert("RDF 매핑 모델을 등록해야 합니다.");
    return;
  }
  if(state.selectedRdfMappgModelId === ""){
    alert("RDF 매핑 모델을 선택해주세요.");
    return;
  }

  refreshKey.value.nowDate = Date.now();
  state.dialogVisibleRdfSearch = true;

  if(state.selectedRdfMappgModelInfo.rdfRepModelYn === "Y") {
    state.rdfSearchParam.modelId = props.rdfMapping.typeModelId;
    state.rdfSearchParam.modelNm = props.rdfMapping.typeModelNm;
  }
  if(state.selectedRdfMappgModelInfo.rdfRepModelYn === "N") {
    state.rdfSearchParam.modelId = state.selectedRdfMappgModelInfo.condModelId;
    state.rdfSearchParam.modelNm = state.selectedRdfMappgModelInfo.condModelNm;
  }
  state.rdfSearchParam.rdfFormMtcd = props.rdfMapping.rdfFormMtcd;
  state.rdfSearchParam.typeModelId = props.rdfMapping.typeModelId;
  state.rdfSearchParam.typeModelNm = props.rdfMapping.typeModelNm;
};

const modifyRdfMapping = () => {
  refreshKey.value.nowDate = Date.now();
  state.rdfMappingModifyVisible = true;
};

const cancelPopup = () => {
  state.rdfMappingModifyVisible = false;
  state.rdfMappingModelEditVisible = false;
  state.rdfMappingModelModifyVisible = false;
};

const goToList = () => {
  let platform = getCookie("pltfrmId");
	let query = { rdfMappgId: route.query.rdfMappgId, };

  routerPush(platform, "RefMappingListPage", query);
};


const rdfMappingModelAdd = () => {
  refreshKey.value.nowDate = Date.now();
  state.rdfMappingModelEditVisible = true;
};

const modelRowClick = (data) => {
  state.selectedRdfMappgModelInfo = data;
  state.selectedRdfClass = data.rdfClass;
  state.treeTableVisible = true;
  state.selectedRdfMappgModelId = data.rdfMappgModelId;
  setTimeout(() => {
    if(data.rdfRepModelYn === 'Y'){
      state.modelIdForTypeModelProperty = props.rdfMapping.typeModelId;
      state.modelNmForTypeModelProperty = props.rdfMapping.typeModelNm;
    }
    if(data.rdfRepModelYn === 'N'){
      state.modelIdForTypeModelProperty = data.condModelId;
      state.modelNmForTypeModelProperty = data.condModelNm;
    }
  }, 1000)
  getRdfMappingTreeList(data.rdfMappgModelId);
};

const getRdfMappingTreeList = (modelId) => {

  $axios
    .get(util.format($apiUrls.meta.rdf.mapping.getMappingTreeList, modelId), {
      params: {
        rdfMappgModelId: modelId
      },
    })
    .then((res) => {

      state.beforeSortTreeList = res.data.list;
   
      for(var i=0; i<res.data.list.length; i++) {
        res.data.list[i].children = [];
      }

      function constructTree(data) {
        const map = {};
        data.forEach((node) => {
          node.children = [];
          map[node.nodeId] = node;
        });
        const root = [];
        data.forEach((node) => {
          const upNodeId = node.upNodeId;
          if (upNodeId in map) {
            map[upNodeId].children.push(node);
          } else {
            root.push(node);
          }
        });
        return root;
      }
      state.tableData = constructTree(res.data.list);
    })
    .catch((err) => {
      console.log(err);
    });
};

const modelPropertyView = () => {
  const popup = {
    x: (document.body.offsetWidth / 2) - (500 / 2),
    y: (document.body.offsetHeight / 2) - (720 / 2)
  };

  const typeModelId = props.rdfMapping.typeModelId;
  const modelId = state.modelIdForTypeModelProperty;
  const url = '/meta/popup/modelPropertyList?modelId=' + modelId + '&typeModelId=' + typeModelId;

  const base = {
    name: '모델 프라퍼티 목록',
    option: 'width=1200, height=800, top=' + popup.y + ', left=' + popup.x + ', status=no, scrollbars=no, resizable=no, location=no, toolbar=no',
    url
  }

  store.dispatch("MetaStore/openPopup", base);
};

window.addEventListener('beforeunload', () => {
  store.commit('MetaStore/closePopup');
});

const rdfMappingModelModify = (data) => {
  state.modifyInfo = data;
  state.rdfMappingModelModifyVisible = true;
};

const rdfPropertyAdd = (data) => {
  props.rdfMapping.nodeDivId = data.nodeDivId;
  props.rdfMapping.nodeNm = data.nodeNm;
  state.dialogVisiblePropertySearch = true;
  state.selectedRdfInfo = data;
};
const propertySearchMode = "domain";
const searchTypeFix = true;
const selectedDomainProperty = (payload) => {
	state.dialogVisiblePropertySearch = false;
  
  const rdfPropertyInfo = {
    rdfMappgModelId: state.selectedRdfMappgModelId,
    upRdfMappgRuleId: state.selectedRdfInfo.nodeId.replace("_objt", ""),
    rdfPrptyId: payload.rowData.rdfPrptyId,
  };

  $axios
  .post($apiUrls.meta.rdf.mapping.createMappingrule, rdfPropertyInfo)
  .then(() => {
    alert("저장되었습니다.");
    getRdfMappingTreeList(state.selectedRdfMappgModelId);
  })
  .catch((err) => {
    console.log(err);
    if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
      alert(err.response.data.message);
    } else {
      alert("저장에 실패하였습니다.");
    }
  });
};

const rdfClassAdd = (data) => {
  props.rdfMapping.nodeDivId = data.nodeDivId;
  props.rdfMapping.nodeNm = data.nodeNm;
  state.dialogVisibleClassSearch = true;
  state.selectedRdfInfo = data;
};
const classSearchMode = "range";
const selectedRangeClass = (payload) => {
	state.dialogVisibleClassSearch = false;
  
  const rdfClassInfo = {
    rdfMappgRuleId: state.selectedRdfInfo.nodeId,
    objtRdfClassId: payload.rowData.rdfClassId,
    objtDataMappgYn: "N",
    objtPrptyDeleteYn: "Y",
    rdfMappgModelId: state.selectedRdfMappgModelId 
  };
  $axios
  .put(util.format($apiUrls.meta.rdf.mapping.modifyMappingrule, state.selectedRdfInfo.nodeId), rdfClassInfo)
  .then(() => {
    alert("저장되었습니다.");
    getRdfMappingTreeList(state.selectedRdfMappgModelId);
  })
  .catch((err) => {
    console.log(err);
    if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
      alert(err.response.data.message);
    } else {
      alert("저장에 실패하였습니다.");
    }
  });
};

const typePropertyMapping = (data) => {
  props.rdfMapping.nodeDivId = data.nodeDivId;
  props.rdfMapping.nodeNm = data.nodeNm;
  state.dialogVisibleModelPropertySearch = true;
  state.selectedRdfInfo = data;
};
const modelPropertySearchMode = "model";
const searchModelDisabled = "Y";
const selectedModelProperty = (payload) => {
  console.log(payload);
  state.dialogVisibleModelPropertySearch = false;

  let modelPropertyInfo = {};

  modelPropertyInfo.rdfMappgRuleId = state.selectedRdfInfo.nodeId;
  modelPropertyInfo.objtDataMappgYn = "Y";
  modelPropertyInfo.objtPrptyId = payload.rowData.prptyId;
  modelPropertyInfo.rdfMappgModelId = state.selectedRdfMappgModelId;

  if(payload.rowData.rangeModelTypeMtcd === "data_type"){
    modelPropertyInfo.objtLiteralYn = "Y";
  };
  if(payload.rowData.rangeModelTypeMtcd === "object_type"){
    modelPropertyInfo.objtLiteralYn = "N";
    modelPropertyInfo.rdfFormMtcd = props.rdfMapping.rdfFormMtcd;
  };
  $axios
  .put(util.format($apiUrls.meta.rdf.mapping.modifyMappingrule, state.selectedRdfInfo.nodeId), modelPropertyInfo)
  .then(() => {
    alert("저장되었습니다.");
    getRdfMappingTreeList(state.selectedRdfMappgModelId);
  })
  .catch((err) => {
    console.log(err);
    if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
      alert(err.response.data.message);
    } else {
      alert("저장에 실패하였습니다.");
    }
  });

};

const metaModelMapping = (data) => {
  console.log(data);
  state.selectedRdfInfo = data;

  let modelPropertyInfo = {
    rdfMappgRuleId: state.selectedRdfInfo.nodeId,
    objtDataMappgYn: "Y",
    objtPrptyId: "metaModel",
    objtLiteralYn: "Y",
    rdfMappgModelId: state.selectedRdfMappgModelId
  };

  $axios
  .put(util.format($apiUrls.meta.rdf.mapping.modifyMappingrule, state.selectedRdfInfo.nodeId), modelPropertyInfo)
  .then(() => {
    alert("저장되었습니다.");
    getRdfMappingTreeList(state.selectedRdfMappgModelId);
  })
  .catch((err) => {
    console.log(err);
    if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
      alert(err.response.data.message);
    } else {
      alert("저장에 실패하였습니다.");
    }
  });

};

const cDelete = (data) => {

  if(data.children.length > 0) {
    if (!confirm(data.nodeNm + " 클래스를 삭제하시겠습니까?\n하위 RDF 프라퍼티도 함께 삭제됩니다.")) return;
  }
  else {
    if (!confirm(data.nodeNm + " 클래스를 삭제하시겠습니까?")) return;
  }

  const mappingRuleInfo = {
    rdfMappgRuleId: data.upNodeId,
    objtDataMappgYn: "N",
    objtRdfClassId: null,
    rdfMappgModelId: state.selectedRdfMappgModelId
  };

  $axios
  .put(util.format($apiUrls.meta.rdf.mapping.modifyMappingrule, data.upNodeId), mappingRuleInfo)
  .then(() => {
    alert("삭제되었습니다.");
    if(data.children.length == 0) getRdfMappingTreeList(state.selectedRdfMappgModelId);

    for(var i=0; i<data.children.length; i++) {
      $axios
      .delete(util.format($apiUrls.meta.rdf.mapping.deleteMappingrule, data.children[i].nodeId))
      .then(() => {
        getRdfMappingTreeList(state.selectedRdfMappgModelId);
      })
    }
  })
  .catch((err) => {
    console.log(err);
    if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
      alert(err.response.data.message);
    } else {
      alert("삭제에 실패하였습니다.");
    }
  });

};

const pDelete = (data) => {

  if(data.children.length > 0) {
    if (!confirm(data.nodeNm + " 프라퍼티를 삭제하시겠습니까?\n하위 RDF 클래스도 함께 삭제됩니다.")) return;
  }
  else {
    if (!confirm(data.nodeNm + " 프라퍼티를 삭제하시겠습니까?")) return;
  }

  $axios
  .delete(util.format($apiUrls.meta.rdf.mapping.deleteMappingrule, data.nodeId))
  .then(() => {
    alert("삭제되었습니다.");
    getRdfMappingTreeList(state.selectedRdfMappgModelId);
  })
  .catch((err) => {
    console.log(err);
    if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
      alert(err.response.data.message);
    } else {
      alert("삭제에 실패하였습니다.");
    }
  });

};

const rowUp = (data) => {

  let nodeList = [];
  for(var i=0; i<state.beforeSortTreeList.length; i++) {
    if(state.beforeSortTreeList[i].upNodeDivId === data.upNodeDivId){
      nodeList.push(state.beforeSortTreeList[i]);
    }
  }

  let upIndex = 0;
  for(var i=0; i<nodeList.length; i++) {
    if(data.nodeId === nodeList[i].nodeId){
      upIndex = i-1;
    }
  }

  if(upIndex < 0) return;

  const nodeInfo = {
    rdfMappgRuleId: data.nodeId,
    objtDataMappgYn: data.nodeObjtMappgYn,
    objtRdfClassId: data.nodeObjtRdfClassId,
    rdfMappgRuleOdrg: parseInt(nodeList[upIndex].nodeOdrg),
    rdfMappgModelId: state.selectedRdfMappgModelId
  };

  $axios
  .put(util.format($apiUrls.meta.rdf.mapping.modifyMappingrule, data.nodeId), nodeInfo)
  .then(() => {
    getRdfMappingTreeList(state.selectedRdfMappgModelId);

    const upNodeInfo = {
      rdfMappgRuleId: nodeList[upIndex].nodeId,
      objtDataMappgYn: nodeList[upIndex].nodeObjtMappgYn,
      objtRdfClassId: nodeList[upIndex].nodeObjtRdfClassId,
      rdfMappgRuleOdrg: parseInt(data.nodeOdrg),
      rdfMappgModelId: state.selectedRdfMappgModelId
    };  

    $axios
    .put(util.format($apiUrls.meta.rdf.mapping.modifyMappingrule, nodeList[upIndex].nodeId), upNodeInfo)
    .then(() => {
      getRdfMappingTreeList(state.selectedRdfMappgModelId);
    })
    .catch((err) => {
      console.log(err);
      if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
        alert(err.response.data.message);
      } else {
        alert("순서 변경을 실패하였습니다.");
      }
    });
  })
  .catch((err) => {
    console.log(err);
    if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
      alert(err.response.data.message);
    } else {
      alert("순서 변경을 실패하였습니다.");
    }
  });

};

const rowDown = (data) => {

  let nodeList = [];
  for(var i=0; i<state.beforeSortTreeList.length; i++) {
    if(state.beforeSortTreeList[i].upNodeDivId === data.upNodeDivId){
      nodeList.push(state.beforeSortTreeList[i]);
    }
  }

  let downIndex = 0;
  for(var i=0; i<nodeList.length; i++) {
    if(data.nodeId === nodeList[i].nodeId){
      downIndex = i+1;
    }
  }

  if(nodeList.length < downIndex+1) return;

  const nodeInfo = {
    rdfMappgRuleId: data.nodeId,
    objtDataMappgYn: data.nodeObjtMappgYn,
    objtRdfClassId: data.nodeObjtRdfClassId,
    rdfMappgRuleOdrg: parseInt(nodeList[downIndex].nodeOdrg),
    rdfMappgModelId: state.selectedRdfMappgModelId
  };

  $axios
  .put(util.format($apiUrls.meta.rdf.mapping.modifyMappingrule, data.nodeId), nodeInfo)
  .then(() => {
    getRdfMappingTreeList(state.selectedRdfMappgModelId);

    const downNodeInfo = {
      rdfMappgRuleId: nodeList[downIndex].nodeId,
      objtDataMappgYn: nodeList[downIndex].nodeObjtMappgYn,
      objtRdfClassId: nodeList[downIndex].nodeObjtRdfClassId,
      rdfMappgRuleOdrg: parseInt(data.nodeOdrg),
      rdfMappgModelId: state.selectedRdfMappgModelId
    };  

    $axios
    .put(util.format($apiUrls.meta.rdf.mapping.modifyMappingrule, nodeList[downIndex].nodeId), downNodeInfo)
    .then(() => {
      getRdfMappingTreeList(state.selectedRdfMappgModelId);
    })
    .catch((err) => {
      console.log(err);
      if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
        alert(err.response.data.message);
      } else {
        alert("순서 변경을 실패하였습니다.");
      }
    });
  })
  .catch((err) => {
    console.log(err);
    if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
      alert(err.response.data.message);
    } else {
      alert("순서 변경을 실패하였습니다.");
    }
  });
 
};

</script>
<style lang="scss"></style>
