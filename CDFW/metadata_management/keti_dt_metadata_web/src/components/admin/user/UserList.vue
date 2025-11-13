<template>
  <div>
    <ComnList
      :tableHeader="tableHeader"
      :tableData="userList"
      @row-click="rowClick"
    ></ComnList>

    <ComnPagination :totalPage="totalPage" :curPage="curPage" @pagemove="pagemove" />
  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";
import ComnPagination from "@/components/common/ComnPagination.vue";

import { ref, defineProps, defineEmits } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();

const props = defineProps({
  userList: {
    type: Array,
    required: true,
  },
  totalPage: {
    type: Number,
    required: true,
  },
  curPage: {
    type: Number,
    required: true,
  },
});

const emits = defineEmits(["pageMove", "rowClick"]);

const tableHeader = ref([
{
    prop: "userid",
    label: "사용자ID",
    width: 250,
  },
  {
    prop: "nickname",
    label: "이름",
    width: 250,
  },
  {
    prop: "email",
    label: "이메일",
    width: 250,
  },
  {
    prop: "phone",
    label: "휴대전화",
    width: 250,
  },
]);

const pagemove = (payload) => {
  emits("pageMove", payload);
};

const rowClick = (data) => {
  emits("rowClick", data);
};
</script>

<style lang="scss"></style>
