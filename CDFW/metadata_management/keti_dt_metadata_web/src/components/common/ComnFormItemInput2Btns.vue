<template>
  <el-form-item :label="label">
    <div class="inline-area">
      <el-input style="width:200px;" v-model="value" disabled :placeholder="placeholder" />
      <el-button type="default" @click="clickSearchBtn" class="ml15 btn-label-color"><el-icon v-if="searchIconClass" :class="`icon ${searchIconClass}`" />{{ searchBtnLabel }}</el-button>
      <el-button type="default" class="el-button--delete btn-label-color" @click="clickRefreshBtn"><el-icon v-if="refreshIconClass" :class="`icon ${refreshIconClass}`" />{{ refreshBtnLabel }}</el-button>
    </div>
    <!--
    <el-row>
      <el-col :span="12">
        <el-input v-model="value" disabled :placeholder="placeholder" /> 
      </el-col>
      <el-col :span="12">
        <div class="btnSec taL">
          <el-button @click="clickSearchBtn" class="ml15"><el-icon v-if="searchIconClass" :class="`icon ${searchIconClass}`" />{{ searchBtnLabel }}</el-button>
          <el-button @click="clickRefreshBtn"><el-icon v-if="refreshIconClass" :class="`icon ${refreshIconClass}`" />{{ refreshBtnLabel }}</el-button>
        </div>									
      </el-col>
    </el-row>
    -->
  </el-form-item>
</template>
<script setup>
import { defineEmits, defineProps, computed } from "vue";

const emits = defineEmits(['update:modelValue', 'click-search', 'click-refresh']);

const props = defineProps({
	label: { 
		type: String,
		required: false,
    default : '라벨'
	},
	modelValue: { 
		type: String,
		required: false,
    default : ''
	},
  placeholder: {
		type: String,
		required: false,
    default : ''
  },
  searchIconClass: {
		type: String,
		required: false,
    default : 'icon-search'
  },
  refreshIconClass: {
		type: String,
		required: false,
    default : 'icon-refresh'
  },
  searchBtnLabel: {
		type: String,
		required: false,
    default : ''
  },
  refreshBtnLabel: {
		type: String,
		required: false,
    default : ''
  },  
});

const value = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  }
});

const clickSearchBtn = () => {
	emits("click-search", {});
};

const clickRefreshBtn = () => {
	emits("click-refresh", {});
};

</script>