import { MapboxRenderer, type MapboxRendererOptions } from './mapbox'
import { MaplibreRenderer, type MaplibreRendererOptions } from './maplibre'
import { OpenlayersRenderer, OpenlayersRendererOptions } from './openlayers'

export type MapRendererInstance = InstanceType<typeof MapRenderer>

export type MapRendererOptionsWithMapbox = MapboxRendererOptions

export type MapRendererOptionsWithMaplibre = MaplibreRendererOptions

export type MapRendererOptionsWithOpenlayers = OpenlayersRendererOptions

export type MapRendererOptions = {
  container: HTMLElement | string
  dispatch: ({ map }: { map: any }) => void
} & (
  | {
      mapRendererType: 'mapbox'
      mapOptions?: Omit<MapRendererOptionsWithMapbox, 'dispatch'>
    }
  | {
      mapRendererType: 'maplibre'
      mapOptions?: Omit<MapRendererOptionsWithMaplibre, 'dispatch'>
    }
  | {
      mapRendererType: 'openlayers'
      mapOptions?: Omit<MapRendererOptionsWithOpenlayers, 'dispatch'>
    }
)

export class MapRenderer {
  map: any
  constructor({ mapRendererType, dispatch, container, mapOptions }: MapRendererOptions) {
    const _dispatch: MapRendererOptions['dispatch'] = (params) => {
      dispatch(params)
    }
    if (mapRendererType === 'mapbox') {
      this.map = new MapboxRenderer({ container, dispatch: _dispatch, ...mapOptions })
    } else if (mapRendererType === 'maplibre') {
      this.map = new MaplibreRenderer({ container, dispatch: _dispatch, ...mapOptions })
    } else if (mapRendererType === 'openlayers') {
      this.map = new OpenlayersRenderer({ target: container, dispatch: _dispatch, ...mapOptions })
    } else {
      throw new Error('Invalid map renderer type')
    }
  }
}
