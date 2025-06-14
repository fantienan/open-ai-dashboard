import { StopIcon } from '@/components/icons'
import { Button, ButtonProps } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AnalyzeResultSchema } from '@ai-dashboard/common/utils'
import classNames from 'classnames'
import equal from 'fast-deep-equal'
import { memo } from 'react'
import { DashboardActions } from './dashboard-actions'

export const PureProgressCard = ({
  className,
  progress,
  dashboardInfo,
  onStop,
  chatId,
  messageId,
}: Pick<React.ComponentProps<'div'>, 'className'> &
  Pick<AnalyzeResultSchema, 'progress'> & {
    onStop?: ButtonProps['onClick']
    dashboardInfo?: { title: string; description: string }
    chatId: string
    messageId: string
  }) => {
  const { current = 0, total = 100, description } = progress ?? {}
  const isFinished = current === total

  return (
    <Card className={classNames(`max-w-[340px] w-full py-4`, className)}>
      {isFinished ? (
        <CardContent className="flex items-center gap-4">
          {dashboardInfo ? (
            <div className="flex flex-col gap-1 flex-1">
              <CardTitle>{dashboardInfo.title}</CardTitle>
              <CardDescription>{dashboardInfo.description}</CardDescription>
            </div>
          ) : (
            <CardDescription>仪表盘生成完毕</CardDescription>
          )}
          <DashboardActions chatId={chatId} messageId={messageId} showPreview />
        </CardContent>
      ) : (
        <CardContent className="flex flex-col gap-2">
          <CardDescription className="flex gap-1">
            <div className="flex-1">{description}</div>
            {!!current && (
              <div className="text-blue-500 ">
                {current}/{total}
              </div>
            )}
          </CardDescription>
          <div className="flex gap-4 w-full items-center">
            <Progress className={classNames('w-full', { 'animate-pulse': !current })} value={(current / total) * 100} />
            <Button
              data-testid="stop-button"
              className="rounded-full w-7 h-7 border dark:border-zinc-600"
              size="icon"
              onClick={onStop}
            >
              <StopIcon size={10} />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export const ProgressCard = memo(PureProgressCard, (prevProps, nextProps) => {
  if (prevProps.className !== nextProps.className) return false
  if (prevProps.onStop !== nextProps.onStop) return false
  if (prevProps.chatId !== nextProps.chatId) return false
  if (prevProps.messageId !== nextProps.messageId) return false
  if (!equal(prevProps.progress, nextProps.progress)) return false
  if (!equal(prevProps.dashboardInfo, nextProps.dashboardInfo)) return false
  return true
})
