import type { AnalyzeResultSchema } from '@ai-dashboard/common/types'
import { Chart, type G2Spec } from '@antv/g2'
import clsx from 'clsx'
import { useEffect, useRef } from 'react'

export type ChartViewProps = Omit<AnalyzeResultSchema, 'chartRendererType' | 'data'> & {
  prefixCls?: string
  className?: string
  style?: React.CSSProperties
  spec: Partial<G2Spec>
}

export const G2Chart: React.FC<ChartViewProps> = ({
  prefixCls = 'g2chart',
  className,
  style,
  spec,
  title,
  ...restProps
}) => {
  const compClassName = clsx(`${prefixCls}`, className)
  const chartRef = useRef<HTMLDivElement>(null)

  const height = style?.height || 200
  const width = style?.width || '100%'

  useEffect(() => {
    if (chartRef.current && spec) {
      const chart = new Chart({
        container: chartRef.current,
        autoFit: true,
        height: 200,
      })
      chart.options(spec)
      chart.render()
    }
  }, [spec])

  return (
    <div
      {...restProps}
      title={title.value}
      className={compClassName}
      ref={chartRef}
      style={{ width, height, margin: 'auto' }}
    />
  )
}
