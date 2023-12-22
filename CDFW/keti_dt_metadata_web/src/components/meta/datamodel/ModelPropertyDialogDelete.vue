<template>
  <div>
    <div class="boxLayout">
      <div class="boxTit">
        <h3>모델 프라퍼티 삭제</h3>
      </div>
      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRef"
          :rules="state.rules"
          :model="state.deleteProperty"
          class="demo-ruleForm"
          label-width="100"
        >
          <el-form-item prop="modelPrptyDelWhy" label="삭제사유" >
            <el-input style="fit-content" v-model="state.deleteProperty.modelPrptyDelWhy"></el-input>
          </el-form-item>          
        </el-form>
        <div class="taR">
          <el-button type="primary" plain v-show="!deleteSuccess"   @click="deleteModelProperty">삭제</el-button>
          <el-button type="default" v-show="!deleteSuccess"  @click="cancelDialog">취소</el-button>
          <el-button type="default" v-show="deleteSuccess" @click="completeDialog" >확인</el-button>
        </div>
      </div>
    </div>

    <div class="boxLayout">
      <div class="boxCnt">
        <div class="ly-table">
          <el-form label-position="right" label-width="100">
            <el-form-item label="결과 메세지" style="height: 300px;">
              <div v-html="state.resultMessage"></div>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>  
</template>
<script setup>
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";
import { ref, reactive } from "vue";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const ruleFormRef = ref(null);
const emits = defineEmits("cancelDialog");
const deleteSuccess = ref(false);
const props = defineProps({
  modelId:{
    type: String,
    required: true
  },
  modelPropertyList : {
    type: Array,
    required: true,
  }
});

const state = reactive({
  deleteProperty: {
    modelPrptyDelWhy:""
  },
  resultMessage:"",
  rules: {
    modelPrptyDelWhy: [
      {
        required: true,
        message: "삭제사유는 필수입니다.",
        trigger: "blur"
      }
    ]
  }
});

const deleteModelProperty = async () => {
  let deleteList=[];
  props.modelPropertyList.map((ele)=>{
    if(ele.modelPrptyDelYn==true) {
      let obj = reactive({...ele, modelPrptyDelYn: "Y", modelPrptyDelWhy: state.deleteProperty.modelPrptyDelWhy});      
      deleteList.push(obj);
    }; 
  });
  let result = confirm(deleteList.length+"건의 모델 프라퍼티를 삭제합니다.\n이미 메타데이터에서 사용중인 모델 프라퍼티 경우는 삭제처리됩니다.\n진행하시겠습니까?");
  if(result){
    let ruleForm = ruleFormRef.value;
    if (!ruleForm) return;
    await ruleForm.validate((valid)=>{
      if(valid) {
        $axios
          .delete(util.format($apiUrls.meta.data.typemodelproperty.deleteModelProperty, props.modelId),  { data: deleteList })
          .then((res) => {
            //console.log(res.data.updateId.length);
            state.resultMessage = "<p>"+deleteList.length+"건 중"+res.data.deleteCount+"건이 삭제되었습니다.</p><br>";
            if(deleteList.length != res.data.deleteCount) {
              state.resultMessage += "<p>"+"다음 프라퍼티들은 이미 메타데이터에 사용되고 있어서 삭제처리됩니다.</p>";
              res.data.updateId.map((id)=> {
                if(id != null)
                state.resultMessage += "<p>- "+ id+"</p>";
              });
            }

            alert("삭제가 완료되었습니다.");
            deleteSuccess.value = true;
          })
          .catch((err) => {            
            console.log(err);
            if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
              alert(err.response.data.message);
            } else {
              alert("삭제에 실패하였습니다.");
            }            
          });
      } else {        
        alert("삭제사유는 필수입니다.");
      }
    });
  }
}

const cancelDialog = () =>{
  emits("cancelDialog");
}

const completeDialog = () =>{
  state.resultMessage= "";
  state.modelPrptyDelWhy="";     
  emits("completeDialog");
}

</script>
<style lang="scss">
</style>