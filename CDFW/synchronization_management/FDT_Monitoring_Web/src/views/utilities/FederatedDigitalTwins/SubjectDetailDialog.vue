<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject, computed, onMounted } from 'vue'
const $axios = inject('$axios');
import { useDTStore } from '@/stores/dtStore';

const props = defineProps({
  subjectDialog: Boolean,
  subjectContent: Object,
})
const emit = defineEmits(['update:subjectDialog'])
// 로컬 상태
const dialogVisible = ref(props.subjectDialog)
const selectedDigitalObject = ref(props.subjectContent)
const selectedDigitalTwin = ref("")
const itemDetail = ref({})
const radios = ref("simpleTable")

// 로컬 상태가 변경될 때 부모 컴포넌트에 알림
watch(dialogVisible, (newValue: boolean) => {
  emit('update:subjectDialog', newValue)
})
// 부모 컴포넌트로부터 prop이 변경될 때 로컬 상태 업데이트
watch(() => props.subjectDialog, (newDetail: boolean) => {
  dialogVisible.value = newDetail
  getDODetail();

  
})
watch(() => props.subjectContent, ( newSubjectContent: Object) => {
  // itemDetail.value = convertToKeyValuePairs(newSubjectContent)
  selectedDigitalObject.value = newSubjectContent
  getDODetail();

})
// Dialog를 닫기 위한 함수
const closeDialog = () => {
  dialogVisible.value = false
  radios.value="simpleTable"
}

const getDisplayKey = (key: any) => {
  const displayKeys = {
    digital_object_id: 'ID',
    digital_object_name: 'Name',
    digital_twin_id: "Digital Twin ID",
    description: 'Description',
    access_url: 'Access URL',
    access_protocol: 'Access Protocol',
    creation_time: 'Creation Time',
    creator_id: "Creator ID",
    tags: 'Keywords',
    modification_time: "Modification Time",
    install_location: 'Install Location',
    member_sensor_count: 'Member Sensor Count',
    member_controller_count: 'Member Controller Count',
    member_sensor_ids: 'Member Sensor IDs',
    member_controller_ids: 'Member Controller IDs',
    member_data_model_id: 'Member Data Model ID',
    member_visual_model_id: 'Member Visual Model ID',
    member_behavior_model_id: 'Member Behavior Model ID',
    time_sync_cond: 'Time Sync Cond',
    spatial_sync_cond: 'Spatial Sync Cond',
    preliminary_field: 'Preliminary Field',
  }
  return displayKeys[key] || key
}

// 보기 모드에 따라 표시할 항목 필터링
const filteredItems = computed(() => {
  if (radios.value === 'simpleTable') {
    return {
      "digital_object_id": itemDetail.value.digital_object_id,
      "digital_object_name": itemDetail.value.digital_object_name,
      "description": itemDetail.value.description,
      "creation_time": itemDetail.value.creation_time,
      "digital_twin_id": itemDetail.value.digital_twin_id,
      "tags": itemDetail.value.tags,
      "access_url": itemDetail.value.access_url,
    }
  } else {
    return itemDetail.value
  }
})

const getDODetail = async () => {
  const store = useDTStore();
  if(store.selectedDT != null && store.selectedDT.digital_twin_id){
    selectedDigitalTwin.value = store.selectedDT.digital_twin_id
  }
  try {
    const result = await $axios.get(`/${selectedDigitalTwin.value}/digital-objects/${selectedDigitalObject.value}`);
    itemDetail.value = {...result.data};
    console.log(itemDetail.value)
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};
</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="800px">
   <v-card>
      <v-card-title class="pt-5">
        <span class="headline"> Digital Object Detail</span>
      </v-card-title>
      <v-card-text>
        <v-table class="custom-table px-4" density="compact">
          <template v-slot:default>
            <tbody>
              <tr v-for="(value, key) in filteredItems" :key="key" >
                <td class="grey-background">{{ getDisplayKey(key) }}</td>
                <template v-if="Array.isArray(value)">
                  <td><v-chip v-for="(v, index) in value" :key="index" class="mr-2" color="darkText" variant="tonal">{{ v }}</v-chip></td>
                </template>
                <template v-else-if="typeof value === 'object'">
                  <td>{{ JSON.stringify(value) }}</td>
                </template>
                <template v-else>
                  <td>{{ value }}</td>
                </template>
              </tr>
            </tbody>
          </template>
        </v-table>

        <v-radio-group inline v-model="radios" class="viewMode pl-3">
          <v-radio value="simpleTable" class="small-radio" color="inputBorder"><template v-slot:label><div class="text-body-1"> Simple </div></template></v-radio>
          <v-radio value="detailTable" class="small-radio" color="inputBorder"><template v-slot:label><div class="text-body-1"> Detail </div></template></v-radio>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="darken-1" size="large" text="Close" @click="closeDialog"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<style lang="scss" scoped>
.grey-background {
  background-color: #FAFAFA; /* 회색 배경색 */
  width : 250px;
  border-right: 1px solid #606266; /* 구분선 */
}
.custom-table {
  width: 100%;
  border-collapse: collapse;
  tbody {
    tr {
      td {
        border: 1px solid #a5a7ab;
      }
    }
  }
}

.small-radio {
  font-size: 0.7rem;
}
</style>