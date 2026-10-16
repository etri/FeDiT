<template>
  <el-tree
    :data="menuItems"
    :props="defaultProps"
    @node-click="handleNodeClick"
    default-expand-all
  ></el-tree>
</template>
<script setup>
import { ref, defineProps, defineEmits } from "vue";

const props = defineProps({
  menuItems: {
    type: Array,
    required: false,
  },
});

const emits = defineEmits(["detailMenu"]);

const defaultProps = ref({
  children: "children",
  label: "menuNm",
});

const handleNodeClick = (data) => {
  emits("detailMenu", data);
};
</script>
<style lang="scss"></style>
