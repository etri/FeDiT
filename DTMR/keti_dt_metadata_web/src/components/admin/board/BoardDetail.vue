<template>
  <el-form label-width="160px" :model="board">
    <el-row>
      <el-col :span="10" :xs="24">
        <el-form-item label="게시판 OID">{{ bbsOid }}</el-form-item>
      </el-col></el-row
    >
    <el-row>
      <el-col :span="10" :xs="24">
        <el-form-item label="게시판명">{{ board.bbsNm }}</el-form-item>
      </el-col></el-row
    >
    <el-row>
      <el-col :span="10" :xs="24">
        <el-form-item label="게시판 코드">{{ board.bbsCd }}</el-form-item>
      </el-col></el-row
    >
    <el-row>
      <el-col :span="6" :xs="24">
        <el-form-item label="첨부파일">{{
          board.atcFileUseYn == "Y" ? "사용" : "미사용"
        }}</el-form-item>
      </el-col></el-row
    >
    <el-row>
      <el-col :span="6" :xs="24">
        <el-form-item label="댓글">{{
          board.replUseYn == "Y" ? "사용" : "미사용"
        }}</el-form-item>
      </el-col></el-row
    >
    <el-row>
      <el-col :span="10" :xs="24">
        <el-form-item label="생성일">{{ board.regDt }}</el-form-item>
      </el-col></el-row
    >
    <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="메뉴연결 정보">
            <ul >
              <span> 메뉴 URL : /iot/bbsposting </span>
            </ul>
            <ul >
              <span> 메뉴 Parameter : brdOid={{ bbsOid }} </span>
            </ul>
          </el-form-item>
        </el-col>
      </el-row>
  </el-form>
</template>
<script setup>
import { defineProps } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const props = defineProps({
  board: {
    type: Object,
    required: true,
  },
});

const bbsOid = route.query.bbsOid;
</script>
<style lang="scss"></style>
