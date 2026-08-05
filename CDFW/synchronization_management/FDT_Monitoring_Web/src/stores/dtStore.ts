import { defineStore } from 'pinia';
import { router } from '@/router';

export const useDTStore = defineStore({
  id: 'dtStore',
  state: () => ({
    selectedDT: null,
    selectedFDT: null
  }),
  actions: {
    setSelectedDT(dt) {
      console.log(dt);
      this.selectedDT = dt;
    },
    setSelectedFDT(fdt) {
      console.log(fdt);
      this.selectedFDT = fdt;
    }
  }
});
