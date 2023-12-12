<template>
  <Codemirror ref="cmRef" v-model:value="code" :options="cmOptions" :height="height" @change="onChange" />
</template>

<script>
import { ref, watch, onMounted, } from "vue"

import Codemirror from "codemirror-editor-vue3"

import "codemirror/mode/clike/clike.js"
import "codemirror/mode/javascript/javascript.js"
import "codemirror/mode/vue/vue.js"
import "codemirror/mode/xml/xml.js"

// placeholder
import "codemirror/addon/display/placeholder.js";

// theme
import "codemirror/theme/dracula.css";

export default {
  components: { Codemirror },
  props: {
    code: {
      type: String,
      required: false,
      default: '',
    },
    height: {
      type: Number,
      default: 400,
    },
    cmOptions: {
      type: Object,
      required: false,
    },
    editable: {
      type: Boolean,
      default: true
    }
  },
  setup(props, { emit }) {
    const cmRef = ref()

    const code = ref('')
    watch(
      () => props.code,
      (cur, prev) => {
        code.value = cur;
      },
      { deep: true }
    )

    const option = ref({
      tabSize: 4,
      styleActiveLine: true,
      lineNumbers: true,
      line: true,
      // Language mode
      // mode: "text/javascript",
      // mode: "text/xml",
      // mode: "text/x-vue",
      mode: "text/x-java",
      theme: "dracula", // Theme
      readOnly: false,
    });

    watch(
      () => props.cmOptions,
      (cur, prev) => {
        option.value = Object.assign(option.value, cur);
      },
      { deep: true }
    )

    const setCode = (val) => {
      console.log('call setcode')
      code.value = val;
    }

    const onChange = (val, cm) => {
      emit('onChangeCode', cm.getValue());
    }

    onMounted(() => {
      setTimeout(() => {
        cmRef.value?.refresh()
      }, 1000)

      setTimeout(() => {
        cmRef.value?.cminstance.isClean()
      }, 3000)
    });

    return {
      cmRef,
      code,
      cmOptions: option,
      setCode,
      onChange,
    };
  },
};
</script>

<style lang="scss" scoped></style>