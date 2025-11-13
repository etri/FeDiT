<template>
  <form ref="form" method="post" :action="actionUrl" enctype="application/x-www-form-urlencoded">
    <input type="hidden" name="userId" :value="userId"/>
    <input type="hidden" name="Authorization" :value="token"/>
  </form>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getToken } from "@/assets/js/auth.js";

const route = useRoute();

const form = ref(null);
const userId = ref(route.query.userId);

const token = ref('Bearer ' + getToken());
let actionUrl = process.env.VUE_APP_N2M_AUTH_URI + '/signup';

if (userId.value) {
  actionUrl = process.env.VUE_APP_N2M_AUTH_URI + '/userInfo';
}

onMounted(() => form.value.submit())

</script>
<style lang="scss"></style>
