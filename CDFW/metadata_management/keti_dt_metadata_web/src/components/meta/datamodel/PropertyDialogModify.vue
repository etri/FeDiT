<template>
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>프라퍼티 정보</h3>
      </div>

      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleForm"
          :model="property"
          :rules="rules"
          label-width="200px"
          class="demo-ruleForm"
        >
          <el-form-item label="프라퍼티 ID" prop="prptyId">
            <el-input v-model="property.prptyId" placeholder="물리명과 동일하게 생성" disabled></el-input>
          </el-form-item>

					<!-- 2023-06-29 상위 프라퍼티 막음 
          <el-form-item label="상위 프라퍼티" prop="upPrptyNm">
						<div class="inline-area">
							<el-input style="width: 250px;" v-model="property.upPrptyNm" disabled	/>
							<el-button type="default" class="ml15" @click="dialogVisiblePropertySearch = true"><el-icon class="icon icon-search"/></el-button>
							<el-button type="delete" @click="refreshProperty"><el-icon class="icon icon-refresh"/></el-button>
						</div>						
						<el-dialog class="dialog_size" v-model="dialogVisiblePropertySearch" title="프라퍼티 검색">
							<PropertyDialogSearch @selectedRow="selectedUpProperty"/>
						</el-dialog>						
          </el-form-item>
					-->
					
					<el-form-item label="프라퍼티 명 (물리명)" prop="prptyNm">
						<el-input class="w-20 m-2" style="width: 250px" v-model="property.prptyNm" disabled></el-input>
					</el-form-item>

          <el-form-item label="프라퍼티 논리명" prop="prptyLogicNm">
            <el-input v-model="property.prptyLogicNm" v-bind:disabled="curPage != 'modify'"></el-input>
          </el-form-item>

		  			<el-form-item label="개수 프라퍼티 여부" prop="cntPrptyYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-model="property.cntPrptyYn" @change="chgCntPrptyYn">
									<el-option label="Y" value="Y"/>
									<el-option label="N" value="N"/>
								</el-select>
								<el-select class="ml-4" v-model="property.cntModelId" placeholder="선택" v-show="property.cntPrptyYn == 'Y'">
									<el-option
									v-for="item in typeModelList"
									:key="item.modelId"
									:label="`${item.modelNm} ${item.modelLogicNm}`"
									:value="item.modelId"
									/>
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>

					<el-form-item label="데이터 배열 여부" prop="dataArrayYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-model="property.dataArrayYn" disabled>
									<el-option label="N" value="N"/>
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>

					<el-form-item label="프라퍼티 화면 표시 여부" prop="prptyScrnIndcYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-model="property.prptyScrnIndcYn">
									<el-option label="Y" value="Y"/>
									<el-option label="N" value="N"/>
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>

					<el-form-item label="프라퍼티 상태" prop="prptyDataSttusMtcd">
						<el-row :gutter="20">
							<el-col :span="24">
								<!-- 프라퍼티 상태 : 사용/ 폐기 자유롭게 전환. TODO : 상위 프라퍼티를 실제 사용할 경우는 폐기 상태로 만드는 버튼을 따로 만들어야 할 듯 -->
								<el-select 
									v-model="property.prptyDataSttusMtcd"
									@change="changePrptyDataSttusMtcd"
									placeholder="선택">
									<el-option
											v-for="item in dataStatusCdList"
											:key="item.mtcd"
											:label="item.mtcdNm"
											:value="item.mtcd"
									/>
								</el-select>
							</el-col>
						</el-row>
					</el-form-item> 

					<el-form-item label="정렬 순서" prop="prptySortOdrg">
						<el-input v-model="property.prptySortOdrg" type="number" maxlength="5"></el-input>
					</el-form-item>	
					<el-form-item label="설명" prop="prptyDesc">
            <el-input v-model="property.prptyDesc"></el-input>
          </el-form-item>
					<el-form-item label="등록정보">
						<el-input v-model="property.regrInfo" disabled></el-input>
					</el-form-item>	
					<el-form-item label="수정정보">
						<el-input v-model="property.amdrInfo" disabled></el-input>
					</el-form-item>	

        </el-form>

				<div class="btnSec taR mt20">
					<el-button type="primary" v-if="isAmdYn(route.meta.auth) && curPage == 'modify'" @click="modifyProperty">저장</el-button>
					<el-button type="default" @click="cancelDialog">취소</el-button>
				</div>				
      </div>
    </div>
		
		<div class="boxLayout">
      <div class="boxTit">
        <h3>프라퍼티 정의</h3>
      </div>
      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormDef"
          :model="propertyDef"
          :rules="rulesDef"
          label-width="200px"
          class="demo-ruleForm"
        >
          <el-form-item label="도메인 모델(Class/유형)" prop="domnModelId">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select 
                v-model="propertyDef.domnModelId"
                placeholder="선택">
                <el-option
                    v-for="item in domainModelList"
                    :key="item.modelId"
                    :label="`${item.modelNm} ${item.modelLogicNm} ${item.modelId === 'Class' ? '(공통)' : ''}`"
                    :value="item.modelId"
                />
								<el-input hidden v-model="propertyDef.prptyId" />
              </el-select>
							</el-col>
						</el-row>
					</el-form-item>

          <el-form-item label="범위 모델" prop="rangeModelId">
						<div class="inline-area">
							<el-input style="width: 250px;" v-model="propertyDef.rangeModelId" disabled	/>
							<el-button type="default" class="ml15 btn-label-color" @click="dialogVisibleModelSearch = true"><el-icon class="icon icon-search"/></el-button>
							<el-button type="delete" @click="refreshRangeModel"><el-icon class="icon icon-refresh"/></el-button>
						</div>
						<el-dialog v-model="dialogVisibleModelSearch" title="범위 모델 검색">
							<MetaDataModelSearchPage
								:searchSttusCd="searchSttusCd"
								:searchMode="searchMode"
								@selectedRow="selectedRangeModel"
							/> 
						</el-dialog>												
          </el-form-item>

					<el-form-item label="범위 모델 논리명" prop="prptyDesc">
            <el-input v-model="propertyDef.rangeModelLogicNm" disabled></el-input>
          </el-form-item>

					<el-form-item label="범위 모델 코드그룹 ID" prop="rangeMtcdGrpId" v-bind:required="rangeModelCodeGroupEnable==false">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select 
									v-bind:disabled="rangeModelCodeGroupEnable"
									v-model="propertyDef.rangeMtcdGrpId"
									@change="changeRangeMtcdGrpId"
									placeholder="선택"
									>
									<el-option label="해당없음" value="" />
									<el-option
											v-for="item in metaCodeGroupList"
											:key="item.mtcdGrpId"
											:label="`[${item.mtcdGrpId}] ${item.mtcdGrpNm}`"
											:value="item.mtcdGrpId"
									/>
								</el-select>
							</el-col>
						</el-row>
					</el-form-item> 

					<el-form-item label="범위모델 참조 프라퍼티 명" prop="refPrptyId" v-bind:required="rangeModelRefEnable==false">
            <el-input v-model="propertyDef.refPrptyId" v-bind:disabled="rangeModelRefEnable"></el-input>
          </el-form-item>
					<el-form-item label="등록정보">
						<el-input v-model="propertyDef.regrInfo" disabled></el-input>
					</el-form-item>	
					<el-form-item label="수정정보">
						<el-input v-model="propertyDef.amdrInfo" disabled></el-input>
					</el-form-item>	
					<div class="btnSec taR mt20">
						<el-button type="primary" v-if="isAmdYn(route.meta.auth) && curPage == 'modify'" @click="modifyPropertyDef">저장</el-button>
						<el-button type="default" @click="cancelDialog">취소</el-button>
					</div>
        </el-form>
      </div>
    </div>
		<div class="boxLayout">
      <div class="boxTit">
        <h3>프라퍼티 정의 변경 이력</h3>
      </div>
      <div class="boxCnt">
				<comn-list
				:tableHeader="tableHeader"
				:tableData="propertyChgHistList"
				:minHeight="100"
				>
				</comn-list>
			</div>
		</div>
  </div>
