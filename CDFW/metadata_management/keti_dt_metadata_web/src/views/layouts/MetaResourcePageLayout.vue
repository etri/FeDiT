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
import { ref, reactive } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import { ElLoading } from "element-plus";

import ContentFooter from "@/components/layouts/ContentFooter.vue";

const logo = ref("Digital Twin Metadata");

const $emitter = getGlobalProperties().$emitter;

let loading = reactive({});
$emitter.on("loading", (flag) => {
  if (flag) {
    loading = ElLoading.service({
      lock: true,
      text: "Loading",
      background: "rgba(0, 0, 0, 0.7)",
    });
  } else {
    if (loading) loading.close();
  }
});

</script>