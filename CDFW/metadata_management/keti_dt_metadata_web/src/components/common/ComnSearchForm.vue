<template>
  <!--el-form 내에 :inline 사용으로 한 row에 적용 가능 -->
  <el-form :inline="true" :model="pageInfo" class="demo-form-inline">
    <!-- select option + input 내용 포함 -->
    <el-form-item label="검색어">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-select v-model="pageInfo.searchType" placeholder="전체">
            <el-option label="전체" value="0" />
            <el-option label="제목" value="1" />
            <el-option label="내용" value="2" />
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-input
            v-model="pageInfo.searchWord"
            placeholder="검색어를 입력하세요."
            @keyup.enter="" /></el-col
      ></el-row>
    </el-form-item>

    <!-- select 내용 -->
    <el-form-item label="사용여부">
      <el-row :gutter="20">
        <el-col :span="20">
          <el-select v-model="pageInfo.actTF" placeholder="전체">
            <el-option label="전체" value="-1" />
            <el-option label="제목" value="1" />
            <el-option label="내용" value="0" />
          </el-select>
        </el-col>
      </el-row>
    </el-form-item>

    <!-- date picker 적용 -->
    <el-form-item label="사용여부">
      <el-row :gutter="20">
        <el-col :span="20">
          <div class="demo-date-picker">
            <div class="block">
              <el-date-picker
                v-model="date"
                type="daterange"
                range-separator="To"
                start-placeholder="Start date"
                end-placeholder="End date"
                format="YYYY/MM/DD"
                value-format="YYYY-MM-DD"
                @change="inputDate"
              />
            </div>
          </div>
        </el-col>
      </el-row>
    </el-form-item>
  </el-form>

  <el-form-item>
    <!-- <el-button type="primary" @click="onSubmit">Query</el-button> -->
  </el-form-item>
</template>
<script>
import { reactive, ref } from "vue";

export default {
  name: "ComnSearchForm",
  setup() {
    const date = ref("");
    const pageInfo = reactive({
      searchType: "",
      searchWord: "",
      fromDate: "",
      toDate: "",
    });
    const inputDate = () => {
      pageInfo.fromDate = date.value[0];
      pageInfo.toDate = date.value[1];
    };

    return { date, pageInfo, inputDate };
  },
};
</script>
<style lang="scss"></style>
