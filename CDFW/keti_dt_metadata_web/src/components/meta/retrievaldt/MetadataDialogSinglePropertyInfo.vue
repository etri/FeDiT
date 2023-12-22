<template>
	<div>

		<!-- 단건 property 조회 (data_type) -->
		<div v-if="'data_type' === props.rangeModelTypeMtcd && 'geoJson' !== props.rangeDataTypeMtcd">
			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 값 정보</h3><!-- (data_type) -->
				</div>
				<div class="boxCnt">
					<el-form label-width="160px" label-position="right">
					<el-row>
						<el-col :span="24">
							<el-form-item label="언어">

								<el-input type="textarea" v-model="state.metadata.langMtcd" disabled></el-input>

							</el-form-item>
						</el-col>
					</el-row>
					<el-row>
						<el-col :span="24">
							<el-form-item label="메타데이터 값">

								<el-input type="textarea" v-model="state.metadata.medataVal" disabled></el-input>

							</el-form-item>
						</el-col>
					</el-row>
					</el-form>			
				</div>
			</div>
		</div>

		<!-- 단건 property 조회 (object_type) -->
		<div v-if="'object_type' === props.rangeModelTypeMtcd">
			<div class="boxLayout">
				<div class="boxTit">
					<h3>메타데이터 값 정보</h3><!-- (object_type) -->
				</div>
				<div class="boxCnt">
					<el-form label-width="160px" label-position="right">
					<el-row>
						<el-col :span="24">
							<el-form-item label="메타데이터 값">

								<el-input type="textarea" v-model="state.metadata.medataVal" disabled></el-input>

							</el-form-item>
						</el-col>
					</el-row>
					<el-row>
						<el-col :span="24">
							<el-form-item label="값의 메타데이터 셋 명">

								<el-input type="textarea" v-model="state.metadata.medataValNm" disabled></el-input>

							</el-form-item>
						</el-col>
					</el-row>
					<el-row>
						<el-col :span="24">
							<el-form-item label="상태">

								<el-input type="textarea" v-model="state.metadata.medataValSttusMtcdNm" disabled></el-input>

							</el-form-item>
						</el-col>
					</el-row>
					<el-row>
						<el-col :span="24">
							<el-form-item label="수정일">

								<el-input type="textarea" v-model="state.metadata.medataValAmdDt" disabled></el-input>

							</el-form-item>
						</el-col>
					</el-row>									
					</el-form>			
				</div>
			</div>
		</div>

	</div>
</template>
<script setup>
import { reactive, onMounted, defineProps, ref } from "vue";
import { useStore } from "vuex";
import { getGlobalProperties } from "@/assets/js/common.js";
import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const store = useStore();

const props = defineProps({
	medataSetId: {
		type: String,
		required: true,
	},
	prptyNm: {
		type: String,
		required: true,
	},
	rangeModelTypeMtcd: { // (data_type or object_type)
		type: String,
		required: true,
	},
	rangeDataTypeMtcd: {
		type: String,
		required: false, //rangeModelTypeMtcd == object_type 의 경우, null 임.
	}
});

const state = reactive({
	metadata: {}
});

onMounted(() => {
	getMetadataSingleProperty();
});

const getMetadataSingleProperty = () => {

let medataSetId = props.medataSetId;
let propertyNm = props.prptyNm;

$axios
	.get(util.format($apiUrls.meta.resource.metadatasets.getMetadataListBySetPropertyNm, medataSetId, propertyNm), {
		params: {
			medataSetId: medataSetId,
			prptyNm: propertyNm,
		},
	})
	.then((res) => {
		state.metadata = res.data.list[0];
	})
	.catch((err) => {
		console.log(err);
	});
};

</script>
<style lang="scss" scoped></style>