import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import * as toGeoJSON from 'togeojson'
import { useParams } from '@tanstack/react-router'
import 'leaflet/dist/leaflet.css'

// Fix default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface KMLFeature {
  type: 'Point' | 'LineString'
  coordinates: number[] | number[][]
  properties: { name?: string; description?: string }
}

// Helper: normalize a string to compare destination names
const normalizeName = (name: string) =>
  name.toLowerCase().replace(/[\s-_]+/g, '') // remove spaces, dashes, underscores

export default function KMLSatelliteMap() {
  const { destination } = useParams({ from: '/destinations/$destination' })
  const [features, setFeatures] = useState<KMLFeature[]>([])

  // Load KML once
  useEffect(() => {
    fetch('/kml/routes.kml')
      .then((res) => res.text())
      .then((kmlText) => {
        const parser = new DOMParser()
        const kmlDom = parser.parseFromString(kmlText, 'text/xml')
        const geojson = toGeoJSON.kml(kmlDom)

        const extracted = geojson.features.map((f: any) => ({
          type: f.geometry.type,
          coordinates: f.geometry.coordinates,
          properties: f.properties,
        }))

        setFeatures(extracted)
      })
      .catch(console.error)
  }, [])

  // Normalize destination param
  const normalizedDest = normalizeName(destination)

  // Filter points and lines based on normalized name
  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      const name = f.properties?.name || ''
      const normalizedName = normalizeName(name)

      // Points: include if normalized name contains destination
      if (f.type === 'Point') return normalizedName.includes(normalizedDest)

      // Lines: include if normalized name contains destination
      if (f.type === 'LineString') return normalizedName.includes(normalizedDest)

      return false
    })
  }, [features, normalizedDest])

  // Default map center
  const center: [number, number] = [58.25, 22.48]

  // Compute bounds
  const bounds = L.latLngBounds(
    filteredFeatures.flatMap((f) =>
      f.type === 'Point'
        ? [(f.coordinates as number[]).slice(1, 3) as [number, number]]
        : (f.coordinates as number[][]).map((c) => [c[1], c[0]])
    )
  )

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '60vh', width: '100%' }}
      bounds={filteredFeatures.length ? bounds : undefined}
      scrollWheelZoom
    >
      {/* Satellite layer only */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics"
      />

      {/* Points */}
      {filteredFeatures
        .filter((f) => f.type === 'Point')
        .map((f, i) => (
          <Marker
            key={i}
            position={(f.coordinates as number[]).slice(1, 3) as [number, number]}
          >
            <Popup>{f.properties.name || 'Point'}</Popup>
          </Marker>
        ))}

      {/* Lines */}
      {filteredFeatures
        .filter((f) => f.type === 'LineString')
        .map((f, i) => (
          <Polyline
            key={i}
            positions={(f.coordinates as number[][]).map((c) => [c[1], c[0]])}
            color="red"
            weight={4}
          />
        ))}
    </MapContainer>
  )
}
