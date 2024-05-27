import { useLocalStorage } from '@vueuse/core'

interface Marker {
  latitude: number
  longitude: number
}

export const mcMarker = useLocalStorage<Marker>('MC_MARKER', {
  latitude: 41.479388,
  longitude: 1.925974
})

export const nearbyMarkers = useLocalStorage<Marker[]>('NEARBY_MARKERS', [])
