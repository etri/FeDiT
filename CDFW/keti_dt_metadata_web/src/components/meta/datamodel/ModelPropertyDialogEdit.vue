<template>
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>메타데이터 프라퍼티 검색</h3>
      </div>
			<div class="boxCnt">      
        <el-form label-position="right"
          :inline="true"
          class="demo-form-inline search-form"
          label-width="120px"
        >
          <el-row :gutter="20">
            <el-col :span="9">
              <el-form-item label="도메인 모델" v-show="typeModelYn == 'Y'">
                <el-select v-model="state.domnModelId">
                  <el-option label="전체" value="" />
                  <el-option
                    v-for="item in state.domnModelList"
                    :key="item.modelId"
                    :label="item.modelNm"
                    :value="item.modelId"
                  />
                </el-select>
              </el-form-item>               
              <el-form-item label="유형 모델" v-show="typeModelYn == 'N'">
                <el-select          
                  v-model="state.modelId"       
                  placeholder="선택"
                  @change="changeModelId"
                  disabled
                  >
                  <el-option
                    v-for="item in typeModelList"
                    :key="item.modelId"
                    :label="item.modelNm"
                    :value="item.modelId"
                  />
                </el-select>
              </el-form-item> 
            </el-col>
            <el-col :span="9">
              <el-form-item label="프라퍼티 명">
                <el-input
                  class="w-auto m-2"
                  v-model="state.searchName"
                  placeholder="검색어를 입력하세요."/>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <div class="btnSec taR">
                <el-button type="primary" @click="getTypePropertyList" >검색</el-button>
              </div>            
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>


    <div class="boxLayout">
      <el-container class="container-height">
        <el-aside width="72%" style="margin-right: 10px;"><!-- width="fit-content" -->
          <div class="boxTit">
            <h3>메타데이터 프라퍼티 목록 {{ state.typePropertySize }}</h3>
          </div>
          <comn-list
            :tableHeader="typeModelYn == 'Y' ? propertyTableHeader1 : propertyTableHeader2"
            :tableData="state.typePropertyList"      
            className="custom-table-height"
            :customRowFilter="customRowFilter"
            @selectionChange="selectCheckbox"
          >
            <template v-slot:rangeModelNm="slotData">
							<span :class="[isDisuseText(slotData.row, 'rangeModelNm')]">{{ slotData.row.rangeModelNm }}</span>
						</template>          
          </comn-list>
        </el-aside>
        
        <div class="custom-btn">
          <div style="border-left: 1px solid #ddd;" class="custom-table-height"></div>
        </div>

        <el-aside width="26%" style="margin-left: 10px;"><!-- width="fit-content" -->
          <div class="boxTit">
            <h3>모델 프라퍼티 목록 {{ state.modelPropertySize }}</h3>

            <div class="btnSec taR">
              <el-button type="default" @click="cancelDialog" >취소</el-button>
              <el-button type="primary" @click="saveModelProperty" >저장</el-button>
            </div>

          </div>
          <comn-list
            :tableHeader="modelPropertytableHeader"
            :tableData="state.modelPropertyList"      
            className="custom-table-height"
          >
          </comn-list>
        </el-aside>
      </el-container>
    </div>
  </div>  
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import { ref, reactive, onMounted, toRefs, watch } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";
import { useRoute } from "vue-router";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

onMounted(()=>{
  if(route.query.typeModelId == null || route.query.typeModelId == '') {
    state.modelId = props.modelId;
  } else {
    state.modelId = route.query.typeModelId;
  }

  initComponent();  
})

const emits = defineEmits(["cancelDialog","getModelPropertyList"]);
const props = defineProps({
  typeModelYn: { // 유형 모델 여부
    type:String,
    required: true
  },  
  typeModelList: {
    type: Array,
    required: true
  },
  modelId:{
    type: String,
    required: true
  }
});

const state = reactive({
	property: {},
  modelId: "",
  typePropertyList:[],
  modelPropertyList:[],
  typePropertySize: "",
  modelPropertySize: "",
  searchName: "",
  domnModelId: "",
  domnModelList: [],
});

const propsRefs = toRefs(props);
watch([propsRefs.modelId, propsRefs.typeModelYn], () => {
  state.modelId = props.modelId;

  initComponent();
});

const initComponent = () => {
  state.domnModelId = "";
  if (props.typeModelYn == 'Y') {
    const typeModel = props.typeModelList.find(x => x.modelId === props.modelId);
    let typeModelNm = typeModel ?  typeModel.modelNm : props.modelId;
    state.domnModelList = [
      { modelId: "Class",  modelNm: "Class (공통)" },
      { modelId: props.modelId, modelNm: typeModelNm }
    ];

  }
}

const propertyTableHeader1 = ref([
  {
    type: "selection",
    width: 40,
  },
  {
    prop: "rownum",
    label: "번호",
    width: 50,
    align: "center"
  },
	{
    prop: "prptyNm",
    label: "프라퍼티 명",
    width: 145,
    align: "left"
  },
	{
    prop: "prptyLogicNm",
    label: "프라퍼티 논리명",
    width: 125,
    align: "left"
  },
	{
    prop: "dataArrayYn",
    label: "배열여부",
    width: 70,
    align: "left"
  },
	{
    prop: "rangeModelNm",
    label: "범위모델",
    width: 145,
    align: "left",
    columnType: "custom",
  },
	{
    prop: "modelPrptyValExam",
    label: "값 설명",
    width: 200,
    align: "left",
  }
]);

