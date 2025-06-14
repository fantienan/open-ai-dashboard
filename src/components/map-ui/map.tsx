import { useSyncReference } from '@/hooks/use-sync-reference'
import { useEffect, useRef } from 'react'
import { MapRenderer, MapRendererOptions } from '../map-renderer'

export const Map = (props: Pick<MapRendererOptions, 'dispatch'>) => {
  const divRef = useRef<HTMLDivElement>(null)
  const dispatchRef = useSyncReference(props.dispatch)
  useEffect(() => {
    new MapRenderer({
      dispatch: (params) => dispatchRef.current(params),
      mapRendererType: 'mapbox',
      container: divRef.current!,
    })
  }, [])
  return (
    <>
      <div className="min-h-svh w-full" ref={divRef} />
    </>
  )
}
