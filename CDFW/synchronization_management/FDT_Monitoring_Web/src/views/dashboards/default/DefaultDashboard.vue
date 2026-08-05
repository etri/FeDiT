<script setup lang="ts">
// imported components
import TotalFDTCount from './components/TotalFDTCount.vue';
import TotalFDOCount from './components/TotalFDOCount.vue';
import TotalDTCount from './components/TotalDTCount.vue';
import TotalDOCount from './components/TotalDOCount.vue';
import TotalSensorCount from './components/TotalSensorCount.vue';
import TotalControlCount from './components/TotalControlCount.vue';
import TotalServiceCount from './components/TotalServiceCount.vue';
import TotalSIMCount from './components/TotalSIMCount.vue';
import TotalSUBCount from './components/TotalSUBCount.vue';
import TotalVMCount from './components/TotalVMCount.vue';
import SensorCountGraph from './components/SensorCountGraph.vue';
import ResourceMonitoring from './components/ResourceMonitoring.vue';
import FlinkMonitoring from './components/FlinkMonitoring.vue';
import KafkaMonitoring from './components/KafkaMonitoring.vue';

import { ref, inject, onMounted } from 'vue';
const $axios = inject('$axios');

const fdtTotal = ref(0)
const fdoTotal = ref(0)
const dtTotal = ref(0)
const doTotal = ref(0)
const serviceTotal = ref(0)
const simTotal = ref(0)
const subTotal = ref(0)
const vmTotal = ref(0)
const getFullRequestUrl = (error: any) => {
  const config = error?.config;
  if (!config) return undefined;
  const base = config.baseURL?.startsWith('http')
    ? config.baseURL
    : `${window.location.origin}${config.baseURL ?? ''}`;
  return new URL(config.url ?? '', base).href;
};

const getTotalResourceCount = async () => {
  try {
    const dt_result = await $axios.get('/digital-twins');
    if(dt_result.data) {
      dt_result.data.forEach(element => {
        dtTotal.value++;
        doTotal.value += element.number_of_digital_objects;
      });
    }
  } catch (error) {
    console.log('[API debug]', getFullRequestUrl(error), (error as any)?.response?.headers?.location);
    console.error('Failed to fetch digital-twin data:', error);
  }

  try {
    const fdt_result = await $axios.get('/federated-twins');
    if(fdt_result.data) {
      fdt_result.data.forEach(element => {
        fdtTotal.value++;
        fdoTotal.value += element.number_of_federated_digital_objects;
        serviceTotal.value += element.number_of_services;
        simTotal.value += element.number_of_simulations;
        subTotal.value += element.number_of_subscriptions;
        vmTotal.value += element.number_of_visual_models;
      });
    }
    // items.value =  result.data;
  } catch (error) {
    console.log('[API debug]', getFullRequestUrl(error), (error as any)?.response?.headers?.location);
    console.error('Failed to fetch federated-twin data:', error);
  }
};

onMounted(() => {
  getTotalResourceCount();
});
</script>

<style scoped>
.CntCard {
  flex: 6%;
}
</style>

<template>
    <!-- -------------------------------------------------------------------- -->
    <!-- Total Count -->
    <!-- -------------------------------------------------------------------- -->
  <v-row class="row">
    <v-col class="CntCard" cols="12">
      <TotalFDTCount :count="fdtTotal"/>
    </v-col>
    <v-col class="CntCard" cols="12">
      <TotalFDOCount :count="fdoTotal"/>
    </v-col>
    <v-col class="CntCard" cols="12">
      <TotalDTCount :count="dtTotal"/>
    </v-col>
    <v-col class="CntCard" cols="12">
      <TotalDOCount :count="doTotal"/>
    </v-col>
    <!-- <v-col class="CntCard" cols="12">
      <TotalServiceCount :count="serviceTotal"/>
    </v-col>
    <v-col class="CntCard" cols="12">
      <TotalSIMCount :count="simTotal"/>
    </v-col>
    <v-col class="CntCard" cols="12">
      <TotalSUBCount :count="subTotal"/>
    </v-col>
    <v-col class="CntCard" cols="12">
      <TotalVMCount :count="vmTotal"/>
    </v-col> -->
  </v-row>

  <v-row>
    <!-- -------------------------------------------------------------------- -->
    <!-- Total Growth -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" lg="7">
      <SensorCountGraph />
    </v-col>

    <!-- -------------------------------------------------------------------- -->
    <!-- Popular Stocks -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" lg="5">
      <ResourceMonitoring />
    </v-col>
  </v-row>
    <v-row>
    <!-- -------------------------------------------------------------------- -->
    <!-- Total Growth -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" lg="6">
      <FlinkMonitoring />
    </v-col>

    <!-- -------------------------------------------------------------------- -->
    <!-- Popular Stocks -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" lg="6">
      <KafkaMonitoring />
    </v-col>
  </v-row>
</template>