const propertyTableHeader2 = ref([
  {
    type: "selection",
    width: 40,
  },
  {
    prop: "rownum",
    label: "번호",
    width: 50,
    align: "center"
  },
	{
    prop: "prptyNm",
    label: "프라퍼티 명",
    width: 145,
    align: "left"
  },
	{
    prop: "prptyLogicNm",
    label: "프라퍼티 논리명",
    width: 125,
    align: "left"
  },
	{
    prop: "modelPrptyMandMtcdNm",
    label: "필수구분",
    width: 70,
    align: "left"
  },  
	{
    prop: "dataArrayYn",
    label: "배열여부",
    width: 70,
    align: "left"
  },
	{
    prop: "rangeModelNm",
    label: "범위모델",
    width: 145,
    align: "left"
  },
	{
    prop: "modelPrptyValExam",
    label: "값 설명",
    width: 200,
    align: "left",
  }
]);

const modelPropertytableHeader = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 50,
    align: "center"
  },
  {
    prop: "prptyNm",
    label: "프라퍼티 명",
    width: 135,
    align: "left"
  },
	{
    prop: "prptyLogicNm",
    label: "프라퍼티 논리명",
    width: 135,
    align: "left"
  }
]);

const customRowFilter = ref({
  targetProp: 'rangeModelDataSttusMtcd',
  checkValue: ['disuse'],
  className: ['disuse-text']
});

const isDisuseText = (row, prop) => {
  if (row.rangeModelDataSttusMtcd === 'disuse') {
    return prop === 'rangeModelNm' ? 'disuse-text-cause' : 'disuse';
  } else {
    return '';
  }
}

const changeModelId = (data) => {
  state.modelId = data;
}

const selectAll =() => {
  state.modelPropertyList = [];
  state.typePropertyList.forEach((ele, idx) => {
    state.modelPropertyList.push(ele);
  });
  state.modelPropertySize = "("+state.modelPropertyList.length+"건)";
}

const selectCheckbox = (selectionRows) => {
  state.modelPropertyList = selectionRows;
  state.modelPropertySize = "("+state.modelPropertyList.length+"건)";
};

/**
 * 
 * 유형 모델 추가할 때는 프라퍼티에서 조회하고 modelId
 * 표준 모델 추가할 때는 모델프라퍼티에서 조회 typeModelId
 */
const getTypePropertyList = () => {
  state.typePropertyList=[];
  if(route.query.typeModelId==null) {
    if(state.modelId == null) {
        alert("데이터 유형 모델을 선택해주세요");
        cancelDialog();
        return;
      }
      $axios
        .get(util.format($apiUrls.meta.data.property.getTypePropertyList, state.modelId), { params: { searchName : state.searchName, domnModelId : state.domnModelId }} )
        .then((res) => {
          let rownum = 0;
          state.typePropertyList = res.data.list.map((x) => {
            x.rownum = ++rownum;
            return x;
          });
          state.typePropertySize = "("+res.data.list.length+"건)";
        })
        .catch((err) => {
          console.log(err);
        });
  } else {
      $axios
        .get(util.format($apiUrls.meta.data.std.getStdModelPropertyList ,state.modelId), { params: { searchName : state.searchName, prptyDataSttusMtcd : "use" }})
        .then((res) => {
          let rownum = 0;          
          res.data.list.map((data) => {
            data.rownum = ++rownum;
            state.typePropertyList.push(data);
          });
          state.typePropertySize = "("+res.data.list.length+"건)";
        })
        .catch((err) => {
          console.log(err);
        });
  }
};

const saveModelProperty = () => {  
  let editModelId = "";
  let apiUrl = "";
  if(route.query.modelId == null) { 
    editModelId = state.modelId ;
    apiUrl = $apiUrls.meta.data.typemodelproperty.createModelProperty;
  } else {
    editModelId = route.query.modelId;
    apiUrl = apiUrl = $apiUrls.meta.data.std.createStdModelProperty;
  }
  
  state.modelPropertyList.map((ele)=>{
    ele.modelId = editModelId;
  })
  
  let result = confirm("저장 하시겠습니까?");
  if(result){
    $axios
      .post(util.format(apiUrl, editModelId), state.modelPropertyList)
      .then((res) => {
        alert("메타데이터 모델 프라퍼티 등록이 완료되었습니다.\n[ id : "+ res.data.id + " 성공 : " + res.data.successCount + "건 실패 : " + res.data.failCount + "건 ]");
        cancelDialog();
        state.modelPropertyList=[];
        getTypePropertyList();
        getModelPropertyList(editModelId);
      })
      .catch((err) => {
        console.log(err);
        if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
          alert(err.response.data.message);
        } else {
          alert("모델 등록에 실패하였습니다.");
        }
      });
  }
}
const getModelPropertyList = (modelId) =>{
  emits("getModelPropertyList", modelId);
}

defineExpose({
  getTypePropertyList
})

const cancelDialog = () =>{
  emits("cancelDialog");
}

</script>
<style lang="scss" scoped>
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