import { WEB_SERVER_ROOT_PATH } from '@/lib/constant'
import type { DownloadCodeParams } from '@/types'
import { contentDisposition } from '@ai-dashboard/common/utils'
import { saveAs } from 'file-saver-es'
import { fetcher } from './fetcher'

const downloadCode = async (params: DownloadCodeParams) => {
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

export const tauri = {
  downloadCode,
}
