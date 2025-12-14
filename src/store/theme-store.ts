import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface AppStore {
    // Theme
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;

    // Focus Mode
    focusMode: boolean;
    isTyping: boolean;
    toggleFocusMode: () => void;
    setTyping: (value: boolean) => void;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set) => ({
            // Theme
            theme: 'dark',
            toggleTheme: () =>
                set((state) => ({
                    theme: state.theme === 'light' ? 'dark' : 'light',
                })),
            setTheme: (theme) => set({ theme }),

            // Focus Mode
            focusMode: false,
            isTyping: false,
            toggleFocusMode: () =>
                set((state) => ({
                    focusMode: !state.focusMode,
                })),
            setTyping: (value) => set({ isTyping: value }),
        }),
        {
            name: 'app-storage',
            partialize: (state) => ({ theme: state.theme, focusMode: state.focusMode }),
        }
    )
);

// Alias for backward compatibility
export const useThemeStore = useAppStore;
