<template>
  <div class="ly-table">
    <el-form label-width="160px" :model="pat">

      <el-row>
        <el-col :span="20">
          <el-form-item label="Token 명">{{ pat.toknNm }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="20">
          <el-form-item label="만료일">{{ pat.toknExpDate ? pat.toknExpDate : '기한 없음' }}</el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="20">
          <el-form-item label="Token">
            <!-- <el-input v-model="pat.toknVal" type="textarea" :autosize="{ minRows: 7 }" readonly/> -->
            <div class="textType">{{ pat.toknVal }}</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="10">
          <el-form-item label="등록자">{{ pat.patkRegrId }}</el-form-item>
        </el-col>
        <el-col :span="10">
          <el-form-item label="등록일시">{{ pat.patkRegDt }}</el-form-item>
        </el-col>
      </el-row>

    </el-form>
  </div>
</template>
<script setup>
import { defineProps } from "vue";
const props = defineProps({
  pat: {
    type: Object,
    required: true,
  }
});

</script>
<style lang="scss"></style>
