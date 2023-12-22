<template>
  <div id="bodyWrap">
    <div id="headerWrap">
      <div class="headerSec ">
        <div class="headerLft " >
          <div class="logo" style="width:300px;">
            <h1 class="logo-font">{{logo}}</h1>
          </div>
        </div>
      </div>
    </div>
    <div id="container" class="wrap meta-resource-layout" >
      <div id="contents" >
        <div class="rgtWrap" style="padding: 20px;">
          <Suspense>
            <router-view />
          </Suspense>
          <content-footer></content-footer>
        </div>        
      </div>      
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import ContentFooter from "@/components/layouts/ContentFooter.vue";

const logo = ref("Digital Twin Metadata");
</script>