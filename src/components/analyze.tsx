import equal from 'fast-deep-equal'
import { memo } from 'react'
import { ChartRenderer, ChartRendererProps } from './chart'

function PureAnalyze({ chartRendererProps }: { chartRendererProps?: ChartRendererProps }) {
  return chartRendererProps?.data ? <ChartRenderer {...chartRendererProps} /> : null
}

export const Analyze = memo(PureAnalyze, (prevProps, nextProps) => {
  if (!equal(prevProps.chartRendererProps, nextProps.chartRendererProps)) return false
  return true
})
