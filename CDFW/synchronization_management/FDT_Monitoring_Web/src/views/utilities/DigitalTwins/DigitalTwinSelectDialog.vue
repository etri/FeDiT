<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject, onMounted} from 'vue'
const $axios = inject('$axios');
import { useDTStore } from '@/stores/dtStore';

const props = defineProps({
  selectDTDialog: Boolean,
})
const emit = defineEmits(['update:selectDTDialog'])
const dialogVisible = ref(props.selectDTDialog)

// 로컬 상태가 변경될 때 부모 컴포넌트에 알림
watch(dialogVisible, (newValue) => {
  emit('update:selectDTDialog', newValue)
})

watch(() => props.selectDTDialog, (newValue) => {
  dialogVisible.value = newValue
})

const selectDT = (event: any, row: any) => {
  const store = useDTStore();
  store.setSelectedDT(row.item);
  dialogVisible.value = false
}

const closeDialog = () => {
  dialogVisible.value = false
}

const headers= [
  { title: 'ID', value: 'digital_twin_id' },
  { title: 'Name', value: 'digital_twin_name' },
  { title: 'Description', value: 'description' }
]

const dtList = ref([])
const currentPage= ref(1)
const itemsPerPage= ref(5)
const pageLength = ref(0)

const getDTList = async () => {
  try {
    const result = await $axios.get('/digital-twins');
    dtList.value = [...new Set(result.data.map(item => ({digital_twin_id: item.digital_twin_id, digital_twin_name: item.digital_twin_name, description : item.description})))];
    pageLength.value = Math.ceil(dtList.value.length / itemsPerPage.value)
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};
onMounted(() => {
  getDTList();
});

</script>

<template>
  <v-dialog v-model="dialogVisible" persistent max-width="1000px">
    <v-card>
      <v-card-title>Select Digital Twin</v-card-title>
      <v-card-text>
        <v-data-table 
          :items="dtList" 
          @click:row="selectDT" 
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
