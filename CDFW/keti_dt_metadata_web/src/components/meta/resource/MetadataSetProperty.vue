<template>
  <div>

    <!-- normal type -->
    <div v-if="'data_type' === generalProperty.rangeModelTypeMtcd && 'geoJson' !== generalProperty.rangeDataTypeMtcd && 'json' !== generalProperty.rangeDataTypeMtcd">
      <div v-if="'N' === generalProperty.dataArrayYn">
        {{ dataMap.medataVal }}
      </div>
      <div v-if="'Y' === generalProperty.dataArrayYn && dataMap.propertyListCnt > 0">
        <div class="link-guide-text">총 {{ dataMap.propertyListCnt ? dataMap.propertyListCnt : 0 }} 건</div>
        <div v-for="item of dataMap.propertyList" :key="item" class="">
          {{ item.medataVal }}
        </div>
      </div>
    </div>

    <!-- geoJson type -->
    <div v-if="'data_type' === generalProperty.rangeModelTypeMtcd && 'geoJson' == generalProperty.rangeDataTypeMtcd">
      <div v-if="'N' === generalProperty.dataArrayYn">
        <div v-for="item of dataMap.propertyList" :key="item" class="mt10 mb10">
          <el-input type="textarea" v-model="item.geodataVal" disabled></el-input>
        </div>
      </div>
      <div v-if="'Y' === generalProperty.dataArrayYn && dataMap.propertyListCnt > 0">
        <div class="link-guide-text">총 {{ dataMap.propertyListCnt ? dataMap.propertyListCnt : 0 }} 건</div>
        <div v-for="item of dataMap.propertyList" :key="item" class="mt10 mb10">
          <el-input type="textarea" v-model="item.geodataVal" disabled></el-input>
        </div>
      </div>
    </div>

    <!-- etc json type -->
    <div v-if="'data_type' === generalProperty.rangeModelTypeMtcd && 'json' == generalProperty.rangeDataTypeMtcd">
      <div v-if="'N' === generalProperty.dataArrayYn">
        <div v-for="item of dataMap.propertyList" :key="item" class="mt10 mb10">
          <el-input type="textarea" v-model="item.medataVal" disabled></el-input>
        </div>
      </div>
      <div v-if="'Y' === generalProperty.dataArrayYn && dataMap.propertyListCnt > 0">
        <div class="link-guide-text">총 {{ dataMap.propertyListCnt ? dataMap.propertyListCnt : 0 }} 건</div>
        <div v-for="item of dataMap.propertyList" :key="item" class="mt10 mb10">
          <el-input type="textarea" v-model="item.medataVal" disabled></el-input>
        </div>
      </div>
    </div>
    
    <!-- object type -->
    <div v-if="'object_type' === generalProperty.rangeModelTypeMtcd">
      <div v-if="'N' === generalProperty.dataArrayYn">
        <span class="link-guide-text">{{ dataMap.medataValNm }} &nbsp;</span>
        <span @click="emitGoToResourcePage( dataMap.medataVal )" class="link-text">
          {{ dataMap.medataVal }} <!-- {{  dataMap.url }} -->
        </span>
      </div>
      <div v-if="'Y' === generalProperty.dataArrayYn && dataMap.propertyListCnt > 0">
        <div class="link-guide-text">총 {{ dataMap.propertyListCnt ? dataMap.propertyListCnt : 0 }} 건</div>
        <div v-for="item of dataMap.propertyList" :key="item" class="">
          <span class="link-guide-text">{{ item.medataValNm }} &nbsp;</span>
          <span @click="emitGoToResourcePage( item.medataVal )" class="link-text">
            {{ item.medataVal }} <!-- {{  item.url }} -->
          </span><br/>
        </div>
      </div>
    </div>

  </div>
</template>
<script setup>
import ComnList from "@/components/common/ComnList";

import { defineProps, defineEmits, watch } from "vue";

const emits = defineEmits(["goToResourcePage"]);

const props = defineProps({
	generalProperty: {
		type: Object,
		required: true
	},
	medataSet: {
		type: Object,
		required: true,
	},
	dataMap: {
		type: Object,
		required: false,
	}  
});

watch(
	() => props.dataMap,
	(cur, prev) => {
    // console.log(`watch dataMap : ${props.generalProperty.prptyNm}`);
	},
	{ deep: true }
)

const emitGoToResourcePage = (medataSetId) => {
  emits("goToResourcePage", medataSetId);
}

</script>
<style lang="scss" scoped></style>