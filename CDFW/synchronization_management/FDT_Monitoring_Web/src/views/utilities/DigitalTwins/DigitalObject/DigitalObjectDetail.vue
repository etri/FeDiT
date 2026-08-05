<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, computed } from 'vue'
import DigitalObjectModify from './DigitalObjectModify.vue';
import DigitalObjectDelete from './DigitalObjectDelete.vue';

const props = defineProps({
  detailDialog: Boolean,
  clickedItems: Object,
})
const emit = defineEmits(['update:detailDialog', 'deleteSuccess', 'modifySuccess'])
// 로컬 상태
const dialogVisible = ref(props.detailDialog)
const itemDetail = ref({...props.clickedItems})
const radios = ref("simpleTable")
const deleteDialog = ref(false)
const modifyDialog = ref(false)

// 로컬 상태가 변경될 때 부모 컴포넌트에 알림
watch(dialogVisible, (newValue: boolean) => {
  emit('update:detailDialog', newValue)
})
// 부모 컴포넌트로부터 prop이 변경될 때 로컬 상태 업데이트
watch(() => props.detailDialog, (newDetail: boolean) => {
  dialogVisible.value = newDetail
})
watch(() => props.clickedItems, ( newClickedItems: Object) => {
  // itemDetail.value = convertToKeyValuePairs(newClickedItems)
  itemDetail.value = newClickedItems
})

// Dialog를 닫기 위한 함수
const closeDialog = () => {
  dialogVisible.value = false
  radios.value="simpleTable"
}
const deleteClick = () => {
  deleteDialog.value = true
}
const modifyClick = () => {
  modifyDialog.value = true
}
const handleDeleteConfirmed = () => {
  closeDialog()
  emit('deleteSuccess')
}
const handleModifyConfirmed = () => {
  closeDialog()
  emit('modifySuccess')
}

const getDisplayKey = (key: any) => {
  const displayKeys = {
    digital_object_id: 'ID',
    digital_object_name: 'Name',
    digital_twin_id: "Digital Twin ID",
    description: 'Description',
    keywords: 'Keywords',
    subjects: "Subjects",
    creation_time: 'Creation Time',
    modification_time: "Modification Time",
    digital_object_data_access_type: "DO Data Access Type",
    digital_object_data_access_url: "DO Data Access Url",
    digital_object_data_model: "DO Data Model",
    digital_object_data_interval: "DO Data Interval",
    digital_object_control_url: "DO Control URL",
    digital_object_control_request_model: "DO Control Request Model",
    digital_object_data_source_type: "DO Data Source Type",
    digital_object_data_source_url: "DO Data Source URL",
    do_metadata: "DO Metadata",
    preliminary_field: "Preliminary Field",
  }
  return displayKeys[key] || key
}

// 보기 모드에 따라 표시할 항목 필터링
const filteredItems = computed(() => {
  if (radios.value === 'simpleTable') {
    return {
      "digital_object_id": itemDetail.value.digital_object_id,
      "digital_object_name": itemDetail.value.digital_object_name,
      "digital_twin_id": itemDetail.value.digital_twin_id,
      "description": itemDetail.value.description,
      "creation_time": itemDetail.value.creation_time,
      "keywords": itemDetail.value.keywords,
      "subjects": itemDetail.value.subjects,
      "digital_object_data_access_type": itemDetail.value.digital_object_data_access_type,
      "digital_object_data_access_url": itemDetail.value.digital_object_data_access_url,
      "digital_object_control_url": itemDetail.value.digital_object_control_url,
    }
  } else {
    return itemDetail.value
  }
})
</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="800px">
   <v-card>
      <v-card-title class="pt-5">
        <span class="headline">Digital Object Detail</span>
      </v-card-title>
      <v-card-text>
        <v-table class="custom-table px-4" density="compact">
          <template v-slot:default>
            <tbody>
              <tr v-for="(value, key) in filteredItems" :key="key" >
                <td class="grey-background">{{ getDisplayKey(key)  }}</td>
                <template v-if="Array.isArray(value) && value.length > 0">
                  <td>
                    <v-chip 
                    v-for="(v, index) in value" 
                    :key="index" 
                    class="mr-2" 
                    color="darkText" 
                    variant="tonal">
                      {{ v }}
                    </v-chip>
                  </td>
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
        <v-btn color="red" size="large" text="Delete" @click="deleteClick"></v-btn>
        <v-btn color="blue" size="large" text="Modify" @click="modifyClick"></v-btn>
        <v-spacer></v-spacer>
        <v-btn color="darken-1" size="large" text="Close" @click="closeDialog"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <DigitalObjectModify :modifyDialog="modifyDialog" :itemDetail="itemDetail" @update:modifyDialog="val => modifyDialog = val" @modifyConfirmed="handleModifyConfirmed"/>
  <DigitalObjectDelete :deleteDialog="deleteDialog" :itemDetail="itemDetail" @update:deleteDialog="val => deleteDialog = val"  @deleteConfirmed="handleDeleteConfirmed"/>
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