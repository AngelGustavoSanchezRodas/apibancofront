import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      role: null,
      userId: null,
      isAuthenticated: false,

      login: (token, role, userId) => 
        set({ 
          token, 
          role, 
          userId, 
          isAuthenticated: true 
        }),

      logout: () => 
        set({ 
          token: null, 
          role: null, 
          userId: null, 
          isAuthenticated: false 
        }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
