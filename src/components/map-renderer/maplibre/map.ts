import 'maplibre-gl/dist/maplibre-gl.css'
import { Map, type MapOptions } from 'maplibre-gl'

export type MaplibreRendererOptions = MapOptions & {
  dispatch: ({ map }: { map: MaplibreRendererInstance }) => void
}

export type MaplibreRendererInstance = InstanceType<typeof MaplibreRenderer>

const defaultMapOptions: MapOptions = {
  container: 'map',
  center: [112.32716994959941, 32.8823769011904],
  pitch: 0,
  bearing: 0,
  zoom: 6,
  style: `/map-style/style.json?t=${Date.now()}`,
}

export class MaplibreRenderer extends Map {
  constructor({ dispatch, ...resetOptions }: MaplibreRendererOptions) {
    const options = { ...defaultMapOptions, ...resetOptions }
    super(options)
    this.on('style.load', () => {
      this.setProjection({ type: 'globe' })
      dispatch({ map: this })
    })

    this.on('error', (e) => {
      console.error('MaplibreRenderer Error:', e)
    })
  }
}
