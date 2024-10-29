<template>
  <div class="dialog-area">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>프라퍼티 정보</h3>
      </div>
      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRef1"
          :model="state.property"
          :rules="state.rules"
          label-width="200px"
          class="demo-ruleForm"
        >
          <el-form-item label="프라퍼티 ID" prop="prptyId">
            <el-input v-model="state.property.prptyId" placeholder="물리명과 동일하게 생성" disabled></el-input>
          </el-form-item>

					<!-- 2023-06-29 상위 프라퍼티 막음 
          <el-form-item label="상위 프라퍼티" prop="upPrptyNm">
						<div class="inline-area">
							<el-input style="width: 250px;" v-model="state.property.upPrptyNm" disabled	/>
							<el-button type="default" class="ml15" @click="dialogVisiblePropertySearch = true"><el-icon class="icon icon-search"/></el-button>
							<el-button type="delete" @click="refreshProperty"><el-icon class="icon icon-refresh"/></el-button>
						</div>
						<el-dialog class="dialog_size" v-model="dialogVisiblePropertySearch" title="프라퍼티 검색">
							<PropertyDialogSearch @selectedRow="selectedUpProperty"/>
						</el-dialog>						
          </el-form-item>
					-->

					<el-form-item label="프라퍼티 명 (물리명)" prop="prptyNm">
						<div class="inline-area">
							<el-input class="" style="width: 250px;" v-model="state.property.prptyNm" @input="changePrptyNm"></el-input>
							<el-button type="primary" class="ml15" @click="propertyNameCheck('alert')" @keydown.enter.prevent="propertyNameCheck('alert')" >중복확인</el-button>
						</div>
					</el-form-item>

          <el-form-item label="프라퍼티 논리명" prop="prptyLogicNm">
            <el-input v-model="state.property.prptyLogicNm"></el-input>
          </el-form-item>

		  			<el-form-item label="개수 프라퍼티 여부" prop="cntPrptyYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-model="state.property.cntPrptyYn" @change="chgCntPrptyYn">
									<el-option label="Y" value="Y"/>
									<el-option label="N" value="N"/>
								</el-select>
								<el-select class="ml-4" v-model="state.property.cntModelId" placeholder="선택" v-show="isDataArrayYnDisabled">
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
								<el-select v-model="state.property.dataArrayYn" :disabled="isDataArrayYnDisabled">
									<el-option label="Y" value="Y"/>
									<el-option label="N" value="N"/>
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>

					<el-form-item label="프라퍼티 화면 표시 여부" prop="prptyScrnIndcYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-model="state.property.prptyScrnIndcYn">
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
									v-model="state.property.prptyDataSttusMtcd"
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
						<el-input v-model="state.property.prptySortOdrg" type="number" maxlength="5"></el-input>
					</el-form-item>	
					<el-form-item label="설명" prop="prptyDesc">
            <el-input v-model="state.property.prptyDesc"></el-input>
          </el-form-item>
        </el-form>
      </div>
    </div>

		<div class="boxLayout">
      <div class="boxTit">
        <h3>프라퍼티 정의</h3>
      </div>
      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRef2"
          :model="state.property"
          :rules="state.rules"
          label-width="200px"
          class="demo-ruleForm"
        >
          <el-form-item label="도메인 모델(Class/유형)" prop="domnModelId">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select 
                v-model="state.property.domnModelId"
                placeholder="선택">
                <el-option
                    v-for="item in domainModelList"
                    :key="item.modelId"
                    :label="`${item.modelNm} ${item.modelLogicNm} ${item.modelId === 'Class' ? '(공통)' : ''}`"
                    :value="item.modelId"
                />
              </el-select>
							</el-col>
						</el-row>
					</el-form-item>

          <el-form-item label="범위 모델" prop="rangeModelId">
						<div class="inline-area">
							<el-input style="width: 250px;" v-model="state.property.rangeModelId" disabled	/>
							<el-button type="default" class="ml15" @click="dialogVisibleModelSearch = true"><el-icon class="icon icon-search"/></el-button>
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
            <el-input v-model="state.property.rangeModelLogicNm" disabled></el-input>
          </el-form-item>

					<el-form-item label="범위 모델 코드그룹 ID" prop="rangeMtcdGrpId" v-bind:required="rangeModelCodeGroupEnable==false">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select class="w50"
									v-bind:disabled="rangeModelCodeGroupEnable"
									v-model="state.property.rangeMtcdGrpId"
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
            <el-input v-model="state.property.refPrptyId" v-bind:disabled="rangeModelRefEnable"></el-input>
          </el-form-item>

        </el-form>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="editPropertyInfo">저장</el-button>
      <el-button type="default" @click="cancelDialog">취소</el-button>
    </div>

  </div>
