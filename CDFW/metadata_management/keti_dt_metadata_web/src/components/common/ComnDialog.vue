<template>
  <el-dialog v-bind="$attrs"
    :title="title"
    :draggable="attr_draggable"
    :show-close="attr_showClose"
    :close-on-click-modal="attr_closeOnClickModal"
    :close-on-press-escape="attr_closeOnPressEscape"
    :destroy-on-close="attr_destoryOnClose"
    append-to-body
    @close="closeDialog"
  >
    <template #header>
      <slot name="header"></slot>
    </template>

    <slot name="content"></slot>

    <slot name="footer"></slot>

  </el-dialog>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: "",
    },
    attr_draggable: {
      type: Boolean,
      default: false,
    },
    attr_showClose: {
      type: Boolean,
      default: false,
    },
    attr_closeOnClickModal: {
      type: Boolean,
      default: true,
    },
    attr_closeOnPressEscape: {
      type: Boolean,
      default: true,
    },
    attr_destoryOnClose: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["closeDialog"],
  setup(props, { emit }) {
    const closeDialog = () => {
      emit("closeDialog");
    }

    return {
      closeDialog
    };
  },
};
</script>
<style lang="scss">
</style>