<template>
	<el-dialog
		v-model="visibleProxy"
		:title="`상세 조회 - ${id || ''}`"
		width="80%"
		top="5vh"
	>
		<div v-if="id" class="metadata-detail-dialog-body">
			<iframe :src="detailUrl" class="metadata-detail-frame" title="상세 보기"></iframe>
		</div>
	</el-dialog>
</template>

<script setup>
import { computed, watch } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
	modelValue: { type: Boolean, default: false },
	id: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const router = useRouter();
const DETAIL_ROUTE_BASE = "/meta/external/search/intgrdata/page/";

const visibleProxy = computed({
	get: () => props.modelValue,
	set: (v) => emit("update:modelValue", v),
});

const detailUrl = computed(() => {
	if (!props.id) return "";
	return router.resolve({
		path: `${DETAIL_ROUTE_BASE}${props.id}`,
		query: { embed: "1" },
	}).href;
});

watch(
	() => props.modelValue,
	(open) => {
		if (open) sessionStorage.setItem("dtmeta.dialog-embed", "1");
		else sessionStorage.removeItem("dtmeta.dialog-embed");
	}
);
</script>

<style scoped>
.metadata-detail-dialog-body {
	height: calc(85vh - 80px);
}
.metadata-detail-frame {
	width: 100%;
	height: 100%;
	border: 0;
}
</style>
