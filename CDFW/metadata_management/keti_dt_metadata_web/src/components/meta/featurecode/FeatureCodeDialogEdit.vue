<template>
    <div class="dialog-area">
        <div class="boxLayout">
            <div class="boxTit">
                <h3>식별체계 - 객체 - 지형지물 코드 정보</h3>
            </div>
            <div class="boxCnt">
                <el-form ref="ruleFormRef" :model="state.featureCode" :rules="state.rules" label-width="200px"
                    class="demo-ruleForm" label-position="right">

                    <el-form-item label="식별체계 코드" prop="idSchmCd">
                        <div class="inline-area">
                            <el-input v-model="state.featureCode.idSchmCd" disabled />
                            <el-button type="primary" plain class="ml15" @click="duplicateCheck()">중복 확인</el-button>
                        </div>
                    </el-form-item>

                    <el-form-item label="원본 외부 코드 (최대 5자리)" prop="originExtrCd">
                        <el-input v-model="state.featureCode.originExtrCd" maxlength="5" @keyup="chgExtrCd()" />
                    </el-form-item>

                    <el-form-item label="식별체계 코드 명" prop="idSchmCdNm">
                        <el-input v-model="state.featureCode.idSchmCdNm" />
                    </el-form-item>

                    <el-form-item label="식별체계 코드 영문 명" prop="idSchmCdEngNm">
                        <el-input v-model="state.featureCode.idSchmCdEngNm" />
                    </el-form-item>

                    <el-form-item label="식별체계 코드 설명" prop="idSchmCdDesc">
                        <el-input v-model="state.featureCode.idSchmCdDesc" />
                    </el-form-item>

                    <el-form-item label="사용 여부" prop="useYn">
                        <el-select v-model="state.featureCode.useYn" placeholder="선택">
                            <el-option key="Y" label="Y" value="Y" />
                            <el-option key="N" label="N" value="N" />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="식별 사용 여부" prop="idfyUseYn">
                        <el-select class="w30" v-model="state.featureCode.idfyUseYn" placeholder="선택" disabled>
                            <el-option key="Y" label="Y (ID 생성에 사용됨)" value="Y" />
                            <el-option key="N" label="N (ID 생성에 사용되지 않음)" value="N" />
                        </el-select>
                    </el-form-item>

                </el-form>
            </div>
        </div>

        <div class="btnSec taR mt20">
            <el-button type="primary" @click="editFeatureCodeInfo">저장</el-button>
            <el-button type="default" @click="resetFeatureCode">취소</el-button>
        </div>
    </div>
</template>
<script setup>
import { ref, reactive, defineEmits, defineProps } from "vue";
import { useRoute } from "vue-router";
import { getLoginUserId } from "@/assets/js/auth.js";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const ruleFormRef = ref(null);

const emits = defineEmits(["editFeatureCodeInfo", "cancelDialog"]);

const props = defineProps({
    dataStatusList: { //데이터 상태코드리스트
        type: Array,
        required: false,
    }
});

const state = reactive({
    duplYn: false,
    featureCode: {
        idSchmCd: "",
        originExtrCd: "",
        idSchmCdNm: "",
        idSchmCdEngNm: "",
        idSchmCdDesc: "",
        useYn: "Y",
        idfyUseYn: "Y"
    },
    rules: {
        idSchmCd: [
            {
                required: true,
                // message: "외부 코드를 입력하여 생성해주세요.",
                message: "",
                trigger: "blur",
            }
        ],
        originExtrCd: [
            {
                required: true,
                message: "내용을 입력하세요.",
                trigger: "blur",
            },
            {
                max: 5,
                message: "5글자 이하만 가능합니다.",
                trigger: "blur",
            }
        ],
        idSchmCdNm: [
            {
                required: true,
                message: "내용을 입력하세요.",
                trigger: "blur",
            }
        ],
        useYn: [
            {
                required: true,
                message: "내용을 입력하세요.",
                trigger: "blur",
            }
        ],
        idfyUseYn: [
            {
                required: true,
                // message: "내용을 선택하세요.",
                message: "",
                trigger: "blur",
            }
        ],
    }
});

const editFeatureCodeInfo = async () => {
    if (!state.duplYn) {
        alert("식별체계 코드 중복 확인을 진행해주세요.");
        return;
    }
    let ruleForm = ruleFormRef.value;
    if (!ruleForm) return;
    await ruleForm.validate((valid, fields) => {
        if (valid) {
            let featureCode = { ...state.featureCode };
            $axios
                .post($apiUrls.meta.schema.idschemecode.createIdSchemeFeatureCode, featureCode)
                .then(() => {
                    alert("지형지물 코드 등록이 완료되었습니다.");
                    resetFeatureCode();
                    emits("editFeatureCodeInfo");
                })
                .catch((err) => {

                    console.log(err);
                    if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
                        alert(err.response.data.message);
                    } else {
                        alert("지형지물 코드 등록에 실패하였습니다.");
                    }
                });
        } else {
            alert("입력 정보를 다시 한번 확인해주세요.");
        }
    });
};

const duplicateCheck = () => {
    const idSchmCd = state.featureCode.idSchmCd;
    if (idSchmCd === "") {
        alert("외부 코드를 입력하여 식별체계 코드를 생성해주세요.");
        return;
    }
    $axios
        .get(util.format($apiUrls.meta.schema.idschemecode.checkFeatureCode, idSchmCd))
        .then((res) => {
            if (res.data.duplicated === true) {
                alert("이미 사용 중인 식별체계 코드입니다.");
                state.duplYn = false;
            }
            else {
                alert("사용 가능한 식별체계 코드입니다.");
                state.duplYn = true;
            }
        })
        .catch((err) => {
            console.log(err);
        });
};

const chgExtrCd = () => {
    state.duplYn = false;
    state.featureCode.idSchmCd = state.featureCode.originExtrCd;
};

const resetFeatureCode = () => {
    state.featureCode.idSchmCd = "";
    state.featureCode.originExtrCd = "";
    state.featureCode.idSchmCdNm = "";
    state.featureCode.idSchmCdEngNm = "";
    state.featureCode.idSchmCdDesc = "";
    state.featureCode.useYn = "Y";
    state.featureCode.idfyUseYn = "Y";
    cancelDialog();
};

const cancelDialog = () => {
    emits("cancelDialog");
};

</script>
<style lang="scss"></style>