import { create } from 'zustand'

interface ThemeStoreState {
  theme: 'dark' | 'light'
}

type ThemeStoreActions = {
  setTheme: (theme: ThemeStoreState['theme']) => void
}

export type ThemeStoreProps = ThemeStoreState & ThemeStoreActions

export const useThemeStore = create<ThemeStoreProps>((set) => ({
  theme: localStorage.getItem('theme') === 'dark' ? 'dark' : 'light',
  setTheme: (theme) => {
    set((prev) => ({ ...prev, theme }))
    localStorage.setItem('theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.toggle('dark')
      document.documentElement.classList.remove('light')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.toggle('light')
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  },
}))
