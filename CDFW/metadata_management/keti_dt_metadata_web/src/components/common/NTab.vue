<template>
  <el-tabs
    style="width: 100%"
    :v-model="activeName"
    @tab-click="tabClick"
  >
    <template v-for="(item) in tabData">
      <el-tab-pane :label="item.label" :name="item.label">{{ item.label }}</el-tab-pane>
    </template>
  </el-tabs>
</template>

<script>
import { ref, reactive } from '@vue/reactivity';
import { computed, onMounted } from 'vue';

export default {
  props: {
    activeName: {
      type: String,
      default: "",
    },
    tabData: {
      type: Array,
      required: true,
    }
  },
  setup(props, { emit }) {
    const activeName = ref("");

    const tabClick = (tab, event) => {
      emit("tabClick", tab, event, activeName);
    }

    onMounted(() => {
      // TODO onMounted
      activeName.value = props.activeName;
    });

    return { activeName, tabClick };
  }
}
</script>