<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  detailDialog: Boolean,
  clickedItems: Object,
})
const emit = defineEmits(['update:detailDialog'])
// 로컬 상태
const dialogVisible = ref(props.detailDialog)
const itemDetail = ref({...props.clickedItems})

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
}

const getDisplayKey = (key: any) => {
  const displayKeys = {
    digital_twin_id: "Digital Twin ID",
    digital_object_id: "Digital Object ID",
    rowtime: "Time",
    data: "Data",
    location: "Location"
  }
  return displayKeys[key] || key
}

</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="800px">
   <v-card>
      <v-card-title class="pt-5">
        <span class="headline">Digital Object Data Detail</span>
      </v-card-title>
      <v-card-text>
        <v-table class="custom-table px-4" density="compact">
          <template v-slot:default>
            <tbody>
              <tr v-for="(value, key) in itemDetail" :key="key" >
                <td class="grey-background">{{ getDisplayKey(key) }}</td>
                <template v-if="typeof value === 'object'">
                  <td><vue-json-pretty :data="value" /></td>
                </template>
                <template v-else>
                  <td>{{ value }}</td>
                </template>
              </tr>
            </tbody>
          </template>
        </v-table>
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