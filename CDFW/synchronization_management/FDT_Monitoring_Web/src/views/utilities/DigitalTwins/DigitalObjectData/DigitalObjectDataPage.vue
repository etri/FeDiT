<script setup lang="ts">
import { ref, onMounted, inject, watch} from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import DigitalObjectDataDetail from './DigitalObjectDataDetail.vue';
import DTDialog from '../DigitalTwinSelectDialog.vue'
import DODialog from '../DigitalObjectSelectDialog.vue'

import { useDTStore } from '@/stores/dtStore';

const $axios = inject('$axios');

const page = ref({ title: 'Digital Object Data' });
const breadcrumbs = ref([
  {
    title: 'Digital Twin Management',
    disabled: false,
    href: '#'
  },
  {
    title: 'Digital Object Data',
    disabled: true,
    href: '#'
  }
]);

const items = ref([]);
const clickedItems = ref();

const headers = ref([
  { title: 'Time', value: "rowtime", width: '15%'},
  { title: 'Data', value: "data", width: '85%'}
]);

const selectedDigitalTwin = ref("");
const selectedDigitalObject = ref("");
const selectedDOString = ref("");

const createDisabled = ref(true)
const selectDODisabled = ref(true)
const selectParamDisabled = ref(true)
const detailDialog = ref(false);
const createDialog = ref(false);
const selectDTDialog = ref(false);
const selectDODialog = ref(false);

const search = ref('');
const currentPage= ref(1)
const itemsPerPage= ref(10)
const pageLength = ref(0)
const count = ref()
const from = ref()
const to = ref()

const selectDT = () => {
  const store = useDTStore();
  if(store.selectedDT != null && store.selectedDT.digital_twin_id){
    selectedDigitalTwin.value = store.selectedDT.digital_twin_id
    createDisabled.value = false
    selectDODisabled.value = false
    // getDataList();
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
const selectDOClick = () => {
  selectDODialog.value = true
}

const getDataList = async () => {
  try {
    const result = await $axios.get(`/digital-twins/${selectedDigitalTwin.value}/digital-objects/${selectedDOString.value}/data`);
    items.value =  result.data;
    pageLength.value = Math.ceil(items.value.length / itemsPerPage.value)
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};

const handleSubmitDO = (selectedDO) => {
  console.log('submitted DO : ', selectedDO)
  selectedDigitalObject.value= selectedDO
  selectedDOString.value = selectedDO.digital_object_id
  selectParamDisabled.value = false;
  getDataList();
}

const searchQueryParam = async () =>{
  try {
    const result = await $axios.get(`/digital-twins/${selectedDigitalTwin.value}/digital-objects/${selectedDOString.value}/data`, {params:{count: count.value, from: from.value, to: to.value}});
    items.value =  result.data;
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
      <UiParentCard title="Digital Object Data List">
        <UiChildCard title="filter">
          <div class="filterCard flex-row">
            <div class="filterCardItem d-flex flex-row mx-4 w-100 mb-4">
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
            <div class="filterCardItem d-flex flex-row mx-4 w-100">
              <p class="searchKeyword text-right h6">DO ID : </p>
              <!-- <v-form disabled> -->
                <v-text-field
                  class="ml-3 dt-selected pt-1"
                  v-model="selectedDOString"
                  variant="regular"
                  density="compact"
                  hide-details
                  disabled
                ></v-text-field>
              <!-- </v-form> -->
              <v-btn @click="selectDOClick" class="mt-2 ml-3" color="lightsecondary" rounded="md" :disabled="selectDODisabled">
                <ListSearchIcon size="20" class="mr-2"/>
                선택
              </v-btn>
               <DODialog :selectDODialog="selectDODialog" @update:selectDODialog="val => selectDODialog = val" :selectedDigitalTwin="selectedDigitalTwin" @selectedDO="handleSubmitDO" />
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
          <DigitalObjectDataDetail :detailDialog="detailDialog" :clickedItems="clickedItems" @update:detailDialog="val => detailDialog = val" @deleteSuccess="handleDeleteSuccess" @modifySuccess="handleModifySuccess"/>
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