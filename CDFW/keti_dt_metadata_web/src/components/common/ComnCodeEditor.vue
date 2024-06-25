<template>
  <Codemirror ref="cmRef" v-model:value="codeText" :options="option" :height="height" @change="onChange" />
</template>

<script>
import { ref, watch, onMounted, onUnmounted, } from "vue"

import Codemirror from "codemirror-editor-vue3"

import "codemirror/mode/clike/clike.js"
import "codemirror/mode/javascript/javascript.js"
import "codemirror/mode/vue/vue.js"
import "codemirror/mode/xml/xml.js"
import "codemirror/mode/sql/sql.js"

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

    const codeText = ref('')
    watch(
      () => props.code,
      (cur, prev) => {
        codeText.value = cur;
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
      (crr, prev) => {
        option.value = Object.assign(option.value, crr);
      },
      { deep: true }
    )

    const setOptionsByMode = (val) => {
      option.value.mode = val;
    }

    const setCode = (val) => {
      codeText.value = val;
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

    onUnmounted(() => {
      cmRef.value?.destroy();
    });

    return {
      cmRef,
      codeText,
      option,
      // cmOptions: option,
      setCode,
      setOptionsByMode,
      onChange,
    };
  },
};
</script>

<style lang="scss" scoped></style>