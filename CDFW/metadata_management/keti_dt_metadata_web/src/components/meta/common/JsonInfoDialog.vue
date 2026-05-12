<template>
	<el-dialog
		v-model="visibleProxy"
		:title="title"
		:width="width"
		top="5vh"
	>
		<div class="dialog-area">
			<JsonEditorVue
				:model-value="data"
				class="dialog_jsonEditor_setting"
				v-bind="{
					readOnly: true,
					mode: 'text',
					theme: 'light',
					mainMenuBar: false,
					navigationBar: false,
					parser: undefined,
				}"
			/>
		</div>
	</el-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
	modelValue: { type: Boolean, default: false },
	data: { default: null },
	title: { type: String, default: "프라퍼티 정보" },
	// iframe 안에서 띄우면 viewport 기준이 작아져 dialog 가 좁아짐 → 기본을 넓게
	width: { type: String, default: "85%" },
});
const emit = defineEmits(["update:modelValue"]);

const visibleProxy = computed({
	get: () => props.modelValue,
	set: (v) => emit("update:modelValue", v),
});
</script>
