import 'mapbox-gl/dist/mapbox-gl.css'
import { logger } from '@/utils'
import { Map, MapOptions } from 'mapbox-gl'
import { interceptRequest } from './utils'

export type MapboxRendererOptions = MapOptions & {
  dispatch: ({ map }: { map: MapboxRendererInstance }) => void
}

export type MapboxRendererInstance = InstanceType<typeof MapboxRenderer>

const defaultMapOptions: MapOptions = {
  container: 'map',
  accessToken: import.meta.env.BIZ_MAPBOX_ACCESS_TOKEN,
  center: [112.32716994959941, 32.8823769011904],
  projection: { name: 'globe' },
  preserveDrawingBuffer: true,
  pitch: 0,
  bearing: 0,
  zoom: 6,
  style: `/map-style/style.json?t=${Date.now()}`,
}

export class MapboxRenderer extends Map {
  constructor({ dispatch, ...resetOptions }: MapboxRendererOptions) {
    const options = { ...defaultMapOptions, ...resetOptions }
    options.container
    interceptRequest(`access_token=${options.accessToken}`)
    super(options)
    this.on('style.load', () => {
      //   this.setProjection({ type: 'globe' })
      //   this.resize()
      dispatch({ map: this })
    })

    this.on('error', (e) => {
      logger('MapKit Error:', e)
    })
  }
}
