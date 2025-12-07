import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ComponentCategory } from "./architecture-types";

export interface CustomIcon {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  color: string;
  iconUrl: string;
  createdAt: number;
}

interface CustomIconsState {
  icons: CustomIcon[];
  addIcon: (icon: Omit<CustomIcon, "id" | "createdAt">) => void;
  removeIcon: (id: string) => void;
  updateIcon: (
    id: string,
    updates: Partial<Omit<CustomIcon, "id" | "createdAt">>
  ) => void;
  getIconById: (id: string) => CustomIcon | undefined;
}

export const useCustomIconsStore = create<CustomIconsState>()(
  persist(
    (set, get) => ({
      icons: [],

      addIcon: (icon) => {
        const newIcon: CustomIcon = {
          ...icon,
          id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
        };
        set((state) => ({ icons: [...state.icons, newIcon] }));
      },

      removeIcon: (id) => {
        set((state) => ({
          icons: state.icons.filter((icon) => icon.id !== id),
        }));
      },

      updateIcon: (id, updates) => {
        set((state) => ({
          icons: state.icons.map((icon) =>
            icon.id === id ? { ...icon, ...updates } : icon
          ),
        }));
      },

      getIconById: (id) => {
        return get().icons.find((icon) => icon.id === id);
      },
    }),
    {
      name: "archflow-custom-icons",
    }
  )
);

// Helper to convert custom icon to ArchitectureComponent format
export function customIconToComponent(icon: CustomIcon) {
  return {
    id: icon.id,
    name: icon.name,
    category: icon.category,
    icon: "custom",
    description: icon.description,
    color: icon.color,
    iconUrl: icon.iconUrl,
  };
}
