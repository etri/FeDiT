<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, inject, onMounted} from 'vue'
const $axios = inject('$axios');

const props = defineProps({
  selectDODialog: Boolean,
  selectedDigitalTwin : String
})
const emit = defineEmits(['update:selectDODialog'])
const dialogVisible = ref(props.selectDODialog)
const selectedDigitalTwin = ref(props.selectedDigitalTwin)
const selectedDO=ref()
// 로컬 상태가 변경될 때 부모 컴포넌트에 알림
watch(dialogVisible, (newValue) => {
  emit('update:selectDODialog', newValue)
})

watch(() => props.selectedDigitalTwin, (newValue) => {
  selectedDigitalTwin.value = newValue
  getDOList();

})

watch(() => props.selectDODialog, (newValue) => {
  dialogVisible.value = newValue
})

const selectDO = (event: any, row: any) => {
  emit('selectedDO',row.item);
  dialogVisible.value = false
}

const closeDialog = () => {
  dialogVisible.value = false
}

const headers= [
  { title: 'ID', value: 'digital_object_id' },
  { title: 'Name', value: 'digital_object_name' },
  { title: 'Description', value: 'description' }
]

const doList = ref([])
const currentPage= ref(1)
const itemsPerPage= ref(5)
const pageLength = ref(0)

const getDOList = async () => {
  try {
    const result = await $axios.get(`/digital-twins/${selectedDigitalTwin.value}/digital-objects`);
    doList.value = [...new Set(result.data.map(item => ({digital_object_id: item.digital_object_id, digital_object_name: item.digital_object_name, description : item.description})))];
    pageLength.value = Math.ceil(doList.value.length / itemsPerPage.value)
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};
// onMounted(() => {
//   getDOList();
// });

</script>

<template>
  <v-dialog v-model="dialogVisible" persistent max-width="1000px">
    <v-card>
      <v-card-title>Select Digital Object</v-card-title>
      <v-card-text>
        <v-data-table 
          :items="doList" 
          @click:row="selectDO" 
          :headers="headers" 
          hover="true" 
          fixed-header="true" 
          :items-per-page="itemsPerPage"
          :page="currentPage"
          item-value="digital_object_id">
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
