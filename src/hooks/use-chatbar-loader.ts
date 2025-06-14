import type { ChatbarProps } from '@/components/chat/chat-bar'
import { AI_SERVER_ROOT_PATH } from '@/lib/constant'
import { downloadCode } from '@/services'
import { useAppStore, useThemeStore } from '@/stores'
import { DBMessage } from '@/types'
import { BizResult } from '@/types'
import { fetcher } from '@/utils'
import { convertToUIMessages } from '@ai-dashboard/common/utils'
import useSWR from 'swr'
import { v4 as uuidv4 } from 'uuid'
import { useIsMobile } from './use-mobile'

export type ChatLoaderData = {
  initialMessages: DBMessage[]
  error?: boolean
}

// export function convertToUIMessages(messages: DBMessage[]): UIMessage[] {
//   return messages.map((message) => ({
//     id: message.id,
//     parts: message.parts as UIMessage['parts'],
//     role: message.role as UIMessage['role'],
//     content: '',
//     createdAt: new Date(message.createdAt),
//     experimental_attachments: (message.attachments as Attachment[]) ?? [],
//   }))
// }

export const useChatbarLoader = ({ chatId }: { chatId?: string }) => {
  const user = useAppStore().session.user
  const theme = useThemeStore().theme
  const setTheme = useThemeStore().setTheme
  const isMobile = useIsMobile()

  const { data, isLoading } = useSWR(
    chatId ? `${AI_SERVER_ROOT_PATH}/llm/message/queryByChatId?chatId=${chatId}` : null,
    async (input: string, init?: RequestInit) => fetcher<BizResult<DBMessage[]>>(input, init).then((res) => res.data),
  )
  const loaderData: ChatbarProps & Omit<ChatLoaderData, 'initialMessages'> = {
    id: chatId ?? uuidv4(),
    initialMessages: Array.isArray(data) ? convertToUIMessages(data) : [],
    user,
    theme,
    setTheme,
    isReadonly: false,
    resizeable: !isMobile,
    error: !!(chatId && !isLoading && !Array.isArray(data)),
    useChatOptions: {
      api: `${AI_SERVER_ROOT_PATH}/llm/chat`,
      fetch: (input, init) => fetcher(input, { ...init, response: true }),
    },
    onDownloadCode: async (params) => downloadCode(params),
  }
  return loaderData
}
