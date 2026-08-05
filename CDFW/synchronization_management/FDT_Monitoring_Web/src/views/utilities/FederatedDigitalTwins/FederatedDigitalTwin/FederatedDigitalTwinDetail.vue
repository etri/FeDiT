<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, computed } from 'vue'
import FederatedDigitalTwinModify from './FederatedDigitalTwinModify.vue';
import FederatedDigitalTwinDelete from './FederatedDigitalTwinDelete.vue';

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
  console.log(itemDetail.value)
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
    federated_digital_twin_id: 'ID',
    federated_digital_twin_name: 'Name',
    description: 'Description',
    owner: 'Owner',
    keywords: 'Keywords',
    point_of_access: "Point Of Access",
    creation_time: 'Creation Time',
    creator_id: "Creator ID",
    modification_time: "Modification Time",
    location: "Location",
    number_of_federated_digital_objects: "Number of FDO",
    number_of_digital_twins: "Number of DT",
    number_of_subscriptions: "Number of Subscription",
    number_of_services: "Number of Service",
    number_of_simulations: "Number of Simulation",
    number_of_visual_models: "Number of Visual Models",
  }
  return displayKeys[key] || key
}

// 보기 모드에 따라 표시할 항목 필터링
const filteredItems = computed(() => {
  if (radios.value === 'simpleTable') {
    return {
      "federated_digital_twin_id": itemDetail.value.federated_digital_twin_id,
      "federated_digital_twin_name": itemDetail.value.federated_digital_twin_name,
      "description": itemDetail.value.description,
      "creation_time": itemDetail.value.creation_time,
      "owner": itemDetail.value.owner,
      "keywords": itemDetail.value.keywords,
      "point_of_access":itemDetail.value.point_of_access,
      "location": itemDetail.value.location
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
        <span class="headline">Federated Digital Twin Detail</span>
      </v-card-title>
      <v-card-text>
        <v-table class="custom-table px-4" density="compact">
          <template v-slot:default>
            <tbody>
              <tr v-for="(value, key) in filteredItems" :key="key" >
                <td class="grey-background">{{ getDisplayKey(key)}}</td>
                <template v-if="Array.isArray(value) && value.length > 0">
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
        <v-btn color="red" size="large" text="Delete" @click="deleteClick"></v-btn>
        <v-btn color="blue" size="large" text="Modify" @click="modifyClick"></v-btn>
        <v-spacer></v-spacer>
        <v-btn color="darken-1" size="large" text="Close" @click="closeDialog"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <FederatedDigitalTwinModify :modifyDialog="modifyDialog" :itemDetail="itemDetail" @update:modifyDialog="val => modifyDialog = val" @modifyConfirmed="handleModifyConfirmed"/>
  <FederatedDigitalTwinDelete :deleteDialog="deleteDialog" :itemDetail="itemDetail" @update:deleteDialog="val => deleteDialog = val"  @deleteConfirmed="handleDeleteConfirmed"/>


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