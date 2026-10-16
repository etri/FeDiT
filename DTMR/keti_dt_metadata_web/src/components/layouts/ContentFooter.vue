<template>
  <div id="footerWrap">
    <div class="copyright">{{ footer }}</div>
  </div>
</template>
  
<script setup>
import {ref} from "vue";

const n2mFooter = ref("Copyright © 2019 N2M co.,Ltd All right reserved");
const naraFooter = ref(process.env.VUE_APP_NARA_SERVICE_FOOTER);

const footer = ref(naraFooter.value === null || naraFooter.value === undefined ? n2mFooter : naraFooter);

</script>
  
<style>
</style>