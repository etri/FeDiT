<template>
  <div>
    <comn-list
      :tableHeader="tableHeader"
      :tableData="modelPropertyDelHistList"
      :height="440"
    >
    </comn-list>		
  </div>   
</template>

<script setup>
import ComnList from "@/components/common/ComnList";
import { ref } from "vue";

const props = defineProps({
	modelPropertyDelHistList: {
		type: Array,
		required: true
	}
});

const tableHeader = ref([
  {
    prop: "rownum",
    label: "순서",
    width: 30,
    align: "center"
  },
	{
    prop: "prptyNm",
    label: "프라퍼티 명",
    width: 100,
    align: "left"
  },
	{
    prop: "prptyLogicNm",
    label: "프라퍼티 논리명",
    width: 100,
    align: "left"
  },
	{
    prop: "domnModelNm",
    label: "도메인 모델",
    width: 100,
    align: "left"
  },
	{
    prop: "rangeModelNm",
    label: "범위모델",
    width: 100,
    align: "left"
  },
  {
    prop: "modelPrptyDelrNm",
    label: "삭제자",
    width: 100,
    align: "left"
  },
  {
    prop: "modelPrptyDelDt",
    label: "삭제일시",
    width: 100,
    align: "center"
  },
  {
    prop: "modelPrptyDelWhy",
    label: "삭제사유",
    width: 100,
    align: "left"
  }
]);


</script>
<style lang="scss"></style>