<script setup>
const props = defineProps({ item: Object, level: Number });
// console.log(props.item)
</script>

<template>
  <template v-if="props.level > 0">
    <!-- <component :is="props.item" size="5" fill="currentColor" stroke-width="1.5" class="iconClass"></component> -->
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path :d="props.item" fill="currentColor" />
    </svg>
  </template>
  <template v-else>
    <!-- <component :is="props.item" size="20" stroke-width="1.5" class="iconClass"></component> -->
    <!-- <Icon v-else :path="props.item" size={1} /> -->
    <svg width="20" height="20" viewBox="0 0 25 25" fill="none">
      <path :d="props.item" fill="currentColor" />
    </svg>
  </template>
</template>
