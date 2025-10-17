import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip } from 'react-leaflet'
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

// --- CONFIG ---
const DEBUG_MATCHING = false // set true to see detailed logs

// Words that are too generic to match meaningfully
const STOPWORDS = new Set([
  'bussijaam',
  'buss',
  'peatus',
  'kontor',
  'jaam',
  'stop',
  'busstop',
  'takso',
  'peatused',
  'maja',
  'st',
  'stopi',
  'koht',
])

// Town or region names to ignore for matching
const CITYNAMES = new Set([
  'kuressaare',
  'saaremaa',
  'tallinn',
  'tartu',
])

function normalizeStr(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function tokensFromName(s: string) {
  const normalized = normalizeStr(s)
  return normalized
    .split(/\s+/)
    .filter(
      (t) => t.length > 1 && !STOPWORDS.has(t) && !CITYNAMES.has(t)
    )
}

function namesStrongMatch(featureName?: string, destinationName?: string): boolean {
  if (!featureName || !destinationName) return false

  const fTokens = tokensFromName(featureName)
  const dTokens = tokensFromName(destinationName)

  // Require at least one *specific* (non-stopword) token in common
  const intersection = dTokens.filter((t) => fTokens.includes(t))
  if (intersection.length > 0) return true

  // fallback: normalized substring match (helps for small differences)
  const nf = normalizeStr(featureName).replace(/\s+/g, '')
  const nd = normalizeStr(destinationName).replace(/\s+/g, '')
  return nf.includes(nd) || nd.includes(nf)
}


export default function KMLSatelliteMap() {
  const { destination } = useParams({ from: '/destinations/$destination' }) // route param
  const [features, setFeatures] = useState<KMLFeature[]>([])

  // Load KML once
  useEffect(() => {
    fetch('/kml/routes.kml')
      .then((res) => res.text())
      .then((kmlText) => {
        const parser = new DOMParser()
        const kmlDom = parser.parseFromString(kmlText, 'text/xml')
        const geojson = toGeoJSON.kml(kmlDom)

        const extracted: KMLFeature[] = geojson.features.map((f: any) => ({
          type: f.geometry.type,
          coordinates: f.geometry.coordinates,
          properties: f.properties,
        }))

        setFeatures(extracted)
        if (DEBUG_MATCHING) console.log('Loaded features from KML:', extracted)
      })
      .catch(console.error)
  }, [])

  const normalizedDest = destination ?? ''

  // Filter points and lines using token intersection / fuzzy matching
const filteredFeatures = useMemo(() => {
  if (!destination) return []
  return features.filter((f) => namesStrongMatch(f.properties?.name, destination))
}, [features, destination])

  // Default map center (Kuressaare area)
  const center: [number, number] = [58.25, 22.48]

  // Compute bounds safely
  const allCoords: [number, number][] = filteredFeatures.flatMap((f) =>
    f.type === 'Point'
      ? // GeoJSON point coords are [lon, lat] (or array), we map to [lat, lon]
        (() => {
          const c = f.coordinates as number[]
          // if togeojson returned [lon, lat, alt] as array; ensure we have two numbers
          const lon = Number(c[0])
          const lat = Number(c[1])
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return []
          return [[lat, lon] as [number, number]]
        })()
      : // LineString
        (f.coordinates as number[][])
          .map((c) => {
            const lon = Number(c[0])
            const lat = Number(c[1])
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
            return [lat, lon] as [number, number]
          })
          .filter((v): v is [number, number] => v !== null)
  )

  const bounds = allCoords.length ? L.latLngBounds(allCoords) : undefined

  if (DEBUG_MATCHING) console.log('Filtered features for destination:', destination, filteredFeatures)

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '60vh', width: '100%' }}
      bounds={bounds}
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
        .map((f, i) => {
          const c = f.coordinates as number[]
          const lon = Number(c[0])
          const lat = Number(c[1])
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
          return (
            <Marker key={`pt-${i}`} position={[lat, lon]}>
                <Tooltip className="text-2xl font-bold" offset={[-14, 26]} direction="bottom" permanent={true}>{f.properties.name || 'Point'}</Tooltip>
            </Marker>
          )
        })}

      {/* Lines */}
      {filteredFeatures
        .filter((f) => f.type === 'LineString')
        .map((f, i) => (
          <Polyline
            key={`ln-${i}`}
            positions={(f.coordinates as number[][])
              .map((c) => [Number(c[1]), Number(c[0])])
              .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])) as [number, number][]}
            color="red"
            weight={4}
          />
        ))}
    </MapContainer>
  )
}
