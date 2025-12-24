<template>
  <div>
    <el-table :data="rdfMappingList" border style="width: 100%">
      <el-table-column prop="rdfFormMtcdNm" label="RDF 매핑 형식" :min-width="80" />
      <el-table-column prop="modelNm" label="메타데이터 유형" :min-width="150" />
      <el-table-column prop="rdfMappgNm" label="RDF 매핑명" :min-width="150" />
      <el-table-column prop="rdfMappingModel" label="RDF 매핑 모델" :min-width="150" />
      <el-table-column prop="rdfMappgYn" label="매핑 여부" :min-width="50" />
      <el-table-column label="매핑 관리" :min-width="70" >
        <template #default="{ row }">
          <el-button type="primary" size="small" v-if="row.rdfMappgYn === 'N' && isWriteYn(route.meta.auth)" @click="mappingCreate(row)">매핑 등록</el-button>
          <el-button type="primary" plain size="small" v-if="row.rdfMappgYn === 'Y' && (isAmdYn(route.meta.auth) || (!isAmdYn(route.meta.auth) && isReadYn(route.meta.auth)))" @click="mappingManage(row)">매핑 관리</el-button>
        </template>
      </el-table-column>
    </el-table>
    <ComnPagination :totalPage="totalPage" :curPage="curPage" @pagemove="pagemove" />
  </div>

  <div>
    <el-dialog title="RDF 매핑 등록" v-model="state.rdfMappingEditVisible">
      <RdfMappingDialogEdit 
        ref="editRdfMapping"
        :rdfInfo="state.rdfInfo"
        @cancelPopup="cancelPopup"
      />
    </el-dialog>
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";
import { ref, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getUser } from "@/assets/js/auth.js";
import { routerPush, getCookie, isWriteYn, isAmdYn, isReadYn } from "@/assets/js/common.js";
import RdfMappingDialogEdit from "@/components/meta/rdfmapping/RdfMappingDialogEdit.vue";

const route = useRoute();
const router = useRouter();
const user = getUser();

const emits = defineEmits(["pageMove"]);

const state = reactive({ 
  rdfMappingEditVisible: false,
  rdfInfo: {},
});
const props = defineProps({
  rdfMappingList: {
    type: Array,
    required: true,
  },
  curPage: {
    type: Number,
    required: true,
  },
  totalPage: {
    type: Number,
    required: true,
  },
});

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const mappingCreate = (data) => {
  state.rdfInfo = data;
  state.rdfMappingEditVisible = true;
};

const mappingManage = (data) => {
  let platform = getCookie("pltfrmId");
	let query = { rdfMappgId: data.rdfMappgId };

  routerPush(platform, "RefMappingDetailPage", query);
};

const cancelPopup = () => {
  state.rdfMappingEditVisible = false;
};

</script>
<style lang="scss"></style>
