<template>
  <div>
    <el-form
      :inline="true"
      :model="pageInfo"
      class="demo-form-inline"
      label-width="120px"
      onsubmit="return false"
    >
      <el-form-item label="검색어">
        <el-input
          class="w-50 m-2"
          v-model="pageInfo.searchWord"
          placeholder="검색어를 입력하세요."
          @keyup.enter="getBoardList(1)"
        />
      </el-form-item>
    </el-form>
    <div class="btnSec taR">
      <el-button type="primary" @click="getBoardList(1)">검색</el-button>
    </div>
  </div>
</template>
<script setup>
import { ref ,defineEmits} from "vue";
const emits = defineEmits(["searchBoard"]);

const pageInfo = ref({
  searchType: "",
  searchWord: "",
  searchFirstTF: "",
  fromDate: "",
  toDate: "",
});

const getBoardList = (data) => {
  emits("searchBoard", {
    curPage: data,
    pageInfo,
  });
};
</script>
<style lang="scss"></style>
