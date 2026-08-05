<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject, onMounted} from 'vue'
const $axios = inject('$axios');

const props = defineProps({
  selectDODialog: Boolean,
  selectedDigitalObjects: Array,
})
const emit = defineEmits(['update:selectDODialog'])
const dialogVisible = ref(props.selectDODialog)
const selectedDOs=ref(props.selectedDigitalObjects)
const search = ref()
// 로컬 상태가 변경될 때 부모 컴포넌트에 알림
watch(dialogVisible, (newValue) => {
  emit('update:selectDODialog', newValue)
})

watch(() => props.selectDODialog, (newValue) => {
  dialogVisible.value = newValue
  console.log(props.selectedDigitalObjects)
  getDTList();
  getDOList();
})

const selectDOs = (event: any, row: any) => {
  emit('selectedDOs',selectedDOs)
  dialogVisible.value = false
}

const closeDialog = () => {
  dialogVisible.value = false
  selectedDOs.value = []
  search.value = ''
}

const headers= [
  { title: 'ID', value: 'digital_object_id' },
  { title: 'Name', value: 'digital_object_name' },
  { title: 'Description', value: 'description' }
]

const dtList = ref([])
const doList = ref([])
const currentPage= ref(1)
const itemsPerPage= ref(5)
const pageLength = ref(0)

const getDTList = async () => {
  try {
    const result = await $axios.get(`/digital-twins`);
    dtList.value = [...new Set(result.data.map(item => ({digital_twin_id: item.digital_twin_id, digital_twin_name: item.digital_twin_name})))];
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};

const getDOList = async () => {
  if(dtList.value.length !== 0){
    const promises = dtList.value.map(async (dt) =>{
      const result = await $axios.get(`/digital-twins/${dt.digital_twin_id}/digital-objects`);
      return result.data.map((item: any) => ({
        digital_object_id: item.digital_object_id,
        digital_object_name: item.digital_object_name,
        description: item.description,
        digital_twin_id: dt.digital_twin_id,
        digital_twin_name: dt.digital_twin_name
      }))
    })
    try {
      // const result = await $axios.get(`/digital-twins/${selectedDigitalTwin.value}/digital-objects`);
      // doList.value = [...new Set(result.data.map(item => ({digital_object_id: item.digital_object_id, digital_object_name: item.digital_object_name, description : item.description})))];
      const results = await Promise.all(promises);
      doList.value = [...new Set(results.flat())];
      pageLength.value = Math.ceil(doList.value.length / itemsPerPage.value)
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }
};

onMounted(() => {
  getDTList();
});

</script>

<template>
  <v-dialog v-model="dialogVisible" persistent max-width="1000px">
    <v-card>
      <v-card-title>Select Digital Object</v-card-title>
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
          :items="doList" 
          :headers="headers" 
          :search="search"
          hover="true" 
          fixed-header="true" 
          :items-per-page="itemsPerPage"
          :page="currentPage"
          item-value="digital_object_id"
          show-select
          v-model="selectedDOs">
            <template v-slot:item="{ item, index, isSelected }">
              <template v-if="index === 0 || item.digital_twin_id !== doList[index - 1].digital_twin_id">
                <tr>
                  <td :colspan="headers.length + 1">
                    <strong>{{ item.digital_twin_name }}</strong>
                  </td>
                </tr>
              </template>
              <tr :class="{ 'v-data-table__selected': isSelected }">
                <td>
                  <v-checkbox
                    class="d-flex align-center"
                    v-model="selectedDOs"
                    :value="item.digital_object_id"
                  ></v-checkbox>
                </td>
                <td>{{ item.digital_object_id }}</td>
                <td>{{ item.digital_object_name }}</td>
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
          <h4>Selected Digital Objects:</h4>
          <ul class="ml-4">
            <li class="text-caption" v-for="doId in selectedDOs" :key="doId">
              {{ doId }}
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
