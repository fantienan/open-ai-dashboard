import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AI_SERVER_BASE_URL, AI_SERVER_ROOT_PATH } from '@/lib/constant'
import type { Vote } from '@/types'
import { fetcher } from '@/utils'
import type { Message } from 'ai'
import equal from 'fast-deep-equal'
import { memo } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { useCopyToClipboard } from 'usehooks-ts'

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
}: {
  chatId: string
  message: Message
  vote: Vote | undefined
  isLoading: boolean
}) {
  const { mutate } = useSWRConfig()
  const [, copyToClipboard] = useCopyToClipboard()

  if (isLoading) return null
  if (message.role === 'user') return null

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async () => {
                const textFromParts = message.parts
                  ?.filter((part) => part.type === 'text')
                  .map((part) => part.text)
                  .join('\n')
                  .trim()

                if (!textFromParts) {
                  toast.error('没有要复制的文本！')
                  return
                }

                await copyToClipboard(textFromParts)
                toast.success('已复制到剪贴板！')
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>复制</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-upvote"
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              disabled={vote?.isUpvoted}
              variant="outline"
              onClick={async () => {
                const upvote = fetcher(`${AI_SERVER_ROOT_PATH}/llm/vote?chatId=${chatId}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ chatId, messageId: message.id, isUpvoted: true }),
                })

                toast.promise(upvote, {
                  loading: '点赞回复...',
                  success: () => {
                    mutate<Vote[]>(
                      `${AI_SERVER_BASE_URL}/llm/vote?chatId=${chatId}`,
                      (currentVotes) => {
                        if (!currentVotes) return []

                        const votesWithoutCurrent = currentVotes.filter((vote) => vote.messageId !== message.id)

                        return [
                          ...votesWithoutCurrent,
                          {
                            chatId,
                            messageId: message.id,
                            isUpvoted: true,
                          },
                        ]
                      },
                      { revalidate: false },
                    )

                    return '赞同的回应！'
                  },
                  error: '未能赞同回复',
                })
              }}
            >
              <ThumbUpIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>点赞回复</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-downvote"
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              variant="outline"
              disabled={vote && !vote.isUpvoted}
              onClick={async () => {
                const downvote = fetcher(`${AI_SERVER_ROOT_PATH}/llm/vote?chatId=${chatId}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ chatId, messageId: message.id, isUpvoted: false }),
                })

                toast.promise(downvote, {
                  loading: '反对回应...',
                  success: () => {
                    mutate<Vote[]>(
                      `${AI_SERVER_BASE_URL}/llm/vote?chatId=${chatId}`,
                      (currentVotes) => {
                        if (!currentVotes) return []

                        const votesWithoutCurrent = currentVotes.filter((vote) => vote.messageId !== message.id)

                        return [
                          ...votesWithoutCurrent,
                          {
                            chatId,
                            messageId: message.id,
                            isUpvoted: false,
                          },
                        ]
                      },
                      { revalidate: false },
                    )

                    return '被否决的回应！'
                  },
                  error: '无法否决回应。',
                })
              }}
            >
              <ThumbDownIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>反对回应</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

export const MessageActions = memo(PureMessageActions, (prevProps, nextProps) => {
  if (!equal(prevProps.vote, nextProps.vote)) return false
  if (prevProps.isLoading !== nextProps.isLoading) return false
  return true
})
