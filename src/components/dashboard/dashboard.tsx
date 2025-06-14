import { AI_SERVER_ROOT_PATH } from '@/lib/constant'
import type { AnalyzeResultSchema, DashboardRecord } from '@/types'
import { fetcher } from '@/utils'
import { Loader2 } from 'lucide-react'
import React, { memo, useMemo } from 'react'
import useSWR from 'swr'
import { ChartRenderer } from '../chart'
import { IndicatorCards } from '../chart/indicator-card'
import { DashboardActions } from './dashboard-actions'

export interface DashboardProps {
  chatId: string
  messageId: string
  prefixNode?: React.ReactNode
}

export function PureDashboard({ chatId, messageId, prefixNode = null }: DashboardProps) {
  const { data, isLoading } = useSWR(
    () => (chatId && messageId ? `${AI_SERVER_ROOT_PATH}/llm/dashboard/query` : null),
    async (input: string, init?: RequestInit) => {
      return fetcher<DashboardRecord>(input, {
        ...init,
        method: 'POST',
        body: JSON.stringify({ chatId, messageId }),
      }).then((res) => {
        if (typeof res.data?.data === 'string') res.data.data = JSON.parse(res.data.data as any)
        return res.data
      })
    },
  )
  const chartInfo = useMemo(() => {
    if (!data?.data?.charts) return

    return data.data.charts.reduce(
      (prev, curr) => {
        if (curr.chartType === 'indicator-card') {
          prev.indicatorCards.push(curr)
        } else if (curr.data.length >= 50) {
          prev.blockChart.push(curr)
        } else if (curr.chartType === 'table') {
          prev.table.push(curr)
        } else {
          prev.charts.push(curr)
        }
        return prev
      },
      {
        indicatorCards: [],
        charts: [],
        blockChart: [],
        table: [],
        title: data.data.title.value,
        description: data.data.title.description,
      } as {
        indicatorCards: AnalyzeResultSchema[]
        blockChart: AnalyzeResultSchema[]
        charts: AnalyzeResultSchema[]
        table: AnalyzeResultSchema[]
        title: string
        description: string
      },
    )
  }, [data])
  if (isLoading || !chartInfo) return <Loader2 size="16" className="animate-spin" />

  return (
    <div className="flex flex-col gap-4 w-full p-2">
      <div className="p-2 flex flex-row justify-between items-center gap-4">
        {prefixNode}
        <div className="flex flex-col gap-1">
          <div className="font-medium">{chartInfo.title}</div>
          <div className="text-muted-foreground text-sm">{chartInfo.description}</div>
        </div>
        <div className="flex-1 text-right">
          <DashboardActions
            type="label-icon"
            showDownload
            showShare
            chatId={chatId}
            messageId={messageId}
            title={chartInfo.title}
          />
        </div>
      </div>
      <IndicatorCards configs={chartInfo.indicatorCards} className="gap-3 py-4" />
      {chartInfo.blockChart.map((chart, index) => (
        <ChartRenderer className="h-18" key={index} {...chart} />
      ))}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {chartInfo.charts.map((chart, index) => (
          <ChartRenderer {...chart} key={index} />
        ))}
      </div>
      {chartInfo.table.map((chart, index) => (
        <ChartRenderer className="h-20" key={index} {...chart} />
      ))}
    </div>
  )
}

export const Dashboard = memo(PureDashboard, (prevProps, nextProps) => {
  if (prevProps.chatId !== nextProps.chatId) return false
  if (prevProps.messageId !== nextProps.messageId) return false
  return true
})
