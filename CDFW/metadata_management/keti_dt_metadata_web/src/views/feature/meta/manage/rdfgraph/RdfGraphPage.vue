<template>
  <div>
    <div class="cntSec">
      <div class="boxLayout mb10">
        <div class="boxTit">
          <h3>RDF 시각 그래프 조회</h3>
          <div class="btnSec taR">
            <el-button type="primary" @click="getRdfGraph()">검색</el-button>
          </div>
        </div>
        <div class="boxCnt">
          <el-form label-position="left"
            :inline="true"
            :model="pageInfo"
            class="demo-form-inline"
            label-width="150px"
          >

            <el-row :gutter="0">
              <el-form-item label="조회 유형">
                <el-radio-group v-model="state.searchType">
                  <el-radio-button label="all">전체</el-radio-button>
                  <el-radio-button label="medataSet">메타데이터 셋</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="LIMIT">
                <el-input type="number" class="w-100 m-2" @keydown.enter.prevent="getRdfGraph()" v-model="state.matchLimit" />
              </el-form-item>
              <el-form-item label="LABEL">
                <div class="inline-area">
                  <el-select v-model="state.selectedLabelType" placeholder="선택">
                    <el-option label="default" value="" />
                    <el-option label="dcterms__type" value="dcterms__type" />
                  </el-select>
                </div>
              </el-form-item>
              <el-form-item label="메타데이터 셋" v-if="state.searchType === 'medataSet'">
                <div class="inline-area">
                  <el-input class="w-100 m-2" v-model="state.medataSetNm" disabled />
                  <el-button type="default" class="ml15" @click="dialogVisibleSearchMetadataSet = true"><el-icon class="icon icon-search"/></el-button>
                  <el-button type="default" class="el-button--delete" @click="refreshMedataSet"><el-icon class="icon icon-refresh"/></el-button>
                </div>
              </el-form-item>
            </el-row>
            
          </el-form>
        </div>
      </div>
      <div class="neo4jd3-container">
        <el-container>
          <el-aside width="70%" style="margin-right: 10px;">
            <div class="boxLayout">
              <div class="boxTit">
                <h3>시각 그래프 ( 조회된 노드 {{ state.nodeCount }} 건 / 전체 노드 {{ state.totalCount }} 건 )</h3>
              </div>
              <div class="boxCnt">
                <div id="neo4jd3" class="neo4jd3" ref="neo4jD3Svg" stripe></div> 
              </div>
            </div> 
          </el-aside>
          <el-main style="padding: 0px;">
            <div class="boxLayout"  >
              <div class="boxTit">
                <h3>노드 속성</h3>
              </div>
              <div class="boxCnt">
                <div style="overflow-x: hidden; overflow-y: auto;">
                  <div style="display: flex; align-items: center;">
                    <h3 style="color: #909399; margin-bottom: 46px;">LABEL </h3>
                    <el-scrollbar style="height: 100%;">
                      <div class="flex flex-wrap gap-2 my-2" style="height: 68px; margin-left: 10px;">
                        <el-tag
                          v-if="state.clickedNodeLabels.length > 0"
                          v-for="item in state.clickedNodeLabels"
                          :key="item"
                          class="mx-1"
                          effect="dark"
                          round
                          style="margin-right: 5px; margin-bottom: 10px; font-weight: bold;"
                        >
                          {{ item }}
                        </el-tag>
                        <p v-if="state.clickedNodeLabels.length == 0" style="color: #909399; margin-left: 20px; margin-top: 8px;">No Data</p>
                      </div>
                    </el-scrollbar>
                  </div>
                  <el-table :data="state.clickedNodeProperties" stripe style="width: 100%; height: calc(100vh - 412px);" scrollbar-always-on="true">
                    <el-table-column prop="key" label="KEY" />
                    <el-table-column prop="value" label="VALUE" />
                  </el-table>
                </div>
              </div>
            </div>
          </el-main>
        </el-container>
      </div>
    </div>

    <el-dialog v-model="dialogVisibleSearchMetadataSet" title="메타데이터 셋 검색">
      <MetadataSetDialogSearch :searchMode="state.searchModeForDt"           searchSttusCd=""
                                :searchMetaTypeFix="searchMetaTypeFix"  :searchMetaTypeId="searchMetaTypeId"
        @selectedRow="selectedMetaDataSet" />
    </el-dialog>

  </div>
