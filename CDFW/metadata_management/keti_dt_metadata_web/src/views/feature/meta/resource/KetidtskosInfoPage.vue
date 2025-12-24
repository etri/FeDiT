<template>
	<div class="ttlStr">
		{{ state.ttlStr }}
	</div>
</template>
<script setup>

import { reactive, onMounted} from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const state = reactive({
	ttlStr: ""
});

onMounted(() => {
	getKetidtskosTtlInfo();
});

const getKetidtskosTtlInfo = () => {

	$axios
		.get(util.format($apiUrls.publicpage.meta.resource.rdf.getRdfSkosTtlInfo))
		.then((res) => {
			state.ttlStr = res.data;
		})
		.catch((err) => {
			console.log(err);
		});
};

</script>

<style lang="scss">
.ttlStr{
	margin-left: 5px;
	overflow-y: auto;
	height: calc(100vh);
    white-space: pre-wrap;
}
</style>