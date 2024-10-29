<template>
	<div>
		<!-- 목록이 1개인 값인 경우 검색 및 목록 창 렌더링 -->
		<div v-if="generalProperty.propertyList && ( propertyListCnt == 1 || propertyListCnt == 0 )">
				<CurrentGeneralPropertyInfoSingle
				 	:medataSetId="medataSetId"
					:generalProperty="generalProperty"
					:propertyList="generalProperty.propertyList"
				/>
		</div> 
		<!-- 목록 내 요소가 1개 이상일 경우 검색 및 목록 창 렌더링 -->
		<div v-if="generalProperty.propertyList && propertyListCnt > 1">
			<CurrentGeneralPropertyInfoList
				:medataSetId="medataSetId"
				:generalProperty="generalProperty"
				:backPageName="backPageName" />			
		</div>
	</div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";

import CurrentGeneralPropertyInfoList from "@/components/meta/retrievaldata/CurrentGeneralPropertyInfoList.vue";
import CurrentGeneralPropertyInfoSingle from "@/components/meta/retrievaldata/CurrentGeneralPropertyInfoSingle.vue";
import MetadataDialogSearch from "@/components/meta/retrievaldt/MetadataDialogSearch.vue";
import MetadataDialogSinglePropertyInfo from "@/components/meta/retrievaldt/MetadataDialogSinglePropertyInfo.vue";

import { defineProps, reactive, ref, onMounted, getCurrentInstance, watch } from "vue";
import { useRoute } from "vue-router";
import { getGlobalProperties, isReadYn } from "@/assets/js/common.js";
import { useStore } from "vuex";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const $emitter =
	getCurrentInstance().appContext.config.globalProperties.$emitter;
const store = useStore();
const route = useRoute();

const props = defineProps({
	generalProperty: {
		type: Object,
		required: true
	},
	medataSetId: {
		type: String,
		required: false,
	},
	propertyListCnt: {
		type: Number,
		required: true,
	},

	backPageName: {
		type: String,
		required: false,
	}
});

</script>
<style lang="scss"></style>