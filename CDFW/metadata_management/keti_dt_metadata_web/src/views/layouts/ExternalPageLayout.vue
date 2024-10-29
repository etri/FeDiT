<template>
  <div id="container" class="wrap meta-external-layout" >
    <div id="contents" >
      <div class="rgtWrap" style="padding: 20px;">
        <Suspense>
          <router-view />
        </Suspense>
      </div>        
    </div>      
  </div>
</template>
<script setup>
// import { ref } from "vue";
// import ContentFooter from "@/components/layouts/ContentFooter.vue";

// const logo = ref("Digital Twin Metadata");
</script>