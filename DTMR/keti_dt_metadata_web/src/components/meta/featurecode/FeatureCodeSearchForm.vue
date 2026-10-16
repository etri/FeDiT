<template>
    <div class="boxLayout">
        <div class="boxTit">
            <h3>지형지물 코드 검색</h3>
            <div class="btnSec taR">
                <el-button type="default" @click="refresh">초기화</el-button>
                <el-button type="primary" @click="getFeatureCodeList(1)">검색</el-button>
            </div>
        </div>
        <div class="boxCnt">
            <el-form :inline="true" :model="pageInfo" class="demo-form-inline search-form" label-width="150px"
                label-position="left">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="식별체계 코드">
                            <el-input class="" v-model="pageInfo.idSchmCd" placeholder="식별체계 코드"
                                @keydown.enter.prevent="getFeatureCodeList(1)" style="" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="식별체계 코드 명">
                            <el-input class="" v-model="pageInfo.idSchmCdNm" placeholder="식별체계 코드 명"
                                @keydown.enter.prevent="getFeatureCodeList(1)" style="" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="식별 사용여부">
                            <el-select v-model="pageInfo.idfyUseYn" placeholder="선택" class="w40">
                                <el-option label="전체" value="" />
                                <el-option label="Y" value="Y" />
                                <el-option label="N" value="N" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="사용여부">
                            <el-select v-model="pageInfo.useYn" placeholder="선택" class="w40">
                                <el-option label="전체" value="" />
                                <el-option label="Y" value="Y" />
                                <el-option label="N" value="N" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

            </el-form>

        </div>
    </div>
</template>
<script setup>
import { reactive, defineEmits, defineProps, watch } from "vue";

const emits = defineEmits(["searchFeatureCodeList"]);

const props = defineProps({

});

const pageInfo = reactive({
    idSchmCd: "",
    idSchmCdNm: "",
    idfyUseYn: "",
    useYn: "",
});

const getFeatureCodeList = (data) => {
    emits("searchFeatureCodeList", { curPage: data, pageInfo });
};

const refresh = () => {
    pageInfo.idSchmCd = "";
    pageInfo.idSchmCdNm = "";
    pageInfo.idfyUseYn = "";
    pageInfo.useYn = "";
};

</script>
<style lang="scss"></style>