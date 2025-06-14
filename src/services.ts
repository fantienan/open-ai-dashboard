import type { DownloadCodeParams } from '@/types'
import { fetcher } from '@/utils'
import { contentDisposition } from '@ai-dashboard/common/utils'
import { saveAs } from 'file-saver-es'
import { AI_SERVER_ROOT_PATH, WEB_SERVER_ROOT_PATH } from './lib/constant'
import type { Chat, User } from './types'

// Define a simple interface for the updateChatVisibility parameters
interface UpdateChatVisibilityParams {
  id: string
  visibility: 'public' | 'private'
}

export async function updateChatVisibility(params: UpdateChatVisibilityParams) {
  return fetcher<Chat>(`${AI_SERVER_ROOT_PATH}/llm/chat/update`, { method: 'POST', body: JSON.stringify(params) })
}

export async function getUserInfo() {
  return fetcher<User>(`${WEB_SERVER_ROOT_PATH}/user/find`)
}

export const downloadCode = async (params: DownloadCodeParams) => {
  const res = await fetcher(`${WEB_SERVER_ROOT_PATH}/download/code`, {
    method: 'POST',
    response: true,
    body: JSON.stringify({
      chat_id: params.chatId,
      message_id: params.messageId,
    }),
  })
  if (!res.body) return '下载失败'

  if (res.headers.has('content-disposition')) {
    const { type, parameters } = contentDisposition.parse(res.headers.get('content-disposition')!) ?? {}
    const fileName = type === 'attachment' ? parameters?.filename : `${params.chatId}-${params.messageId}.zip`
    saveAs(await res.blob(), fileName)
  }
}