</template>
<script setup>

import { ref, reactive, onMounted, onUpdated} from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties, isAmdYn, isDelYn } from "@/assets/js/common.js";
import util from "util";
import PropertyDialogSearch from "@/components/meta/datamodel/PropertyDialogSearch.vue";
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";
import ComnList from "@/components/common/ComnList";
import metaConst from "@/assets/js/metaConst.js";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const ruleForm = ref(null);
const ruleFormDef = ref(null);
const dialogVisiblePropertySearch = ref(false);
const dialogVisibleModelSearch = ref(false);
const rangeModelRefEnable = ref(true);
const rangeModelCodeGroupEnable = ref(true);
const typeModelList = ref([]);
const isCntModelIdDisabled = ref(false);

onUpdated (()=>{
	changeRangeModel(props.propertyDef.dataTypeMtcd);
})

onMounted(() => {
  getTypeModelList();
});

const searchSttusCd = "use";
const searchMode = "range";
const searchTypeModelId = "";
const selectedRangeModel = (payload) => {
	changeRangeModel(payload.rowData.dataTypeMtcd);
	props.propertyDef.rangeModelId=payload.rowData.modelId;
	props.propertyDef.rangeModelLogicNm=payload.rowData.modelLogicNm;
	dialogVisibleModelSearch.value = false;
};

const changeRangeModel = (dataTypeMtcd) => {
	let idx = metaConst.ARR_DERIVED_DATATYPE.findIndex(x => x === dataTypeMtcd);
	if(idx != -1) {
		rangeModelRefEnable.value = false; //범위모델 참조 활성화
	} else {
		props.propertyDef.refPrptyId="";
		rangeModelRefEnable.value = true;	// 범위모델 참조 비활성화
	}
	if(dataTypeMtcd == "code") {
		rangeModelCodeGroupEnable.value=false;
	} else {
		props.propertyDef.rangeMtcdGrpId="";
		rangeModelCodeGroupEnable.value=true;
	}
}

