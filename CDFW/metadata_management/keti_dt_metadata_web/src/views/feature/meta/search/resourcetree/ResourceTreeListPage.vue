<template>
  <div>
    <div class="cntSec">
      <div class="boxLayout">
        <div class="boxTit">
          <h3>디지털트윈 리소스 트리</h3>
        </div>
        <div class="boxCnt">
          <el-form>
            <el-row>
              <el-table
                row-key="treeId"
                :data="state.treeNodeList"
                :default-expand-all="true"
                :highlight-current-row="true"
              >
                <el-table-column label="" :min-width="20">
                  <template #default="{ row }">
                    <el-select
                      v-model="row.valModelId"
                      placeholder="선택"
                      @focus="row._prevValModelId = row.valModelId"
                      @change="changeModel(row.valModelId, row)"
                      :style="{ width: '300px' }"
                      :disabled="row.comboYn == 'N' ? true : false"
                      >
                      <el-option
                        v-for="childNode in row.metaDataModelList"
                        :key="childNode.modelId"
                        :value="childNode.modelId"
                        :label="childNode.label"
                      ></el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <!-- 테스트용
                <el-table-column label="" :min-width="20">
                  <template #default="{ row }">{{ row.treeId }} / {{ row.valModelId }}  / {{ row.typeModelId }} / {{ row.children ? row.children.length : 0 }} </template>
                </el-table-column>
                -->
              </el-table>
            </el-row>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";

import {
  getGlobalProperties
} from "@/assets/js/common.js";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const state = reactive({
  typeModelList: [],
  beforeSortTreeList: [],
  stdModelPropertyList: [],
  comboMap: new Map([]),
  metaDataModelList: [], // 전체 metaDataModel (콤보박스)
  treeNodeList: [], // 트리
  //treeDepth: 0,
});

const getTypeModelList = () => {
  return new Promise((resolve, reject) => {
    $axios
      .get($apiUrls.meta.data.type.getTypeModelList, {
        params: {
          isPaging: false,
          searchMode: "type",
          modelDataSttusMtcd: "use",
        },
      })
      .then((res) => {
        state.typeModelList = res.data.list;
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
   })
};

const getMetaDataModelList = () => {
  return new Promise((resolve, reject) => {
    $axios
      .get($apiUrls.meta.data.model.getMetaDataModelList, {
        params: {
          searchMode: "objectType",
          modelDataSttusMtcd: "use",
          isPaging: false,
        },
      })
      .then((res) => {
        res.data.list.map((data) => {
          data.label = data.modelId + " " + data.modelLogicNm;
        })
        state.metaDataModelList = res.data.list;
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
    })
};

const getModelPropertyList = (modelId) => {
  let root = {
    treeId: modelId + "-0", // 트리 전용
    typeModelId: modelId,    
    valModelId: modelId, // 콤보선택값
    depth: 0,
    children: [], // 트리
    metaDataModelList: [], // 콤보박스
    parentTypeModelIds: [],
  };
  state.treeNodeList.push(root);
  makeTree(root);
};

const makeTree = (node, onlyChildren = false) => {
  if (!node) {
    return;
  }

  if (!onlyChildren) {
    setNode(node);
    refreshTree();
  }

  if (node.comboYn == 'N') return; // 무한 루프 방지

  // children 생성 위해. 모델의 모든 프라퍼티 목록 조회
  $axios
    .get(util.format($apiUrls.meta.data.std.getStdModelPropertyList, node.valModelId))
    .then((res) => {
      // object 타입만 가져오기
      let tmpList = [];
      let tmpCnt = 1;
      res.data.list.forEach((childNode) => {
        if (childNode.rangeModelTypeMtcd == "object_type") {
          childNode.depth = node.depth + 1;
          childNode.typeModelId = childNode.rangeModelId;       
          childNode.treeId = node.treeId + '-' + (tmpCnt++);
          childNode.parentTypeModelIds = node.parentTypeModelIds.concat(node.typeModelId);
          tmpList.push(childNode);
          //console.log('data: ', data);
        }
      });

      node.children = [...tmpList];
      for (let childNode of tmpList) {
        makeTree(childNode);
      }

    })
    .catch((err) => {
      console.log(err);
    });
};


/*** Model tree ****/

const rootNode = ref("DigitalTwin");

onMounted(() => {
  const promise1 = getTypeModelList();
  const promise2 = getMetaDataModelList();

  Promise.allSettled([promise1, promise2]).then(() => {
    getModelPropertyList(rootNode.value);
  });
});

const setNode = (node) => {
  let tmpList = [];
  let typeModel = {}; // 콤보박스의 첫 번째 값
  let stdModel = {};  // 콤보박스에서 기본적으로 선택되어있는 기본값
    
  // 콤보 옵션 설정
  for (let model of state.metaDataModelList) {
    if (model.typeModelId == node.typeModelId) {
      tmpList.push(model);
      if (model.modelId == node.stdModelId) {
        stdModel = model;
      }
    }
  }
  let movedElement = tmpList.splice(tmpList.indexOf(node.typeModelId), 1)[0];
  tmpList.splice(0, 0, movedElement);
  if (tmpList) {
    node.metaDataModelList = tmpList;
  }
  // 콤보 값 설정
  if (stdModel.modelId !== undefined) {
    node.valModelId = stdModel.modelId;
  } else {
    node.valModelId = node.typeModelId;
  }

  // 무한 루프 방지. disabled 설정
  if (node.parentTypeModelIds.includes(node.typeModelId)) {
    node.comboYn = 'N'; 
  }
};

const changeModel = async (valModelId, row) => {
  //console.log('changeModel : ' + valModelId);
  //console.log(row);
  // 자식 노드들을 새로 만들기
  row.children = [];
  makeTree(row, true);
};

const refreshTree = () => {
  state.treeNodeList = [...state.treeNodeList]; // 새로고침?
}
</script>

<style lang="scss"></style>