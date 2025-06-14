import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { logger } from '@/utils'
import { UseChatHelpers } from '@ai-sdk/react'
import { Message } from 'ai'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'

const deleteTrailingMessages = async (message: { id: string }) => {
  logger(message)
}

export type MessageEditorProps = {
  message: Message
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>
  setMessages: UseChatHelpers['setMessages']
  reload: UseChatHelpers['reload']
}

export function MessageEditor({ message, setMode, setMessages, reload }: MessageEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const [draftContent, setDraftContent] = useState<string>(() => {
    if (message.parts?.length) {
      return message.parts.reduce((prev, curr) => {
        if (curr.type === 'text') return prev + curr.text
        return prev
      }, '')
    }
    return message.content
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight()
    }
  }, [])

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`
    }
  }

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value)
    adjustHeight()
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        data-testid="message-editor"
        ref={textareaRef}
        className="bg-transparent outline-none overflow-hidden resize-none !text-base rounded-xl w-full"
        value={draftContent}
        onChange={handleInput}
      />

      <div className="flex flex-row gap-2 justify-end">
        <Button
          variant="outline"
          className="h-fit py-2 px-3"
          onClick={() => {
            setMode('view')
          }}
        >
          取消
        </Button>
        <Button
          data-testid="message-editor-send-button"
          variant="default"
          className="h-fit py-2 px-3"
          disabled={isSubmitting}
          onClick={async () => {
            setIsSubmitting(true)

            await deleteTrailingMessages({ id: message.id })

            setMessages((messages) => {
              const index = messages.findIndex((m) => m.id === message.id)

              if (index !== -1) {
                const updatedMessage = {
                  ...message,
                  content: draftContent,
                  parts: [{ type: 'text', text: draftContent }],
                }

                return [...messages.slice(0, index), updatedMessage] as Message[]
              }

              return messages
            })

            setMode('view')
            reload()
          }}
        >
          {isSubmitting ? 'Sending...' : '发送'}
        </Button>
      </div>
    </div>
  )
}
