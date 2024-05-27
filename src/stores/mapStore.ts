import { useLocalStorage } from '@vueuse/core'

type Marker = {
  latitude: number
  longitude: number
}

export const mcMarker = useLocalStorage<Marker>('USER_MARKER', {
  latitude: 41.49841,
  longitude: 1.89575
})

export const nearbyMarkers = useLocalStorage<Marker[]>('NEARBY_MARKERS', [])
