import { Messages } from '@/components/messages'
import { MultimodalInput } from '@/components/multimodal-input'
import { AI_SERVER_ROOT_PATH } from '@/lib/constant'
import { Vote } from '@/types'
import { fetcher } from '@/utils'
import { useChat } from '@ai-sdk/react'
import { Attachment, UIMessage } from 'ai'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR, { useSWRConfig } from 'swr'
import { unstable_serialize } from 'swr/infinite'
import { v4 as uuidv4 } from 'uuid'
import { Artifact } from '../artifact'
import { getChatHistoryPaginationKey } from '../sidebar-history'
import { ChatHeader } from './chat-header'
import { useChatbar } from './chat-provider'
import { ChatSetting } from './chat-setting'

export interface ChatProps {
  id: string
  initialMessages: UIMessage[]
  isReadonly: boolean
}

export function Chat({ id, initialMessages, isReadonly }: ChatProps) {
  const { useChatOptions } = useChatbar()
  const { mutate } = useSWRConfig()
  const { messages, setMessages, handleSubmit, input, setInput, append, status, stop, reload } = useChat({
    id,
    body: { id },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: uuidv4,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey))
    },
    onError: () => {
      toast.error('发生错误，请重试！')
    },
    ...useChatOptions,
  })
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `${AI_SERVER_ROOT_PATH}/llm/vote?chatId=${id}` : null,
    async (input: string, init?: RequestInit) => fetcher<Vote[]>(input, init).then((res) => res.data ?? []),
  )
  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader />
        <Messages
          chatId={id}
          status={status}
          votes={votes ?? []}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          stop={stop}
        />
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />

      <ChatSetting />
    </>
  )
}
