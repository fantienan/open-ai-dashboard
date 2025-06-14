import type { AnalyzeResultSchema } from '@ai-dashboard/common/types'
import { IndicatorCard } from './indicator-card'
// import { List } from './list'
import { Recharts } from './recharts'
import { DataTable } from './table'

export type ChartRendererProps = AnalyzeResultSchema & { className?: string }

export const ChartRenderer = (props: ChartRendererProps) => {
  if (!props) return null

  if (props.chartType === 'indicator-card') return <IndicatorCard {...props} className="gap-3" />

  //   if (props.chartType === 'list') return <List {...props} />

  if (props.chartType === 'table') return <DataTable {...props} />

  return <Recharts {...props} />
}