</template>
<script setup>
import { getGlobalProperties } from "@/assets/js/common.js";
import { ref, reactive, onMounted, computed, watch, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import util from "util";
import neo4jd3 from 'neo4jd3';
import MetadataSetDialogSearch from "@/components/meta/dt/MetadataSetDialogSearch.vue";

const router = useRouter();
const store = useStore();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const emits = defineEmits(["selectedRow"]);

const neo4jD3Svg = ref(null);
const typeModelList = ref([]);

const dialogVisibleSearchMetadataSet = ref(false);
const searchMetaTypeFix = false;
const searchMetaTypeId = ref("");

// neo4jd3 타이머 핸들 변수
const neoInstance = ref(null);
let rafId = null, toId = null;

function disposeGraph() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (toId)  { clearTimeout(toId);          toId  = null; }
  try { neoInstance.value?.simulation?.stop?.(); } catch {}
  if (neo4jD3Svg.value) neo4jD3Svg.value.innerHTML = '';
  neoInstance.value = null;
}

onBeforeUnmount(() => { disposeGraph(); });

const state = reactive({
  searchType: "all",
  matchLimit: 500,
  typeModelId: "",
  medataSetNm: "",
  searchModeForDt: "all",
  medataSetId: "",
  medataSetNm: "",
  selectedLabelType: "dcterms__type",

  clickedNodeLabels: [],
  clickedNodeProperties: [],

  nodeCount: "0",
  totalCount: "0"
});

const selectedMetaDataSet = (payload) => {
	let { medataSetId, medataSetNm } = payload.rowData;
	state.medataSetId = medataSetId;
  state.medataSetNm = medataSetNm;
	dialogVisibleSearchMetadataSet.value = false;
};

const refreshMedataSet = () => {
  state.medataSetId = "";
  state.medataSetNm = "";
};

onMounted(() => {
  getTypeModelList();
  getNeo4j();
});
  
function ensureD3(cb){
  if (window.d3 && window.d3.version?.startsWith('4.')) return cb();
  let s = document.querySelector('#ext-d3v4');
  if (!s) {
    s = document.createElement('script');
    s.id = 'ext-d3v4';
    s.src = 'https://d3js.org/d3.v4.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  } else {
    s.onload ? s.addEventListener('load', cb) : cb();
  }
}

const getNeo4j = () => {
  $axios
    .get($apiUrls.meta.datastore.neo4j.getNeo4j, {
      params: {
        searchType: state.searchType,
        matchLimit: state.matchLimit.toString(),
        medataSetId: state.medataSetId,
        labelType: state.selectedLabelType,
      },
    })
    .then((res) => {
      drawNeo4jGraph(res.data);
      if(res.data.graph.nodecount !== null){
        state.nodeCount = res.data.graph.nodecount;
      }
      if(res.data.totalcount !== null){
        state.totalCount = res.data.totalcount;
      }
    })
    .catch((err) => {
      console.log(err);
      if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
        alert(err.response.data.message);
      } else {
        alert("NEO4J 조회에 실패하였습니다.");
      }      
    });
};

const getRdfGraph = () => {

  if(state.matchLimit < 100 || state.matchLimit > 10000){
    alert("LIMIT는 100~10000 사이의 값만 입력할 수 있습니다.");
    return;
  }
  if(state.searchType === "medataSet"){
    if(state.medataSetId === "" || state.medataSetId === null){
      alert("메타데이터 셋을 입력해주세요.");
      return;
    }
  }

  getNeo4j();

  state.clickedNodeLabels = [];
  state.clickedNodeProperties = [];
};

