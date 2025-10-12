import { useEffect, useState } from 'react'

export interface Destination {
  name: string
  coordinates: [number, number][] // For LineStrings, an array of lat/lng
  type: 'Point' | 'LineString'
}

export function useDestinationsFromKML(kmlPath: string): Destination[] {
  const [destinations, setDestinations] = useState<Destination[]>([])

  useEffect(() => {
    const fetchKML = async () => {
      try {
        const res = await fetch(kmlPath)
        const text = await res.text()
        const parser = new DOMParser()
        const kmlDoc = parser.parseFromString(text, 'application/xml')
        const placemarks = Array.from(kmlDoc.getElementsByTagName('Placemark'))

        const lines: Destination[] = placemarks
          .map(pm => {
            const nameEl = pm.getElementsByTagName('name')[0]
            const name = nameEl?.textContent || 'Unnamed'

            const lineEl = pm.getElementsByTagName('LineString')[0]
            if (!lineEl) return null // skip non-LineString

            const coordsEl = lineEl.getElementsByTagName('coordinates')[0]
            if (!coordsEl) return null

            const coords: [number, number][] = coordsEl.textContent
              ?.trim()
              .split(/\s+/)
              .map(pair => {
                const [lon, lat] = pair.split(',').map(Number)
                return [lat, lon] as [number, number]
              }) || []

            if (coords.length === 0) return null

            return { name, coordinates: coords, type: 'LineString' } as Destination
          })
          .filter((d): d is Destination => d !== null)

        setDestinations(lines)
      } catch (e) {
        console.error('Failed to load KML', e)
      }
    }

    fetchKML()
  }, [kmlPath])

  return destinations
}
