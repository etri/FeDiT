<script setup lang="ts">
import { ref, onMounted, computed, inject } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import FederatedDigitalTwinDetail from './FederatedDigitalTwinDetail.vue';
import FederatedDigitalTwinCreate from './FederatedDigitalTwinCreate.vue';
const $axios = inject('$axios');

const page = ref({ title: 'Federated Digital Twin' });
const breadcrumbs = ref([
  {
    title: 'Federated Digital Twin Management',
    disabled: false,
    href: '#'
  },
  {
    title: 'Federated Digital Twin',
    disabled: true,
    href: '#'
  }
]);

const items = ref([]);
const clickedItems = ref();

const headers = ref([
  { title: 'ID', value: "federated_digital_twin_id"},
  { title: 'Name', value: "federated_digital_twin_name"},
  { title: 'Owner', value: "owner"},
  { title: 'Creation Time', value: "creation_time"},
  { title: 'Description', value: "description"},
  { title: 'Keywords', value: "keywords"}
]);


const loading = ref(true);
const detailDialog = ref(false);
const createDialog = ref(false);
const search = ref('');
const currentPage= ref(1)
const itemsPerPage= ref(10)
const pageLength = ref(0)

const getFDTList = async () => {
  try {
    loading.value = true;
    const result = await $axios.get('/federated-twins/');
    items.value =  result.data;
    pageLength.value = Math.ceil(items.value.length / itemsPerPage.value)
    loading.value = false;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};

const rowClick = (event: any, row: any) => {
  clickedItems.value = row.item
  detailDialog.value = true
}

const createClick = () => {
  createDialog.value = true
}

const handleDeleteSuccess = () => {
  getFDTList();
}
const handleCreateSuccess = () => {
  getFDTList();
}
const handleModifySuccess = () => {
  getFDTList();
}

onMounted(() => {
  getFDTList();
});
</script>

<template>
  <!-- <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb> -->
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Federated Digital Twin List">
        <UiChildCard title="list">
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
          :loading="loading"
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
          <FederatedDigitalTwinDetail :detailDialog="detailDialog" :clickedItems="clickedItems" @update:detailDialog="val => detailDialog = val" @deleteSuccess="handleDeleteSuccess" @modifySuccess="handleModifySuccess"/>
            <div class="mr-4 mt-2 text-right">              
              <v-btn @click="createClick" color="lightsecondary" rounded="md">
                <PlusIcon size="20" class="mr-2"/>
                생성
              </v-btn>
            </div>
          <FederatedDigitalTwinCreate :createDialog="createDialog" @update:createDialog="val => createDialog = val" @createSuccess="handleCreateSuccess"/>
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
}

.searchKeyword{
  line-height: 51px;
}
</style>