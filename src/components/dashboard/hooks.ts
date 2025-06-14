import { AnalyzeResultSchema } from '@ai-dashboard/common/utils'
import type { UIMessage } from 'ai'
import { useMemo } from 'react'

const createDashboardToolName = 'generateDashboardsBasedOnDataAnalysisResults'

export const useProgressCard = ({ message }: { message: UIMessage }) => {
  return useMemo(() => {
    return message.parts.reduce(
      (prev, part, index) => {
        if (part.type === 'tool-invocation' && part.toolInvocation.state === 'result') {
          if (part.toolInvocation.result.progress) {
            prev.progress = part.toolInvocation.result.progress
            if (
              part.toolInvocation.result.state === 'end' &&
              part.toolInvocation.toolName === createDashboardToolName
            ) {
              prev.dashboardInfo = {
                title: part.toolInvocation.result.title,
                description: part.toolInvocation.result.description,
              }
            }
          }
        }
        if (
          index === message.parts.length - 1 &&
          prev.progress &&
          prev.progress.current === prev.progress.total &&
          !prev.dashboardInfo
        ) {
          prev.progress.current = prev.progress.total - 1
        }
        return prev
      },
      {
        createDashboardToolName,
      } as {
        progress?: AnalyzeResultSchema['progress']
        dashboardInfo?: { title: string; description: string }
        createDashboardToolName: string
      },
    )
  }, [message.parts])
}
