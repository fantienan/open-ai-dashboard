import { fetcher } from '@/utils'
import type { AnalyzeResultSchema, DashboardSchema } from '@ai-dashboard/common/types'
import { Loader2 } from 'lucide-react'
import { memo, useMemo } from 'react'
import useSWR from 'swr'
import { ChartRenderer } from '../chart'
import { IndicatorCards } from '../chart/indicator-card'

const defaultDashboardSchema: DashboardSchema = {
  title: { value: 'Dashboard', description: '' },
  charts: [],
}

export function PureDashboard() {
  const { data, isLoading } = useSWR<DashboardSchema | null | undefined>('/dashboard.json', fetcher, {
    fallbackData: defaultDashboardSchema,
  })

  const chartInfo = useMemo(() => {
    if (!data) return

    return data.charts.reduce(
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
        title: data.title.value,
        description: data.title.description,
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
      <div className="p-2 flex flex-col justify-between items-center gap-1">
        <div className="font-medium">{chartInfo.title}</div>
        <div className="text-muted-foreground text-sm">{chartInfo.description}</div>
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

export const Dashboard = memo(PureDashboard)
