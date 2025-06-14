import type { MapRendererInstance } from '@/components/map-renderer'
import { getUserInfo } from '@/services'
import type { User } from '@/types'
import { logger } from '@/utils'
import { toast } from 'sonner'
import { create } from 'zustand'

const log = logger.extend('app-store')

export interface AppStoreState {
  session: {
    user?: User
  }
  map?: MapRendererInstance
  currentChatId?: string
}

export type AppStoreActions = {
  dispatch: (state: Partial<AppStoreState>) => void
  getUserInfo: () => Promise<User | undefined>
  setMap: (map: MapRendererInstance) => void
  setCurrentChatId: (chatId?: string) => void
  setUserInfo: (user: User) => void
}

export const useAppStore = create<AppStoreState & AppStoreActions>((set, get) => {
  return {
    session: {
      user: undefined,
    },
    map: undefined,
    dispatch: (state) => set((prev) => ({ ...prev, ...state })),
    getUserInfo: async () => {
      const { user } = get().session
      if (user) return user
      const res = await getUserInfo().catch(() => undefined)
      if (!res || !res.success || !res.data) {
        toast.error('获取用户信息失败，请稍后重试！')
        return
      }
      log('获取用户信息成功', res.data)
      set((prev) => ({ ...prev, session: { ...prev.session, user: res.data! } }))
      return res.data
    },
    setMap: (map) => set((prev) => ({ ...prev, map })),
    setCurrentChatId: (chatId) => set((prev) => ({ ...prev, currentChatId: chatId })),
    setUserInfo: (user) => {
      set((prev) => ({ ...prev, session: { ...prev.session, user } }))
    },
  }
})
