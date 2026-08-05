<script setup lang="ts">
import { ref, onMounted, inject, watch} from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import DigitalObjectDetail from './DigitalObjectDetail.vue';
import DigitalObjectCreate from './DigitalObjectCreate.vue';
import DTDialog from '../DigitalTwinSelectDialog.vue'
import { useDTStore } from '@/stores/dtStore';

const $axios = inject('$axios');

const page = ref({ title: 'Digital Object' });
const breadcrumbs = ref([
  {
    title: 'Digital Twin Management',
    disabled: false,
    href: '#'
  },
  {
    title: 'Digital Object',
    disabled: true,
    href: '#'
  }
]);

const items = ref([]);
const clickedItems = ref();

const headers = ref([
  { title: 'ID', value: "digital_object_id"},
  { title: 'Name', value: "digital_object_name"},
  { title: 'Creation Time', value: "creation_time"},
  { title: 'Description', value: "description"},
  { title: 'Keywords', value: "keywords"},
  { title: 'Access URL', value: "digital_object_data_access_url"},
]);

const selectedDigitalTwin = ref("");
const createDisabled = ref(true)
const detailDialog = ref(false);
const createDialog = ref(false);
const selectDTDialog = ref(false);
const search = ref('');
const currentPage= ref(1)
const itemsPerPage= ref(10)
const pageLength = ref(0)

const selectDT = () => {
  const store = useDTStore();
  if(store.selectedDT != null && store.selectedDT.digital_twin_id){
    selectedDigitalTwin.value = store.selectedDT.digital_twin_id
    createDisabled.value = false
    getDOList();
  }
}

const rowClick = (event: any, row: any) => {
  clickedItems.value = row.item
  detailDialog.value = true
}

const createClick = () => {
  createDialog.value = true
}

const selectClick = () => {
  selectDTDialog.value = true
}

const getDOList = async () => {
  try {
    const result = await $axios.get(`/digital-twins/${selectedDigitalTwin.value}/digital-objects`);
    console.log(result)
    items.value =  result.data;
    pageLength.value = Math.ceil(items.value.length / itemsPerPage.value)
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};

const handleDeleteSuccess = () => {
  getDOList();
}
const handleCreateSuccess = () => {
  getDOList();
}
const handleModifySuccess = () => {
  getDOList();
}
watch(selectDTDialog, (newValue) => {
  selectDT();
})
onMounted(() => {
  selectDT();
});


</script>

<template>
  <!-- <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb> -->
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Digital Object List">
        <UiChildCard title="filter">
          <div class="filterCard d-flex flex-row">
            <div class="filterCardItem d-flex flex-row mx-4 w-100">
              <p class="searchKeyword text-right h6">DT ID : </p>
              <!-- <v-form disabled> -->
                <v-text-field
                  class="ml-3 dt-selected pt-1"
                  v-model="selectedDigitalTwin"
                  variant="regular"
                  density="compact"
                  hide-details
                  disabled
                ></v-text-field>
              <!-- </v-form> -->
              <v-btn @click="selectClick" class="mt-2 ml-3" color="lightsecondary" rounded="md">
                <ListSearchIcon size="20" class="mr-2"/>
                선택
              </v-btn>
              <DTDialog :selectDTDialog="selectDTDialog" @update:selectDTDialog="val => selectDTDialog = val" />
            </div>
          </div>
        </UiChildCard>
        <UiChildCard title="list" class="mt-8">
          <div class="d-flex flex-row-reverse">
            <div class="w-25">
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

          <v-data-table 
          :headers="headers"
          :items="items"
          @click:row="rowClick"
          :search="search"
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
          <DigitalObjectDetail :detailDialog="detailDialog" :clickedItems="clickedItems" @update:detailDialog="val => detailDialog = val" @deleteSuccess="handleDeleteSuccess" @modifySuccess="handleModifySuccess"/>
            <div class="mr-4 mt-2 text-right">              
              <v-btn class="create-btn" @click="createClick" color="lightsecondary" rounded="md" :disabled="createDisabled">
                <PlusIcon size="20" class="mr-2"/>
                생성
              </v-btn>
            </div>
          <DigitalObjectCreate :createDialog="createDialog" :selectedDigitalTwin="selectedDigitalTwin" @update:createDialog="val => createDialog = val" @createSuccess="handleCreateSuccess"/>
        </UiChildCard>
      </UiParentCard>
    </v-col>
  </v-row>
</template>

<style lang="scss">
.filterCard{
  .filterField{
    min-width: 150px;
    max-width: 400px;
  }

  .dt-selected {
    max-width: 800px;
    border: 1px solid #D0D0D0;
    background-color: #f6f8fb;
    border-radius: 10px;
  }
}

.searchKeyword{
  line-height: 51px;
}

.create-btn:disabled {
   background-color: #f5f5f5; /* 원하는 비활성화 배경 색상 */
}
</style>