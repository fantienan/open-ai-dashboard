import { ProgressCard, useProgressCard } from '@/components/dashboard'
import { DeepseekIcon, PencilEditIcon } from '@/components/icons'
import { Markdown } from '@/components/markdown'
import { PreviewAttachment } from '@/components/preview-attachment'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { AnalyzeResultSchema, Vote } from '@/types'
import { UseChatHelpers } from '@ai-sdk/react'
import type { ToolResult, UIMessage } from 'ai'
import cx from 'classnames'
import equal from 'fast-deep-equal'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useState } from 'react'
import { Analyze } from '../analyze'
import { MessageActions } from './message-actions'
import { MessageEditor } from './message-editor'
import { MessageReasoning } from './message-reasoning'

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  stop,
}: {
  stop: () => void
  chatId: string
  message: UIMessage
  vote: Vote | undefined
  isLoading: boolean
  setMessages: UseChatHelpers['setMessages']
  reload: UseChatHelpers['reload']
  isReadonly: boolean
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const { progress, dashboardInfo, createDashboardToolName } = useProgressCard({ message })

  const generatingDashboard = (params: ToolResult<string, string, any>) => {
    const toolResult = params as Pick<AnalyzeResultSchema, 'whoCalled' | 'id'> & Record<string, any>
    return toolResult.whoCalled === createDashboardToolName && toolResult.id
  }

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <DeepseekIcon size={28} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 flex-1">
            {!!message.experimental_attachments?.length && (
              <div data-testid={`message-attachments`} className="flex flex-row justify-end gap-2">
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment key={attachment.url} attachment={attachment} />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part
              const key = `message-${message.id}-part-${index}`

              if (type === 'reasoning') {
                return <MessageReasoning key={key} isLoading={isLoading} reasoning={part.reasoning} />
              }

              if (type === 'text') {
                if (mode === 'view' && !!part.text.trim()) {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit')
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>编辑消息</TooltipContent>
                        </Tooltip>
                      )}
                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4 overflow-hidden', {
                          'bg-primary text-primary-foreground px-3 py-2 rounded-xl': message.role === 'user',
                        })}
                      >
                        <Markdown inline={message.role === 'user'}>{part.text}</Markdown>
                      </div>
                    </div>
                  )
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  )
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part
                const { toolName, toolCallId, state, args } = toolInvocation
                const isGeneratingDashboard = generatingDashboard(args)

                if (isGeneratingDashboard && toolName !== createDashboardToolName) return null

                let node: React.ReactNode = null

                if (state === 'call') {
                  if (toolName === 'sqliteAnalyze') {
                    node = <Analyze />
                  } else if (toolName === createDashboardToolName) {
                    // node = <ProgressCard onStop={() => stop()} />
                  }
                  return (
                    !!node && (
                      <div key={toolCallId} className={cx({ skeleton: ['sqliteAnalyze'].includes(toolName) })}>
                        {node}
                      </div>
                    )
                  )
                }

                if (state === 'result') {
                  const { result } = toolInvocation
                  if (toolName === 'sqliteAnalyze') {
                    node = <Analyze chartRendererProps={result} />
                  } else if (toolName === createDashboardToolName) {
                    node =
                      result.state === 'start' ? (
                        <ProgressCard
                          chatId={chatId}
                          messageId={message.id}
                          progress={progress}
                          dashboardInfo={dashboardInfo}
                          onStop={stop}
                        />
                      ) : null
                  }
                  return node && <div key={toolCallId}>{node}</div>
                }
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export const PreviewMessage = memo(PurePreviewMessage, (prevProps, nextProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false
  if (prevProps.message.id !== nextProps.message.id) return false
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false
  if (!equal(prevProps.vote, nextProps.vote)) return false

  return true
})

export const ThinkingMessage = () => {
  const role = 'assistant'

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <DeepseekIcon size={28} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">唔...</div>
        </div>
      </div>
    </motion.div>
  )
}
