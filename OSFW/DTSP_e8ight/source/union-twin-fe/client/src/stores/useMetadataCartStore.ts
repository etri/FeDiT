import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MetadataCartItem {
  dtoid: string;
  name: string;
  description?: string;
  digitalTwinId?: string;
  schemaInformation?: Record<string, unknown>;
}

export function cartItemLabel(item: MetadataCartItem): string {
  const title = item.schemaInformation?.title;
  return item.name || (typeof title === 'string' ? title : item.dtoid);
}

interface MetadataCartState {
  items: MetadataCartItem[];
  addItem: (item: MetadataCartItem) => boolean;
  removeItem: (dtoid: string) => void;
}

export const useMetadataCartStore = create<MetadataCartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        if (get().items.some((i) => i.dtoid === item.dtoid)) return false;
        set((state) => ({ items: [...state.items, item] }));
        return true;
      },
      removeItem: (dtoid) =>
        set((state) => ({
          items: state.items.filter((i) => i.dtoid !== dtoid),
        })),
    }),
    {
      name: 'metadata-cart-storage',
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
