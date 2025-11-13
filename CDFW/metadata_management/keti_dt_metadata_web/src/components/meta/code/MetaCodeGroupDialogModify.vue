<template>
	<div class="dialog-area" id="codePopup">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>{{ curTitle }}</h3>
      </div>
      <div class="boxCnt">
        <el-form label-position="right"
          ref="ruleFormRef"
          :model="metaCodeGroup"
          :rules="rules"
          label-width="200px"
          class="demo-ruleForm"
        >
          <el-form-item label="메타코드그룹 ID" prop="mtcdGrpId">
            <el-input
              v-model="metaCodeGroup.mtcdGrpId"
              disabled
            ></el-input>
          </el-form-item>				

          <el-form-item label="코드그룹 명" prop="mtcdGrpNm">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="metaCodeGroup.mtcdGrpNm"
            ></el-input>
          </el-form-item>

          <el-form-item label="코드그룹설명" prop="mtcdGrpDesc">
            <el-input
              v-bind:disabled="curPage != 'modify'"
              v-model="metaCodeGroup.mtcdGrpDesc"
            ></el-input>
          </el-form-item>

          <el-form-item label="사용 여부" prop="mtcdGrpUseYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-bind:disabled="curPage != 'modify'" v-model="metaCodeGroup.mtcdGrpUseYn" >
									<el-option label="Y" value="Y" />
									<el-option label="N" value="N" />
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>
          
					<el-form-item label="시스템용 여부" prop="mtcdGrpSysUsgYn">
						<el-row :gutter="20">
							<el-col :span="24">
								<el-select v-model="metaCodeGroup.mtcdGrpSysUsgYn">
									<el-option label="Y" value="Y" />
									<el-option label="N" value="N" />
								</el-select>
							</el-col>
						</el-row>
					</el-form-item>          

					<el-form-item label="상위 코드그룹 ID">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-select 
                  v-bind:disabled="curPage != 'modify'"
                  v-model="metaCodeGroup.upMtcdGrpId"
                  @change="changeupMtcdGrpCd"
                  placeholder="선택">
                  <el-option label="최상위" value="" />
                    <el-option 
                      v-for="item in upperMetaCodeGroupList" 
                      :key="item.mtcdGrpId" 
                      :label="item.mtcdGrpNm"
                      :value="item.mtcdGrpId" />
                </el-select>
              </el-col>
            </el-row>
        	</el-form-item>          

        </el-form>
      </div>
    </div>
    <div class="btnSec taR mt20">
      <el-button type="primary" v-if="isAmdYn(route.meta.auth) && curPage == 'modify'"
        @click="modifyMetaCodeGroupInfo"
        >저장</el-button
      >
      <el-button type="default" @click="cancelDialog">취소</el-button>
    </div>
  </div>

</template>
<script setup>
import { ref, defineProps, defineEmits, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { isAmdYn, isDelYn } from "@/assets/js/common.js";

const route = useRoute();

const props = defineProps({
  metaCodeGroup: {
    type: Object,
    required: true,
  },  
  curPage: {
    type: String,
    required: false,
  },
  curTitle: {
    type: String,
    required: false,
  },
	upperMetaCodeGroupList: {
		type: Array,
		required: true,
	}
});

const emits = defineEmits([
  "cancelModifyDialog",
  "modifyMetaCodeGroupInfo",
]);

const ruleFormRef = ref(null);

const rules = ref({
	mtcdGrpId: [
		{
			max: 32,
			message: "32자 이하만 가능합니다.",
			trigger: "blur",
		}
	],
	mtcdGrpNm: [
		{
			max: 128,
			message: "128자 이하만 가능합니다.",
			trigger: "blur",
		},
		{
			required: true,
			message: "내용을 입력하세요.",
			trigger: "blur",
		}
	],
	mtcdGrpUseYn: [
		{
			required: true,
			message: "내용을 입력하세요.",
			trigger: "blur",
		}
	],
	mtcdGrpDesc: [
		{
			max: 1000,
			message: "1000자 이하만 가능합니다.",
			trigger: "blur",
		}
	],
	upMtcdGrpId: [
		{
			max: 32,
			message: "32자 이하만 가능합니다.",
			trigger: "blur",
		}
	],
	mtcdGrpSysUsgYn: [
		{
			required: true,
			message: "내용을 입력하세요.",
			trigger: "blur",
		}
	]
});

onMounted(() => {
	upMtcdGrpIdInit();
});

watch(() => props.metaCodeGroup.upMtcdGrpId, () => {
	if (!props.metaCodeGroup.upMtcdGrpId?.trim()) { //문자열 미존재
		props.metaCodeGroup.upMtcdGrpId = ""; // backend에서 "" 입력 시, null로 setting될 수 있도록 함.
	}
});

const upMtcdGrpIdInit = () => {
	if (!props.metaCodeGroup.upMtcdGrpId?.trim()) { //문자열 미존재
		props.metaCodeGroup.upMtcdGrpId = ""; // backend에서 "" 입력 시, null로 setting될 수 있도록 함.
	}
};

const cancelDialog = () => {
  emits("cancelModifyDialog");
};

const changeupMtcdGrpCd = (data) => {
	props.metaCodeGroup.upMtcdGrpId = data;
};

const modifyMetaCodeGroupInfo = async () => {
  let ruleForm = ruleFormRef.value;
  if (!ruleForm) return;

  emits("modifyMetaCodeGroupInfo", { data: props.metaCodeGroup, ruleFormRef });
};

</script>
<style lang="scss"></style>