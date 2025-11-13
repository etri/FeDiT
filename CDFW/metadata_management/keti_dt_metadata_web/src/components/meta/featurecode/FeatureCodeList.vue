<template>
    <div>
        <ComnList :tableHeader="tableHeader" :tableData="featureCodeList">
            <template v-slot:btn="slotData" v-if="isAmdYn(route.meta.auth)">
                <el-button type="primary" size="small" @click="goToModifyDialog(slotData)">수정</el-button>
            </template>
        </ComnList>

        <el-dialog v-model="dialogVisibleModify" title="식별체계 - 객체 - 지형지물 코드 수정">
            <FeatureCodeDialogModify :featureCode="state.featureCode" :curPage="curPage"
                @cancelModifyDialog="cancelModifyDialog" @modifyFeatureCodeInfo="modifyFeatureCodeInfo" />
        </el-dialog>

        <ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
    </div>
</template>
<script setup>
import FeatureCodeDialogModify from "@/components/meta/featurecode/FeatureCodeDialogModify.vue";
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, reactive, defineProps, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getUser, getLoginUserId } from "@/assets/js/auth.js";
import { getGlobalProperties, isAmdYn, isReadYn } from "@/assets/js/common.js";
import util from "util";

const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
    getCurrentInstance().appContext.config.globalProperties.$emitter;
const user = getUser();

const curPage = ref("");
const curTitle = ref("");

const emits = defineEmits(["editFeatureCodeInfo", "pageMove"]);

const props = defineProps({
    featureCodeList: {
        type: Array,
        requierd: false
    },
    totalPage: {
        type: Number,
        requierd: true
    },
    curPage: {
        type: Number,
        required: true,
    },
});

const state = reactive({
    featureCodeList: [],
    featureCode: {},
    pageInfo: {
        curPage: 1,
        totalListSize: 0,
        pageListSize: 10,
        blockSize: 5,
    }
});

const tableHeader = ref([
    {
        prop: "idSchmCd",
        label: "식별체계 코드",
        width: 70,
    },
    {
        prop: "idSchmCdNm",
        label: "식별체계 코드 명",
        width: 150,
    },
    {
        prop: "idSchmCdEngNm",
        label: "식별체계 코드 영문 명",
        width: 200,
    },
    {
        prop: "idfyUseYn",
        label: "식별 사용 여부",
        width: 70,
    },
    {
        prop: "useYn",
        label: "사용 여부",
        width: 60,
    },
    {
        prop: "btn",
        label: "",
        width: 50,
        columnType: "custom",
    }
]);

const pagemove = (payload) => {
    emits("pageMove", payload);
};

const dialogVisibleModify = ref(false);
const goToModifyDialog = (payload) => {
    state.featureCode = payload.row;
    dialogVisibleModify.value = true;
};
const cancelModifyDialog = () => {
    dialogVisibleModify.value = false;
};

const modifyFeatureCodeInfo = async (payload) => {
    let ruleForm = payload.ruleFormRef.value;
    if (!ruleForm) return;
    await ruleForm.validate((valid, fields) => {
        if (valid) {
            let result = confirm("수정 하시겠습니까?");
            if (result) {
                let idSchmCd = payload.data.idSchmCd;
                let featureCodeInfo = { ...payload.data };
                $axios
                    .put(
                        util.format($apiUrls.meta.schema.idschemecode.modifyIdSchemeFeatureCode, idSchmCd),
                        featureCodeInfo
                    )
                    .then(() => {
                        alert("수정이 완료되었습니다.");
                        dialogVisibleModify.value = false;
                        emits("editFeatureCodeInfo");
                    })
                    .catch((err) => {

                        console.log(err);
                        if (err.response && err.response.status && (err.response.status === 422 || err.response.status === 400)) {
                            alert(err.response.data.message);
                        } else {
                            alert("수정에 실패하였습니다.");
                        }
                    });
            }

        } else {
            alert("입력 정보를 다시 한번 확인해주세요.");
        }
    });
};

</script>