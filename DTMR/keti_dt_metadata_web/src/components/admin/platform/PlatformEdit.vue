<template>
  <div class="cntSec">
      <el-form
        ref="ruleFormRef"
        :model="state.platform"
        :rules="state.rules"
        label-width="170px"
        class="demo-ruleForm"
        :label-position="labelPosition"
      >
        <div class="boxCnt">
          <div style="overflow-x: hidden; overflow-y: auto">
            <el-row>
              <el-col :span="22">
                <el-form-item label="Platform ID" prop="pltfrmId">
                  <el-input v-model="state.platform.pltfrmId" @input="ValidateVarchar32" :disabled="props.pltfrmId != null"></el-input>
                  <span class="badge badge-danger mt-1" v-if="!ValidateVarchar">32자리 까지만 입력 가능합니다.</span>
                </el-form-item>
              </el-col>
              <el-col :span="22">
                <el-form-item label="Platform 명" prop="pltfrmNm">
                  <el-input v-model="state.platform.pltfrmNm" @input="ValidateVarchar128"></el-input>
                  <span class="badge badge-danger mt-1" v-if="!ValidateVarchar">128자리 까지만 입력 가능합니다.</span>
                </el-form-item>
              </el-col>
              <el-col :span="22">
                <el-form-item label="Platform 설명" prop="pltfrmDesc">
                  <el-input v-model="state.platform.pltfrmDesc" type="textarea" @input="ValidateVarchar4000"></el-input>
                  <span class="badge badge-danger mt-1" v-if="!ValidateVarchar">4000자리 까지만 입력 가능합니다.</span>
                </el-form-item>
              </el-col>
              <el-col :span="22">
                <el-form-item label="사용여부" prop="useYn">
                  <el-select v-model="state.platform.useYn" placeholder="선택">
                    <el-option
                      v-for="item in useYnList"
                      :key="item.value"
                      :label="item.name"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-form>
    <div class="btnSec taR mt20">
      <el-button type="primary" @click="EditPlatform">저장</el-button>
      <el-button plain type="primary" @click="cancelDialog">닫기</el-button>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, defineExpose, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { getUser } from "@/assets/js/auth.js";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const store = useStore();
const users = getUser();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);
const labelPosition = ref("right");

const props = defineProps({
  pltfrmId: {
    type: String,
    required: false,
  },
});

const emits = defineEmits(["cancelDialog", "goToList"]);

let pltfrmId = props.pltfrmId;

const state = reactive({
  platform: {
    pltfrmId: "",  
    pltfrmNm: "",
    pltfrmDesc: "",
    useYn: "",
    odrg: "",
    regDt: "",
    regrId: "",
    regrNm: "",
    amdDt: "",
    amdrId: "",
    amdrNm: ""
  },
  rules: {
    pltfrmId: [
      {
        required: true,
        message: "플랫폼 ID를 입력하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "플랫폼 ID 입력",
        trigger: "blur",
      },
    ],
    pltfrmNm: [
      {
        required: true,
        message: "플랫폼 명을 입력하세요.",
        trigger: "blur",
      },
      {
        min: 0,
        message: "플랫폼 명 입력",
        trigger: "blur",
      },
    ],    
    useYn: {
      required: true,
      message: "사용여부를 선택하세요.",
      trigger: "blur",
    },
  },
});

onMounted(() => {
  if (pltfrmId) {
    getPlatformDetail();
  }
});

const getPlatformDetail = () => {
  $axios
    .get(util.format($apiUrls.platform.getPlatformDetail, pltfrmId))
    .then((res) => {
      state.platform = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const EditPlatform = async () => {
  if (!ruleFormRef) return;
  // await ruleFormRef.validate((valid) => {
  //   if (valid) {
      let platform = state.platform;
      
      let platformInfo = {
        pltfrmId: platform.pltfrmId,  
        pltfrmNm: platform.pltfrmNm,
        pltfrmDesc: platform.pltfrmDesc,
        useYn: platform.useYn,
        odrg: platform.odrg,
        regrId: users.id,
        regrNm: users.name,
      };

      let platformUpdateInfo = {
        pltfrmId: platform.pltfrmId,  
        pltfrmNm: platform.pltfrmNm,
        pltfrmDesc: platform.pltfrmDesc,
        useYn: platform.useYn,
        odrg: platform.odrg,
        amdrId: users.id,
        amdrNm: users.name,
      };

      if (pltfrmId != null) {
        let result = confirm("Platform 정보를 수정하시겠습니까?");
        if(result){
          $axios
            .put(util.format($apiUrls.platform.modifyPlatform, pltfrmId),
            platformUpdateInfo
            )
            .then(() => {
              alert('Platform 정보가 수정되었습니다.')
              cancelDialog();
              goToList();
            }).catch((err) => {
              console.log(err);
              alert("Platform 정보 수정에 실패하였습니다.");
            });
        }
      }
      else {
        let result = confirm("Platform 정보를 저장하시겠습니까?");
        if(result){
          $axios
            .post($apiUrls.platform.setPlatformDetail, platformInfo)
            .then(() => {
              alert("Platform 정보가 저장되었습니다.");
              cancelDialog();
              goToList();
            })
            .catch((err) => {
              console.log(err);
              alert("Platform 정보 저장에 실패하였습니다.");
            });
        }
      }
    // } else {
    //   alert("필수사항을 입력하십시오.");
    // }

  // });
};

const goToList = () => {
  emits("goToList");
};

const cancelDialog = () => {
  emits("cancelDialog");
};

// 글자수 제한
let ValidateVarchar = true;
const ValidateVarchar32 = (text) => {
  if(text.length >= 32){
    return ValidateVarchar = false;
  }else{
    return ValidateVarchar = true;
  }
}
const ValidateVarchar128 = (text) => {
  if(text.length >= 128){
    return ValidateVarchar = false;
  }else{
    return ValidateVarchar = true;
  }
}
const ValidateVarchar4000 = (text) => {
  if(text.length >= 4000){
    return ValidateVarchar = false;
  }else{
    return ValidateVarchar = true;
  }
}

const useYnList = [
  { name: "사용", value: "Y" },
  { name: "미사용", value: "N" },
];

</script>
<style lang="scss">
.container *{
	vertical-align:middle;
}
#titleStyle{
  background:#FFFFFF;
}
#whiteSpace {
  margin-bottom: 20px;
}
</style>
