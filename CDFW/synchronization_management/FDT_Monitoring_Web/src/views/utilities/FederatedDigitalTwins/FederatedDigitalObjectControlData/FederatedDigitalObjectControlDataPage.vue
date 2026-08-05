<script setup lang="ts">
import { ref, onMounted, inject, watch } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import FederatedDigitalObjectControlDataDetail from './FederatedDigitalObjectControlDataDetail.vue';
import FDTDialog from '../FederatedTwinSelectDialog.vue';
import FDODialog from '../FederatedDigitalObjectSelectDialog.vue';

import { useDTStore } from '@/stores/dtStore';
const $axios = inject('$axios');

const page = ref({ title: 'Federated Digital Object Control Data' });
const breadcrumbs = ref([
  {
    title: 'Federated Digital Twin Management',
    disabled: false,
    href: '#'
  },
  {
    title: 'Federated Digital Object Control Data',
    disabled: true,
    href: '#'
  }
]);

const items = ref([]);
const clickedItems = ref();

const headers = ref([
  { title: 'Time', value: "federated_digital_object_control_creation_time", width: '15%'},
  { title: 'Data', value: "federated_digital_object_control_execution_result", width: '85%'}
]);

const selectedFDT = ref("");
const selectedFDO = ref("");
const selectedFDOString = ref("");

const createDisabled = ref(true)
const selectFDODisabled = ref(true)
const selectParamDisabled = ref(true)
const detailDialog = ref(false);
const createDialog = ref(false);
const selectFDTDialog = ref(false);
const selectFDODialog = ref(false);

const search = ref('');
const currentPage= ref(1)
const itemsPerPage= ref(10)
const pageLength = ref(0)
const count = ref()
const from = ref()
const to = ref()

const selectFDT = () => {
  const store = useDTStore();
  if(store.selectedFDT != null && store.selectedFDT.federated_digital_twin_id){
    selectedFDT.value = store.selectedFDT.federated_digital_twin_id
    createDisabled.value = false
    selectFDODisabled.value = false
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
  selectFDTDialog.value = true
}
const selectFDOClick = () => {
  selectFDODialog.value = true
}

const getDataList = async () => {
  try {
    const result = await $axios.get(`/federated-twins/${selectedFDT.value}/federated-digital-objects/${selectedFDOString.value}/control`);
    items.value = Object.values(result.data).map(item => ({
    federated_digital_object_control_creation_time: item.federated_digital_object_control_creation_time,
    federated_digital_object_control_execution_result: item.federated_digital_object_control_execution_result
    }));
    // items.value =  result.data;
    pageLength.value = Math.ceil(items.value.length / itemsPerPage.value)
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};

const handleSubmitFDO = (selected) => {
  console.log('submitted DO : ', selected)
  selectedFDO.value= selected
  selectedFDOString.value = selected.federated_digital_object_id
  selectParamDisabled.value = false;
  getDataList();
}

const searchQueryParam = async () =>{
  try {
    const result = await $axios.get(`/federated-twins/${selectedFDT.value}/federated-digital-objects/${selectedFDOString.value}/control`, {params:{count: count.value, from: from.value, to: to.value}});
    items.value = Object.values(result.data).map(item => ({
      federated_digital_object_control_creation_time: item.federated_digital_object_control_creation_time,
      federated_digital_object_control_execution_result: item.federated_digital_object_control_execution_result
    }));
    // items.value =  result.data;
    pageLength.value = Math.ceil(items.value.length / itemsPerPage.value)
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}
const handleDeleteSuccess = () => {
  getDataList();
}
const handleCreateSuccess = () => {
  getDataList();
}
const handleModifySuccess = () => {
  getDataList();
}
watch(selectFDTDialog, (newValue) => {
  selectFDT();
})
onMounted(() => {
  selectFDT();
});
</script>


<template>
  <!-- <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb> -->
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Federated Digital Object Control Data List">
        <UiChildCard title="filter">
          <div class="filterCard flex-row">
            <div class="filterCardItem d-flex flex-row mx-4 w-100 mb-4">
              <p class="searchKeyword text-right h6">FDT ID : </p>
              <!-- <v-form disabled> -->
                <v-text-field
                  class="ml-3 dt-selected pt-1"
                  v-model="selectedFDT"
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
              <FDTDialog :selectFDTDialog="selectFDTDialog" @update:selectFDTDialog="val => selectFDTDialog = val" />
            </div>
            <div class="filterCardItem d-flex flex-row mx-4 w-100">
              <p class="searchKeyword text-right h6">FDO ID : </p>
              <!-- <v-form disabled> -->
                <v-text-field
                  class="ml-3 dt-selected pt-1"
                  v-model="selectedFDOString"
                  variant="regular"
                  density="compact"
                  hide-details
                  disabled
                ></v-text-field>
              <!-- </v-form> -->
              <v-btn @click="selectFDOClick" class="mt-2 ml-3" color="lightsecondary" rounded="md" :disabled="selectFDODisabled">
                <ListSearchIcon size="20" class="mr-2"/>
                선택
              </v-btn>
               <FDODialog :selectFDODialog="selectFDODialog" @update:selectFDODialog="val => selectFDODialog = val" :selectedFDT="selectedFDT" @selectedFDO="handleSubmitFDO" />
            </div>
          </div>
          <v-divider class="my-3"/>
          <p class="h6 text-grey">query params</p>
          <div class="filterCard d-flex flex-row">
            <div class="filterCardItem d-flex flex-row mx-4 w-100">
              <p class="searchKeyword text-right h6 ">count : </p>
                <v-text-field
                  class="ml-3 pt-1 countField h-50 shirink"
                  v-model="count"
                  variant="outlined"
                  density="compact"
                  type="number"
                  hide-details
                ></v-text-field>
            </div>
            <div class="filterCardItem d-flex flex-row mx-4 w-100">
              <p class="searchKeyword text-right h6">from : </p>
              <div class="ml-3 pt-1">
                <Datepicker
                  class="datepicker"
                  :teleport="true"
                  v-model="from"
                ></Datepicker>
              </div>
            </div>
            <div class="filterCardItem d-flex flex-row mx-4 w-100">
              <p class="searchKeyword text-right h6">to : </p>
              <div class="ml-3 pt-1">
                <Datepicker
                  class="datepicker"
                  :teleport="true"
                  v-model="to"
                ></Datepicker>
              </div>
            </div>
            <v-btn @click="searchQueryParam" class="mt-2 ml-3" color="lightsecondary" rounded="md" :disabled="selectParamDisabled">
                <SearchIcon size="20" class="mr-2"/>
                검색
              </v-btn>
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
          class="custom-data-table"
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
          <FederatedDigitalObjectDataDetail :detailDialog="detailDialog" :clickedItems="clickedItems" @update:detailDialog="val => detailDialog = val" @deleteSuccess="handleDeleteSuccess" @modifySuccess="handleModifySuccess"/>
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

.custom-data-table td:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 0; /* 셀이 컬럼 너비 내에서 잘리도록 설정 */
  padding: 8px; /* 패딩 설정 */
  box-sizing: border-box; /* 패딩 포함하여 크기 계산 */

}
</style>