const drawNeo4jGraph = (data)  => {
  try{
    for(var i=0; i<data.graph.nodes.length; i++){
      if(data.graph.nodes[i].labels.length > 0){
        if(data.graph.nodes[i].labels[0] === "Resource"){
          let temp = data.graph.nodes[i].labels[0];
          data.graph.nodes[i].labels[0] = data.graph.nodes[i].labels[1];
          data.graph.nodes[i].labels[1] = temp;
        }
      }
      if(data.graph.nodes[i].orgLabels.length > 0){
        if(data.graph.nodes[i].orgLabels[0] === "Resource"){
          let temp = data.graph.nodes[i].orgLabels[0];
          data.graph.nodes[i].orgLabels[0] = data.graph.nodes[i].orgLabels[1];
          data.graph.nodes[i].orgLabels[1] = temp;
          for(var j=0; j<data.graph.nodes[i].orgLabels.length; j++){
            data.graph.nodes[i].labels.push(data.graph.nodes[i].orgLabels[j]);
          }
        }
      }
    }
  } catch(e) {}
  let highlightClass = "";
  let highlightValue = "";
  if(state.searchType === "medataSet"){
    try{
      for(var i=0; i<data.graph.nodes.length; i++){
        if(typeof data.graph.nodes[i].properties.dcterms__identifier !== "undefined"){
          if(data.graph.nodes[i].properties.dcterms__identifier === state.medataSetId){
            highlightClass = data.graph.nodes[i].labels[0];
            highlightValue = data.graph.nodes[i].properties.dcterms__identifier;
          }
        }
      }
    } catch(e) {}
  }

  ensureD3(() => {
    disposeGraph();
    const options = {
      highlight: [
        { 
          class: highlightClass,
          property: 'dcterms__identifier',
          value: highlightValue
        },
      ],
      icons: {
        
      },
      infoPanel: false,
      neo4jData: {
        "results": [
            {
                "columns": ["user", "entity"],
                "data": [ data ],
            }
          ],
        "errors": []
      },
      minCollision: 80,
      nodeRadius: 35,
      onNodeClick: function(node) {
        state.clickedNodeLabels = JSON.parse(JSON.stringify(node.labels));
        
        const nodeId = { "<id>" : node.id }
        const nodeProperties = JSON.parse(JSON.stringify(node.properties));
        const nodeObjt = Object.assign(nodeId, nodeProperties);
        state.clickedNodeProperties = Object.keys(nodeObjt).map(key => ({
                                                                      key: key,
                                                                      value: nodeObjt[key]
                                                                    }));
      },
      zoomFit: false,
    };
    neoInstance.value = new neo4jd3(neo4jD3Svg.value, options);
    // caption 교체 스케줄 (컨테이너 살아있을 때만)
    rafId = requestAnimationFrame(() => {
      if (neo4jD3Svg.value?.isConnected) setNodeCaptions();
    });
    toId = setTimeout(() => {
      if (neo4jD3Svg.value?.isConnected) setNodeCaptions();
    }, 100);
  });
};

const setNodeCaptions = () => {
  // g.node > text 는 그래프 노드 원 안의 텍스트 (id 숫자)
  if (!window.d3 || !neo4jD3Svg.value?.isConnected) return;
  d3.select(neo4jD3Svg.value)
    .selectAll('g.node text')
    .filter(function(){ return !this.classList.contains('icon'); }) // 아이콘 텍스트 제외
    .each(function(d){ renderMultiline(this, captionFromNode(d)); });
};

const captionFromNode = (d) => {
  const p = d.properties || {};
  const allKeys = Object.keys(p);
  //console.log(`allKeys.length=${allKeys.length} : `, p);
  //console.log('Object.hasOwn(p, \'locn__geometry\')', Object.hasOwn(p, 'locn__geometry'));
  let caption = p.dcterms__title ?? '';
  if (!Object.hasOwn(p, 'dcterms__title')) {
    if (d.orgLabels.includes('schema__PostalAddress')) {
      caption = p.schema__addressLocality || p.schema__addressRegion;
    } else if (Object.hasOwn(p, 'locn__geometry')) {
      caption = (JSON.parse(p.locn__geometry)).type;
    } else if (allKeys.length === 2) { // uri 외 1개 경우
      const randomKey = allKeys.find(key => key != 'uri');
      caption = p[randomKey].toString();
    } 
  }
  return (caption || p.dcterms__identifier ||String(d.id)).toString();
};

