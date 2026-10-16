<template>
  <div class="ly-table">
    <el-form label-width="160px" :model="menu">
      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="메뉴명">{{ menu.menuNm }}</el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="메뉴설명">{{ menu.menuDesc }}</el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="메뉴ID">{{ menu.menuId }}</el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="상위 메뉴">{{ menu.upMenuName }}</el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="메뉴 순서">{{ menu.odrg }}</el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="URL">{{ menu.menuUrl }}</el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="target">{{ menu.tgtCdNm }}</el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="파라미터">{{ menu.urlParam }}</el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="관리자 메뉴 여부">{{
            menu.admrYn == "Y" ? "관리자" : "사용자"
          }}</el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="메뉴 표시 여부">{{
            menu.useYn == "Y" ? "표시" : "미표시"
          }}</el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24" :xs="24">
          <el-form-item label="메뉴 아이콘">
            <el-icon v-if="menu.menuIcon !== ''" size="14"><component :is="menu.menuIcon" /></el-icon>
            <span v-if="menu.menuIcon !== ''" style="font-size: 14px;">&nbsp;{{ menu.menuIcon }}</span>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>
<script setup>
import { defineProps } from "vue";
const props = defineProps({
  menu: {
    type: Object,
    required: true,
  },
});
</script>
<style lang="scss">
.title {
  font-weight: bold;
  //   text-align: right;
}
.content {
  color: gray;
}
</style>