</template>
<script setup>
import PropertyDialogSearch from "@/components/meta/datamodel/PropertyDialogSearch.vue";
import MetaDataModelSearchPage from "@/views/feature/meta/setting/datamodel/MetaDataModelSearchPage.vue";
import { ref, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";
import metaConst from "@/assets/js/metaConst.js";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const ruleFormRef1 = ref(null);
const ruleFormRef2 = ref(null);
const nameCheck = ref(false);
const dialogVisiblePropertySearch = ref(false);
const dialogVisibleModelSearch = ref(false);
const rangeModelRefEnable = ref(true);
const rangeModelCodeGroupEnable = ref(true);
const isDataArrayYnDisabled = ref(false);
const typeModelList = ref([]);

const searchSttusCd = "use";
const searchMode = "range";
const searchTypeModelId = "";
const selectedRangeModel = (payload) => {
	let idx = metaConst.ARR_DERIVED_DATATYPE.findIndex(x => x === payload.rowData.dataTypeMtcd);
	if(idx != -1) {
		rangeModelRefEnable.value = false;
	} else {
		state.property.refPrptyId="";
		rangeModelRefEnable.value = true
	}
	if(payload.rowData.dataTypeMtcd == "code") {
		rangeModelCodeGroupEnable.value=false;
	} else {
		state.property.rangeMtcdGrpId="";
		rangeModelCodeGroupEnable.value=true;
	}
	state.property.rangeModelId=payload.rowData.modelId;
	state.property.rangeModelLogicNm=payload.rowData.modelLogicNm;
	dialogVisibleModelSearch.value = false;
};

const emits = defineEmits(["editPropertyInfo", "cancelDialog"]);
const props = defineProps({
	dataStatusCdList: {
		type: Array,
		required: false,
	},
	metaCodeGroupList: {
		type: Array,
		required: false,
	},
	domainModelList: {
		type: Array,
		required: false,
	}
});

const state = reactive({
  property: {
    prptyId: "",
		upPrptyId: "",
		upPrptyNm: "",
    prptyNm: "",
    prptyLogicNm: "",
		cntPrptyYn: "N",
		cntModelId: "",
		dataArrayYn: "N",
		prptyScrnIndcYn: "Y",
    prptyDesc: "",
    prptyDataSttusMtcd: "use",
    prptySortOdrg: 0,
		domnModelId:"",
		rangeModelId: "",
		rangeModelLogicNm: "",
		rangeMtcdGrpId:"",
		refPrptyId:""
  },
  rules: {
    prptyNm: [
      {
        required: true,
        message: "내용을 입력하세요.",
        trigger: "blur",
      }
    ],
    prptyLogicNm: [
      {
        required: true,
        message: "내용을 입력하세요.",
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
				if(state.property.cntModelId == "" || state.property.cntModelId == null) {
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
        message: "데이터 배열여부를 선택하세요.",
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
	prptyDataSttusMtcd: [
      {
        required: true,
        message: "프라퍼티 상태를 선택하세요.",
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
	],
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
        message: "참조할 프라퍼티 명을 입력하세요.",
        trigger: "blur",
      }
    ]
  }
});

onMounted(() => {
  getTypeModelList();
});

const editPropertyInfo = async () => {
  let ruleForm1 = ruleFormRef1.value;
  if (!ruleForm1) return;
  await propertyNameCheck('save');
  if (!nameCheck.value) return;

  let ruleForm2 = ruleFormRef2.value;
  if (!ruleForm2) return;

  let valid1 = await new Promise((resolve) => {
    ruleForm1.validate((valid) => {
      resolve(valid);
    });
  });

  let valid2 = await new Promise((resolve) => {
    ruleForm2.validate((valid) => {
      resolve(valid);
    });
  });

  if(valid1 && valid2) {
    state.property.prptyId = state.property.prptyNm;
    $axios
      .post($apiUrls.meta.data.property.createProperty, state.property)
      .then((res) => {
        alert("프라퍼티 등록이 완료되었습니다.\n[id : " + res.data.id + "]");
        resetProperty();
        emits("editPropertyInfo");
      })
      .catch((err) => {
        console.log(err);
        if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
          alert(err.response.data.message);
        } else {
          alert("프라퍼티 등록에 실패하였습니다.");
        }
      });
  }
  else {
	alert("입력 정보를 다시 한번 확인해주세요.");
  }
};


const propertyNameCheck = async (check) => {
	if(state.property.prptyNm == '') {
		alert("물리명을 입력해주세요."); 
		return false;
	}
	await $axios
		.get($apiUrls.meta.data.property.getPropertyCheck , {
			params: { prptyNm: state.property.prptyNm },
		})
		.then((res) => {
			if(res.data.duplicated) {
				alert('사용중인 물리명이 있습니다.');
				state.property.prptyNm = '';
				nameCheck.value = false;
			} else {
				if(check == 'alert') alert("사용가능합니다.");
				nameCheck.value = true;
			}
		}).catch((err) => {
			console.log(err);
		});
}

const resetProperty = () => {
		state.property.prptyId="";
		state.property.upPrptyId="";
		state.property.upPrptyNm="";
    state.property.prptyNm="";
    state.property.prptyLogicNm="";
		state.property.cntPrptyYn="N";
		state.property.cntModelId="";
		state.property.dataArrayYn="N";
		state.property.prptyScrnIndcYn="Y";
    state.property.prptyDesc="";
    state.property.prptyDataSttusMtcd="use";
    state.property.prptySortOdrg="";
		state.property.domnModelId="";
		state.property.rangeModelId="";
		state.property.rangeModelLogicNm="";
		state.property.rangeMtcdGrpId="";
		state.property.refPrptyId="";
};

const changePrptyDataSttusMtcd = (data) => {
	state.property.prptyDataSttusMtcd = data;
}
const changeRangeMtcdGrpId = (data) => {
	state.property.rangeMtcdGrpId = data;
}

const cancelDialog = () => {
  emits("cancelDialog");
};

const selectedUpProperty = (payload) => {
	state.property.upPrptyId=payload.rowData.prptyId;
	state.property.upPrptyNm=payload.rowData.prptyNm;
	dialogVisiblePropertySearch.value=false;
}

const refreshProperty = () => {
	state.property.upPrptyId = "";
	state.property.upPrptyNm = "";
}
const refreshRangeModel = () => {
	state.property.rangeModelId="";
	state.property.refPrptyId="";
	state.property.rangeMtcdGrpId="";
	rangeModelRefEnable.value = true;	// 범위모델 참조 비활성화
	rangeModelCodeGroupEnable.value=true;
}

const changePrptyNm = () => {
	nameCheck.value = false; //중복체크 진행 유도 변수 (값 변경 시 중복체크를 다시 진행해야만 저장 버튼 활성화)
};

const chgCntPrptyYn = () => {
	if(state.property.cntPrptyYn == "Y") {
		state.property.dataArrayYn = "N";
		isDataArrayYnDisabled.value = true;
	}
	else {
		isDataArrayYnDisabled.value = false;
		state.property.cntModelId = "";
	}
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

</script>
<style lang="scss">
.dialog_size {
  width: 800px !important;
}
</style>