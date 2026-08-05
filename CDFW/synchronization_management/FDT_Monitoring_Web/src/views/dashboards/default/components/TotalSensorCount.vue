<script setup lang="ts">
import { ref, defineProps, watch } from 'vue';
import { router } from '@/router';
import iconCard from '@/assets/images/icons/icon-card.svg';

const props = defineProps({
  count: Number
})
const itemCount = ref(props.count)
watch(() => props.count, (newCount: Number) =>{ itemCount.value = newCount});

const handleCardClick = () => {
  router.push('/sensor');
}
</script>

<template>
  <v-card elevation="0" class="bg-white overflow-hidden bubble-shape bubble-lightsecondary-shape" @click="handleCardClick">
    <v-card-text>
      <h2 class="text-h1 font-weight-medium z-1 text-center mt-8 mb-8 mr-4 ml-4">
        Sensor<a href="#"></a>
      </h2>
      <h2 class="text-h1 text-right font-weight-medium z-1 pr-8">
        {{itemCount}}
        <!-- 45 -->
      </h2>
    </v-card-text>
  </v-card>
</template>
