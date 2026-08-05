<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject, onMounted} from 'vue'
const $axios = inject('$axios');
import { useDTStore } from '@/stores/dtStore';

const props = defineProps({
  selectFDTDialog: Boolean,
})
const emit = defineEmits(['update:selectFDTDialog'])
const dialogVisible = ref(props.selectFDTDialog)

// 로컬 상태가 변경될 때 부모 컴포넌트에 알림
watch(dialogVisible, (newValue) => {
  emit('update:selectFDTDialog', newValue)
})

watch(() => props.selectFDTDialog, (newValue) => {
  dialogVisible.value = newValue
})

const selectFDT = (event: any, row: any) => {
  const store = useDTStore();
  store.setSelectedFDT(row.item);
  dialogVisible.value = false
}

const closeDialog = () => {
  dialogVisible.value = false
}

const headers= [
  { title: 'ID', value: 'federated_digital_twin_id' },
  { title: 'Name', value: 'federated_digital_twin_name' },
  { title: 'Description', value: 'description' }
]

const fdtList = ref([])
const currentPage= ref(1)
const itemsPerPage= ref(5)
const pageLength = ref(0)

const getFDTList = async () => {
  try {
    const result = await $axios.get('/federated-twins');
    fdtList.value = [...new Set(result.data.map(item => ({federated_digital_twin_id: item.federated_digital_twin_id, federated_digital_twin_name: item.federated_digital_twin_name, description : item.description})))];
    pageLength.value = Math.ceil(fdtList.value.length / itemsPerPage.value)
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};
onMounted(() => {
  getFDTList();
});

</script>

<template>
  <v-dialog v-model="dialogVisible" persistent max-width="1000px">
    <v-card>
      <v-card-title>Select Federated Digital Twin</v-card-title>
      <v-card-text>
        <v-data-table 
          :items="fdtList" 
          @click:row="selectFDT" 
          :headers="headers" 
          hover="true" 
          fixed-header="true" 
          :items-per-page="itemsPerPage"
          :page="currentPage">
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
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
