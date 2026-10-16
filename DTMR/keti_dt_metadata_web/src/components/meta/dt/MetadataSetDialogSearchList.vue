<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="metadataSetList"
      :height="440"
      @row-click="rowClick"
    >
      <template #medataSetNm="{ row }">
        {{ row.medataSetNm }}
        <span
          v-if="row.medataSetSttusMtcd"
          class="meta-status-badge ml10"
          :class="`is-${row.medataSetSttusMtcd}`"
        >{{ row.medataSetSttusMtcdNm }}</span>
      </template>
    </comn-list>
    <ComnPagination :totalPage="totalPage" :curPage="props.curPage" @pagemove="pagemove" />
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, reactive, getCurrentInstance, defineProps, defineEmits } from "vue";
import { useRouter, useRoute } from "vue-router";

const route = useRoute();
const router = useRouter();
const emits = defineEmits(["pageMove", "selectedRow"]);

const props = defineProps({
	totalPage: {
		type: Number,
		required: true
	},
  curPage: {
    type: Number,
    required: true,
  },	
	metadataSetList: {
		type: Array,
		required: true
	}
});

const tableHeader = ref([
	{
    prop: "medataSetNm",
    label: "메타데이터 셋 명",
    width: 200,
    columnType: "custom",
	},
	{
    prop: "modelNm",
    label: "모델 명",
    width: 120,
	},
	{
    prop: "modelLogicNm",
    label: "모델 논리명",
    width: 120,
	},
]);

const rowClick = (rowData) => {
	emits("selectedRow", { rowData });  
};

const pagemove = (payload) => {
  emits("pageMove", payload);
};

</script>
<style lang="scss">
</style>