<template>
	<el-tree ref="modelTreeRef"
		:data="metadataModelItemList"
		:props="defaultProps"
		node-key="modelId"
		:highlight-current="true"
		@node-click="handleNodeClick"
		default-expand-all
		:render-content="renderContent"
		:expand-on-click-node="false"
		empty-text="데이터 없음"
	></el-tree>
</template>
<script setup>
import { ref, defineProps, defineEmits, nextTick } from "vue";

const modelTreeRef = ref(null);

const emits = defineEmits(["chooseMetadataModel"]);

const props = defineProps({
	metadataModelItemList: {
		type: Array,
		required: false,
	},
	renderContent: {
		type: Function,
		reqilred: false,
	},
});

const defaultProps = ref({
  children: "children",
  label: "modelNm", 
});

const handleNodeClick = (data) => {
	emits("chooseMetadataModel", data);
};

const setCurrentKey = (modelId) => {
	nextTick(() => {
		//console.log(`tree - setCurrentKey : ${modelId}`);
		modelTreeRef.value.setCurrentKey(modelId);
	});
}

defineExpose({
	setCurrentKey,
});
</script>
<style lang="scss"></style>