import { create } from "zustand";
import { sortAddressDropdowns } from "@/utils/apiHelper";
import { persist } from "zustand/middleware";

export const useAddressStore = create(
  persist(
    (set, get) => ({
      provinces: [],
      cities: [],
      zones: [],
      loading: false,
      error: null,

      fetchAddressDropdowns: async () => {
        set({ loading: true, error: null });

        const response = await sortAddressDropdowns();
        const provinces = Array.isArray(response?.provinces) ? response.provinces : [];
        const cities = Array.isArray(response?.cities) ? response.cities : [];
        const zones = Array.isArray(response?.zones) ? response.zones : [];

        if (provinces.length > 0) {
          // console.log("response", response);
          set({
            provinces,
            cities,
            zones,
            loading: false,
          });
        } else {
          set({
            error: response?.error || "Check for internet connection and try again",
            loading: false,
          });
        }
      },
    }),
    {
      name: "address-store",
      skipHydration: true,
    }
  )
);
