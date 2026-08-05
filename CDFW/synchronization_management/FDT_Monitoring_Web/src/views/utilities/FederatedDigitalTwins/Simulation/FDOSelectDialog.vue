<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject, onMounted} from 'vue'
const $axios = inject('$axios');

const props = defineProps({
  selectFDODialog: Boolean,
  selectedFederatedTwin: String,
  selectedFederatedDigitalObjects: Array,
})
const emit = defineEmits(['update:selectFDODialog'])
const dialogVisible = ref(props.selectFDODialog)
const selectedFDT =  ref(props.selectedFederatedTwin)
const selectedFDOs=ref(props.selectedFederatedDigitalObjects)
const search = ref()

// 로컬 상태가 변경될 때 부모 컴포넌트에 알림
watch(dialogVisible, (newValue) => {
  emit('update:selectFDODialog', newValue)
})

watch(() => props.selectedFederatedTwin, (newValue) => {
  selectedFDT.value = newValue
  getFDOList();
})
watch(() => props.selectFDODialog, (newValue) => {
  dialogVisible.value = newValue
})

const selectDOs = (event: any, row: any) => {
  emit('selectedFDOs',selectedFDOs)
  dialogVisible.value = false
}

const closeDialog = () => {
  dialogVisible.value = false
  selectedFDOs.value = []
  search.value = ''
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

onMounted(() => {
  getFDOList();
});

</script>

<template>
  <v-dialog v-model="dialogVisible" persistent max-width="1000px">
    <v-card>
      <v-card-title>Select Federated Digital Object</v-card-title>
      <div class="d-flex flex-row-reverse">
        <div class="w-50 mr-2">
        <v-text-field
          class="ml-3"
          v-model="search"
          label="Search"
          prepend-inner-icon="mdi-magnify"
          variant="solo-filled"
          density="compact"
          flat
          hide-details
          single-line
          clearable
        ></v-text-field>
        </div>
      </div>
      <v-card-text>
        <v-data-table 
          :items="fdoList" 
          :headers="headers" 
          :search="search"
          hover="true" 
          fixed-header="true" 
          :items-per-page="itemsPerPage"
          :page="currentPage"
          item-value="federated_digital_object_id"
          show-select
          v-model="selectedFDOs">
            <template v-slot:item="{ item, index, isSelected }">
              <template v-if="index === 0 || item.federated_digital_twin_id !== fdoList[index - 1].federated_digital_twin_id">
                <tr>
                  <td :colspan="headers.length + 1">
                    <strong>{{ item.federated_digital_twin_name }}</strong>
                  </td>
                </tr>
              </template>
              <tr :class="{ 'v-data-table__selected': isSelected }">
                <td>
                  <v-checkbox
                    class="d-flex align-center"
                    v-model="selectedFDOs"
                    :value="item.federated_digital_object_id"
                  ></v-checkbox>
                </td>
                <td>{{ item.federated_digital_object_id }}</td>
                <td>{{ item.federated_digital_object_name }}</td>
                <td>{{ item.description }}</td>
              </tr>
            </template>
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="currentPage"
                  :length="pageLength"
                ></v-pagination>
              </div>
            </template>
        </v-data-table>
        <!-- Selected Digital Objects List -->
        <div class="mt-4">
          <h4>Selected Federated Digital Objects:</h4>
          <ul class="ml-4">
            <li class="text-caption" v-for="fdoId in selectedFDOs" :key="fdoId">
              {{ fdoId }}
            </li>
          </ul>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="darken-1" size="large" text="Close" @click="closeDialog"></v-btn>
        <v-btn color="darken-1" size="large" text="Submit" @click="selectDOs"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
