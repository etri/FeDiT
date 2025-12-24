<template>
  <div class="cntSec">
    <RdfMappingDetail :rdfMapping="rdfMapping" />
  </div>
</template>
<script setup>
import RdfMappingDetail from "@/components/meta/rdfmapping/RdfMappingDetail.vue";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getGlobalProperties,
  getCookie,
  routerPush,
  getSuperAdmin,
} from "@/assets/js/common.js";
import { getUser } from "@/assets/js/auth.js";

import util from "util";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const user = getUser();
const router = useRouter();
const route = useRoute();
const rdfMapping = ref({});

onMounted(() => {
  let rdfMappgId = route.query.rdfMappgId;
  getServiceDetail(rdfMappgId);
});

const getServiceDetail = (rdfMappgId) => {
  $axios
    .get(util.format($apiUrls.meta.rdf.mapping.getMapping, rdfMappgId))
    .then((res) => {
      rdfMapping.value = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

</script>
<style lang="scss"></style>
