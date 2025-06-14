import { Badge } from '@/components/ui/badge'
import { CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChartConfig } from '@/components/ui/chart'
import { AnalyzeResultSchema } from '@ai-dashboard/common/utils'
import { useMemo } from 'react'

export const useChartUtils = ({ config, data }: { config?: ChartConfig; data: Record<string, any>[] }) => {
  return useMemo(() => {
    return Object.keys(data[0]).reduce(
      (prev, key) => {
        const value = data[0][key]
        if (Number.isFinite(value)) {
          prev.valueFieldnames.push(key)
          prev.chartConfig[key] = {
            color: `hsl(var(--chart-${prev.valueFieldnames.length}))`,
          }
        } else {
          prev.nameFieldnames.push(key)
        }
        return prev
      },
      { nameFieldnames: [], valueFieldnames: [], chartConfig: { ...config } } as {
        chartConfig: ChartConfig
        nameFieldnames: string[]
        valueFieldnames: string[]
      },
    )
  }, [data, config])
}

export const CardHeaderRenderer = ({ prefix, suffix, description, value }: AnalyzeResultSchema['title']) => {
  return (
    <CardHeader>
      {prefix && (
        <div className="absolute right-4 top-4">
          <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
            {prefix}
          </Badge>
        </div>
      )}
      {description && <CardDescription>{description}</CardDescription>}
      {value !== undefined && <CardTitle className="text-lg">{value}</CardTitle>}
      {suffix && (
        <div className="absolute right-4 top-4">
          <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
            {suffix}
          </Badge>
        </div>
      )}
    </CardHeader>
  )
}
export const CardFooterRenderer = ({ description, value }: Required<AnalyzeResultSchema>['footer']) => {
  return (
    <CardFooter className="flex-col items-start gap-1 text-sm">
      <div className="line-clamp-1 flex gap-2 font-medium">{value}</div>
      {description && <CardDescription>{description}</CardDescription>}
    </CardFooter>
  )
}
