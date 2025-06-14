import { Card } from '@/components/ui/card'
import type { AnalyzeResultSchema } from '@ai-dashboard/common/types'
import equal from 'fast-deep-equal'
import { memo } from 'react'
import { CardFooterRenderer, CardHeaderRenderer, useChartUtils } from '../utils'

export type IndicatorCardProps = Omit<AnalyzeResultSchema, 'chartType'> & { className?: string }

const PureIndicatorCard = ({ title, data, footer, className }: IndicatorCardProps) => {
  const { valueFieldnames } = useChartUtils({ data })
  return (
    <Card className={className}>
      <CardHeaderRenderer {...title} value={data[0][valueFieldnames[0]]} />
      {!!footer && <CardFooterRenderer {...footer} description="" />}
    </Card>
  )
}

export const IndicatorCard = memo(PureIndicatorCard, (prevProps, nextProps) => {
  if (!equal(prevProps.title, nextProps.title)) return false
  if (!equal(prevProps.data, nextProps.data)) return false
  if (!equal(prevProps.footer, nextProps.footer)) return false
  if (prevProps.className !== nextProps.className) return false
  return true
})

const PureIndicatorCards = ({ configs, className }: { configs: IndicatorCardProps[]; className?: string }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {configs.map((config) => (
        <IndicatorCard key={config.title.value} {...config} className={className} />
      ))}
    </div>
  )
}

export const IndicatorCards = memo(PureIndicatorCards, (prevProps, nextProps) => {
  if (prevProps.configs !== nextProps.configs) return false
  if (prevProps.className !== nextProps.className) return false
  return true
})
