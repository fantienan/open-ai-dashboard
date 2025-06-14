import { ThemeStoreProps } from '@/stores'
import type { User } from '@/types'
import type { MakeReqiured } from '@/types'
import type { UseChatOptions } from '@ai-sdk/react'
import React, { createContext, useContext, useState } from 'react'

export type ChatbarContextProps = Pick<ThemeStoreProps, 'theme' | 'setTheme'> & {
  user?: User
  chatId?: string
  onSignOut?: () => void
  onNewChat?: () => void
  onDeleteChat?: (params: { chatId: string }) => void
  onOpenHistoryChat?: (params: { chatId: string }) => void
  onCreateChat?: (params: { chatId: string }) => void
  onDownloadCode?: (params: { chatId: string; messageId: string }) => Promise<any>
  onChatSetting?: (params: { visible: boolean }) => void
  useChatOptions: UseChatOptions
}

type ChatbarContextState = {
  chatSettingVisible: boolean
  setChatSettingVisible: React.Dispatch<React.SetStateAction<boolean>>
}

export type ChatbarProviderProps = ChatbarContextProps & Pick<React.HTMLProps<HTMLDivElement>, 'children'>

const ChatbarContext = createContext<MakeReqiured<ChatbarContextProps & ChatbarContextState, 'onDownloadCode'> | null>(
  null,
)

function useChatbar() {
  const context = useContext(ChatbarContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatbarProvider.')
  }

  return context
}

function ChatbarProvider({ children, onDownloadCode: propOnDownloadCode, ...props }: ChatbarProviderProps) {
  const [chatSettingVisible, setChatSettingVisible] = useState(false)
  const onDownloadCode: ChatbarContextProps['onDownloadCode'] = async (params) => {
    if (propOnDownloadCode) return propOnDownloadCode(params)
    return Promise.reject('onDownloadCode not implemented')
  }

  const onChatSetting: ChatbarContextProps['onChatSetting'] = ({ visible }) => {
    setChatSettingVisible(visible)
    props.onChatSetting?.({ visible })
  }
  return (
    <ChatbarContext.Provider
      value={{ ...props, onChatSetting, onDownloadCode, chatSettingVisible, setChatSettingVisible }}
    >
      {children}
    </ChatbarContext.Provider>
  )
}
export { useChatbar, ChatbarProvider }