const emits = defineEmits([
  "modifyProperty",
  "modifyPropertyDef",
  "cancelModifyDialog"
]);
const props = defineProps({
  property : {
    type: Object,
    required: true
  },
	propertyDef : {
    type: Object,
    required: true
  },
	dataStatusCdList: {
		type: Array,
    required: true
	},
	domainModelList: {
		type: Array,
    required: true
	},
	metaCodeGroupList: {
		type: Array,
    required: true
	},
  curPage: {
    type: String,
    required: false
  },
  curTitle: {
    type: String,
    required: false
  },
	propertyChgHistList: {
		type: Array,
		required: false
	}
});

const rules = ref({  
	prptyLogicNm: [
		{
			required: true,
			message: "내용을 입력하세요.",
			trigger: "blur",        
		}
	],
	prptyDataSttusMtcd: [
		{
			required: true,
			message: "프라퍼티 상태를 선택하세요.",
			trigger: "blur",
		}
	],
	cntPrptyYn: [
      {
        required: true,
        message: "개수 프라퍼티 여부를 선택하세요.",
        trigger: "blur",
      },
	  {
		validator: (rule, value) => {
			if(value == "Y") {
				if(props.property.cntModelId == "" || props.property.cntModelId == null) {
					return Promise.reject("모델 유형을 선택하세요.");
				}
				else {
					return Promise.resolve();
				}
			}
			else {
				return Promise.resolve();
			}
		},
		trigger: "blur",
	  }
    ],
	dataArrayYn: [
		{
			required: true,
			trigger: "blur",
		}
	],
	prptyScrnIndcYn: [
      {
        required: true,
        message: "프라퍼티 화면 표시 여부를 선택하세요.",
        trigger: "blur",
      }
    ],
	prptySortOdrg: [
		{
		required: true,
		message: "내용을 입력하세요.",
		trigger: "blur",
		},
		{
		validator: (rule, value) => {
			const parsedValue = parseInt(value, 10);
			if (value && value.length > 5) {
			return Promise.reject("5자 이하만 가능합니다.");
			} else if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 99999) {
			return Promise.reject("0 ~ 99999 사이의 값만 입력할 수 있습니다.");
			} else {
			return Promise.resolve();
			}
		},
		trigger: "blur",
		}
	]
});

const rulesDef = ref({  
	domnModelId: [
		{
			required: true,
			message: "도메인 모델을 선택하세요.",
			trigger: "blur",
		}
	],
	rangeModelId: [
		{
			required: true,
			message: "범위 모델을 선택하세요.",
			trigger: "blur",        
		}
	],
	refPrptyId: [
		{
			required: rangeModelRefEnable ==false,
			message:  "참조할 프라퍼티 명을 입력하세요.",
			trigger: "blur",
		}
	]
});

const tableHeader = ref([
  {
    prop: "rownum",
    label: "번호",
    width: 30,
    align: "center"
  },
  {
    prop: "domnModelNm",
    label: "도메인 모델 명",
    width: 100,
  },
  {
    prop: "rangeModelNm",
    label: "범위 모델 명",
    width: 100,
  },
  {
    prop: "chgInfo",
    label: "변경 정보",
    width: 200,
  }
]);

const selectedUpProperty = (payload) => {
	if(payload.rowData.prptyId == props.property.prptyId) {
		alert("같은 프라퍼티는 상위 프라퍼티로 사용할 수 없습니다.");
		return false;
	}
	props.property.upPrptyId=payload.rowData.prptyId;
	props.property.upPrptyNm=payload.rowData.prptyNm;
	dialogVisiblePropertySearch.value=false;
}

const refreshProperty = () => {
	props.property.upPrptyId = "";
	props.property.upPrptyNm = "";
}

const cancelDialog = () => {
  emits("cancelModifyDialog");
};
const modifyProperty = async () => {
  emits("modifyProperty", { data: props.property, ruleForm });
};

const modifyPropertyDef = async () => {
  emits("modifyPropertyDef", { data: props.propertyDef, ruleFormDef });
};

const getTypeModelList = () => {
  $axios
    .get($apiUrls.meta.data.type.getTypeModelList, {
      params: {
        isPaging: false,
        searchMode: "type",
        modelDataSttusMtcd: "use",
      },
    })
    .then((res) => {
      typeModelList.value = res.data.list;
    })
    .catch((err) => {
      console.log(err);
    });
};

const chgCntPrptyYn = () => {
	if(props.property.cntPrptyYn == "Y") {
		isCntModelIdDisabled.value = true;
	}
	else {
		isCntModelIdDisabled.value = false;
		props.property.cntModelId = "";
	}
};


</script>
<style lang="scss"></style>