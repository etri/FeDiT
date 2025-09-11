<template>
    <div class="cntSec">
        <FeatureCodeSearchForm @searchFeatureCodeList="searchFeatureCodeList" />
        <div class="btnSec taR mt10">
            <el-button type="primary" size="large" v-if="isWriteYn(route.meta.auth)"
                @click="dialogVisibleEdit = true">등록</el-button>
        </div>

        <el-dialog v-model="dialogVisibleEdit" title="식별체계 - 객체 - 지형지물 코드 등록">
            <FeatureCodeDialogEdit @cancelDialog="cancelDialog" @editFeatureCodeInfo="editFeatureCodeInfo" />
        </el-dialog>

        <div class="boxLayout">
            <div class="boxTit">
                <h3>지형지물 코드 목록</h3>
            </div>
            <div class="boxCnt">
                <div style="overflow-x: hidden; overflow-y: auto">
                    <FeatureCodeList :featureCodeList="state.featureCodeList" :totalPage="state.pageInfo.totalListSize"
                        :curPage="state.pageInfo.curPage" @pageMove="pageMove"
                        @editFeatureCodeInfo="editFeatureCodeInfo" />
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import FeatureCodeList from "@/components/meta/featurecode/FeatureCodeList.vue";
import FeatureCodeSearchForm from "@/components/meta/featurecode/FeatureCodeSearchForm.vue";

import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { getGlobalProperties, isWriteYn, isReadYn } from "@/assets/js/common.js";
import FeatureCodeDialogEdit from "@/components/meta/featurecode/FeatureCodeDialogEdit.vue";

const store = useStore();
const route = useRoute();
const router = useRouter();
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
    getCurrentInstance().appContext.config.globalProperties.$emitter;

const state = reactive({
    featureCodeList: [],
    pageInfo: {
        curPage: 1,
        idSchmCd: "",
        idSchmCdNm: "",
        idfyUseYn: "",
        useYn: "",
        totalListSize: 0,
        pageListSize: 10,
        blockSize: 5,
    }
});

onMounted(() => {
    getFeatureCodeList();
});

const editFeatureCodeInfo = () => {
    getFeatureCodeList();
};

const getFeatureCodeList = () => {
    $axios
        .get($apiUrls.meta.schema.idschemecode.getIdSchemeFeatureCodeList, {
            params: {
                curPage: state.pageInfo.curPage,
                lctgExtrCd: state.pageInfo.lctgExtrCd,
                idSchmCd: state.pageInfo.idSchmCd,
                idSchmCdNm: state.pageInfo.idSchmCdNm,
                idfyUseYn: state.pageInfo.idfyUseYn,
                useYn: state.pageInfo.useYn,
            },
        })
        .then((res) => {
            state.featureCodeList = res.data.list;
            state.pageInfo.totalListSize = res.data.page.totalListSize;
        })
        .catch((err) => {
            console.log(err);
        });
};

const searchFeatureCodeList = (payload) => {
    state.pageInfo.curPage = payload.curPage;
    state.pageInfo.idSchmCd = payload.pageInfo.idSchmCd;
    state.pageInfo.idSchmCdNm = payload.pageInfo.idSchmCdNm;
    state.pageInfo.idfyUseYn = payload.pageInfo.idfyUseYn;
    state.pageInfo.useYn = payload.pageInfo.useYn;
    getFeatureCodeList();
};

const pageMove = (payload) => {
    state.pageInfo.curPage = payload;
    getFeatureCodeList();
};

const dialogVisibleEdit = ref(false);
const cancelDialog = () => {
    dialogVisibleEdit.value = false;
};

</script>
<style lang="scss"></style>