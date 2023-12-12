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
                :data="state.modelPrptyList"
                :default-expand-all="true"
                :highlight-current-row="true"
              >
                <el-table-column label="" :min-width="20">
                  <template #default="{ row }">
                    <el-select
                      v-model="row.treeId"
                      placeholder="선택"
                      @change="changeModel"
                      :style="{ width: '300px' }"
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
  modelPrptyList: [], // 트리
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
    treeId: modelId, // 트리 전용 modelId
    rangeModelId: modelId,
    typeModelId: modelId,
    children: [], // 트리
    metaDataModelList: [], // 콤보박스
  };
  state.modelPrptyList.push(root);
  makeTree(state.modelPrptyList[0], true, true);
};

const makeTree = (node, firstLoadingYn, checkComboListYn) => {
  if (!node) {
    return;
  }

  $axios
    .get(util.format($apiUrls.meta.data.std.getStdModelPropertyList, node.treeId))
    .then((res) => {
      // object 타입만 가져오기
      let tmpList = [];
      res.data.list.map((data) => {
        if (data.rangeModelTypeMtcd == "object_type") {
          if (data.stdModelId) {
            data.treeId = data.stdModelId;
          } else {
            data.treeId = data.rangeModelId;
          }
          tmpList.push(data);
        }
      });
      if (firstLoadingYn == false && checkComboListYn == false) {
        appendNode(node, tmpList, firstLoadingYn, false);
      } else {
        appendNode(node, tmpList, firstLoadingYn, true);
      }
      for (let childNode of tmpList) {
        makeTree(childNode, firstLoadingYn, true);
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

const appendNode = (node, children, firstLoadingYn, checkComboListYn) => {
  if (!node.children) {
    node.children = [];
  }
  node.children = children;
  if (firstLoadingYn == false && checkComboListYn == false) {
    state.modelPrptyList = [...state.modelPrptyList];
    return;
  }

  let tmpList = [];
  let typeModel = {}; // 콤보박스의 첫 번재 값
  let stdModel = {};  // 콤보박스에서 기본적으로 선택되어있는 기본값

  for (let model of state.metaDataModelList) {
    if (model.typeModelId == node.rangeModelId) {
      tmpList.push(model);
      if (model.modelId == node.stdModelId) {
        stdModel = model;
      }
      if (model.modelId == model.typeModelId) {
        typeModel = model;
      }
    }
  }
  if (typeModel) {
    let movedElement = tmpList.splice(tmpList.indexOf(typeModel), 1)[0];
    tmpList.splice(0, 0, movedElement);
  }
  if (tmpList) {
    node.metaDataModelList = tmpList;
  }
  if (stdModel.modelId !== undefined) {
    node.rangeModelId = stdModel.modelId;
  }
  state.modelPrptyList = [...state.modelPrptyList];
};

const findNode = (children, id) => {
  if (!children) {
    return null;
  }
  for (let childNode of children) {
    if (childNode.treeId == id) {
      return childNode;
    }
    const foundNode = findNode(childNode.children, id);
    if (foundNode) {
      return foundNode;
    }
  }
  return null;
};

const changeModel = async (data) => {
  let node = findNode(state.modelPrptyList, data);
  //console.log(node);
  makeTree(node, false, false);
};
</script>

<style lang="scss"></style>