// 문자열을 고정 글자수로 자르되, 최대 줄 수를 넘으면 마지막 줄을 '…'로 마감
const splitLinesWithEllipsis = (s, perLine, maxLines) => {
  const lines = [];
  for (let i = 0; i < s.length; i += perLine) lines.push(s.slice(i, i + perLine));
  if (lines.length > maxLines) {
    const keep = lines.slice(0, maxLines);
    const last = keep[maxLines - 1];
    keep[maxLines - 1] = (last.length >= perLine ? last.slice(0, perLine - 1) : last) + '…';
    return keep;
  }
  return lines;
};
// <tspan>으로 멀티라인 렌더
const renderMultiline = (textEl, caption, perLine = 10, maxLines = 3) => {
  const sel = d3.select(textEl);
  sel.text('');                // 기존 텍스트 제거
  sel.selectAll('tspan').remove();

  const lines = splitLinesWithEllipsis(caption, perLine, maxLines);
  // 가운데 정렬을 위해 첫 줄의 dy를 위로 올림
  const firstDy = -(lines.length - 1) * 0.6;  // 줄간격 1.2em 기준 절반

  lines.forEach((line, idx) => {
    sel.append('tspan')
      .attr('x', 0)
      .attr('dy', idx === 0 ? `${firstDy}em` : '1.2em')
      .text(line);
  });
};

const getTypeModelList = () => {
	$axios
		.get($apiUrls.meta.data.type.getTypeModelList, {
			params: {
				isPaging: false,
				searchMode: "type",
				modelDataSttusMtcd: "use"
			},
		})
		.then((res) => {
			typeModelList.value = res.data.list;
		})
		.catch((err) => {  
			console.log(err);
		});
};

</script>
<style lang="scss">
.neo4jd3-container {
  width: 100%;

  .neo4jd3-graph {
    border: 1px solid #ddd;
    background-color: white;
    border-radius: 5px;
    height: calc(100vh - 350px);
  }

  .neo4jd3-info {
    font-size: 16px;
    padding: 10px;
    position: absolute;
  }
  .neo4jd3-info a {
    border: 1px solid;
    display: inline-block;
    font-size: 14px;
    line-height: 1.428571429;
    margin-left: 5px;
    margin-top: 5px;
    padding: 6px 12px;
  }
  .neo4jd3-info a.class {
    color: white;
  }
  .neo4jd3-info a.property {
    background-color: #fff;
    border-color: #ccc;
    color: #333;
  }
  .neo4jd3-info a.btn {
    margin-left: 5px;
    margin-top: 5px;
    opacity: 1;
  }
  .neo4jd3-info a.info {
    background-color: #a5abb6;
    border: 1px solid #9aa1ac;
    color: white;
  }

  .node.node-highlighted .ring {
    -ms-filter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity=50)';
    filter: alpha(opacity=50);
    opacity: .5;
    stroke: #888;
    stroke-width: 12px;
  }
  .node .outline {
    cursor: pointer;
    fill: #a5abb6;
    pointer-events: all;
    stroke: #9aa1ac;
    stroke-width: 2px;
  }
  .node .ring {
    fill: none;
    -ms-filter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity=0)';
    filter: alpha(opacity=0);
    opacity: 0;
    stroke: #6ac6ff;
    stroke-width: 8px;
  }
  .node .text.icon {
    font-family: FontAwesome;
  }

  .node.selected .ring,
  .node:hover .ring {
    -ms-filter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity=30)';
    filter: alpha(opacity=30);
    opacity: .3;
  }

  .relationship {
    cursor: default;
  }
  .relationship line {
    stroke: #aaa;
  }
  .relationship .outline {
    cursor: default;
  }
  .relationship .overlay {
    cursor: default;
    fill: #6ac6ff;
    -ms-filter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity=0)';
    filter: alpha(opacity=0);
    opacity: 0;
  }
  .relationship text {
    cursor: default;
  }

  .relationship.selected .overlay,
  .relationship:hover .overlay {
    -ms-filter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity=30)';
    filter: alpha(opacity=30);
    opacity: .3;
  }

  svg {
    height: 100%; 
    width: 100%; 
  }
}


</style>