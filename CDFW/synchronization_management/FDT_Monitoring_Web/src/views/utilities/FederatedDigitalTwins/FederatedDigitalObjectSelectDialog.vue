<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject, onMounted} from 'vue'
const $axios = inject('$axios');

const props = defineProps({
  selectFDODialog: Boolean,
  selectedFDT : String
})
const emit = defineEmits(['update:selectFDODialog'])
const dialogVisible = ref(props.selectFDODialog)
const selectedFDT = ref(props.selectedFDT)
const selectedFDO=ref()

// 로컬 상태가 변경될 때 부모 컴포넌트에 알림
watch(dialogVisible, (newValue) => {
  emit('update:selectFDODialog', newValue)
})

watch(() => props.selectedFDT, (newValue) => {
  selectedFDT.value = newValue
  getFDOList();
})

watch(() => props.selectFDODialog, (newValue) => {
  dialogVisible.value = newValue
})

const selectFDO = (event: any, row: any) => {
  emit('selectedFDO',row.item);
  dialogVisible.value = false
}

const closeDialog = () => {
  dialogVisible.value = false
}

const headers= [
  { title: 'ID', value: 'federated_digital_object_id' },
  { title: 'Name', value: 'federated_digital_object_name' },
  { title: 'Description', value: 'description' }
]

const fdoList = ref([])
const currentPage= ref(1)
const itemsPerPage= ref(5)
const pageLength = ref(0)

const getFDOList = async () => {
  try {
    const result = await $axios.get(`/federated-twins/${selectedFDT.value}/federated-digital-objects`);
    fdoList.value = [...new Set(result.data.map(item => ({federated_digital_object_id: item.federated_digital_object_id, federated_digital_object_name: item.federated_digital_object_name, description : item.description})))];
    pageLength.value = Math.ceil(fdoList.value.length / itemsPerPage.value)
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};
</script>

<template>
  <v-dialog v-model="dialogVisible" persistent max-width="1000px">
    <v-card>
      <v-card-title>Select Federated Digital Object</v-card-title>
      <v-card-text>
        <v-data-table 
          :items="fdoList" 
          @click:row="selectFDO" 
          :headers="headers" 
          hover="true" 
          fixed-header="true" 
          :items-per-page="itemsPerPage"
          :page="currentPage"
          item-value="federated_digital_object_id">
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="currentPage"
                  :length="pageLength"
                ></v-pagination>
              </div>
            </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="darken-1" size="large" text="Close" @click="closeDialog"></v-btn>
        <!-- <v-btn color="darken-1" size="large" text="Submit" @click="selectDO"></v-btn> -->
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
