import 'ol/ol.css'
import Map, { MapOptions } from 'ol/Map'

export type OpenlayersRendererOptions = MapOptions & {
  dispatch: ({ map }: { map: OpenlayersRendererInstance }) => void
}

export type OpenlayersRendererInstance = InstanceType<typeof OpenlayersRenderer>

const defaultMapOptions: MapOptions = {}

export class OpenlayersRenderer extends Map {
  constructor({ dispatch, ...resetOptions }: OpenlayersRendererOptions) {
    const options = { ...defaultMapOptions, ...resetOptions }
    super(options)
  }
}
