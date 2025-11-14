import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import * as toGeoJSON from 'togeojson'
import { useParams, useRouter } from '@tanstack/react-router'
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
const CITYNAMES = new Set(['kuressaare', 'saaremaa', 'tallinn', 'tartu'])

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
    .filter((t) => t.length > 1 && !STOPWORDS.has(t) && !CITYNAMES.has(t))
}

function namesStrongMatch(featureName?: string, destinationName?: string): boolean {
  if (!featureName || !destinationName) return false
  const fTokens = tokensFromName(featureName)
  const dTokens = tokensFromName(destinationName)
  const intersection = dTokens.filter((t) => fTokens.includes(t))
  if (intersection.length > 0) return true
  const nf = normalizeStr(featureName).replace(/\s+/g, '')
  const nd = normalizeStr(destinationName).replace(/\s+/g, '')
  return nf.includes(nd) || nd.includes(nf)
}

// 🗺️ Fit map to features
function FitMapBounds({ features }: { features: KMLFeature[] }) {
  const map = useMap()
  useEffect(() => {
    if (!features.length) return
    const latLngs: L.LatLngExpression[] = []

    for (const f of features) {
      if (f.type === 'Point') {
        const [lon, lat] = f.coordinates as number[]
        latLngs.push([lat, lon])
      } else if (f.type === 'LineString') {
        latLngs.push(...(f.coordinates as number[][]).map(([lon, lat]) => [lat, lon]))
      }
    }

    if (latLngs.length === 1) {
      map.setView(latLngs[0], 16)
    } else if (latLngs.length > 1) {
      const bounds = L.latLngBounds(latLngs)
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [features, map])
  return null
}

// 🎥 Try to find the best matching video in /public/videos/fixed
async function findMatchingVideo(
  features: KMLFeature[],
  destinationName: string
): Promise<string | null> {
  // Try to find a LineString whose name matches the destination
  const lineFeature = features.find(
    (f) => f.type === 'LineString' && namesStrongMatch(f.properties?.name, destinationName)
  )

  let guess = normalizeStr(destinationName).replace(/\s+/g, '-')
  if (lineFeature?.properties?.name) {
    guess = normalizeStr(lineFeature.properties.name).replace(/\s+/g, '-')
  }

  // Dynamically import all videos under /public/videos/fixed
  const videos = import.meta.glob('/public/videos/fixed/*.mp4', { eager: true })
  const available = Object.keys(videos).map((p) => ({
    path: p.replace('/public', ''),
    norm: normalizeStr(p.split('/').pop()?.replace('.mp4', '') || ''),
  }))

  const normalizedGuess = normalizeStr(guess)
  const match =
    available.find((v) => v.norm === normalizedGuess) ||
    available.find((v) => v.norm.includes(normalizedGuess)) ||
    available.find((v) => normalizedGuess.includes(v.norm)) ||
    null

  if (DEBUG_MATCHING) {
    console.log('Video guess:', guess)
    console.log('Available videos:', available)
    console.log('Matched video:', match)
  }

  return match ? match.path : null
}

// 🧭 MAIN COMPONENT
export default function KMLSatelliteMap() {
  const { destination } = useParams({ from: '/destinations/$destination' })
  const [features, setFeatures] = useState<KMLFeature[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const router = useRouter()
  const videoPlayingRef = router.options.context.videoPlayingRef
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
        if (DEBUG_MATCHING) console.log('Loaded features:', extracted)
      })
      .catch(console.error)
  }, [])

  const filteredFeatures = useMemo(() => {
    if (!destination) return []
    return features.filter((f) => namesStrongMatch(f.properties?.name, destination))
  }, [features, destination])

  // Load best matching video
  useEffect(() => {
    if (!destination) return
    findMatchingVideo(filteredFeatures, destination).then(setVideoUrl)
  }, [destination, filteredFeatures])

  const center: [number, number] = [58.25, 22.48]

  const allCoords: [number, number][] = filteredFeatures.flatMap((f) =>
    f.type === 'Point'
      ? (() => {
          const c = f.coordinates as number[]
          const lon = Number(c[0])
          const lat = Number(c[1])
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return []
          return [[lat, lon] as [number, number]]
        })()
      : (f.coordinates as number[][])
          .map((c) => {
            const lon = Number(c[0])
            const lat = Number(c[1])
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
            return [lat, lon] as [number, number]
          })
          .filter((v): v is [number, number] => v !== null)
  )

  const bounds = allCoords.length ? L.latLngBounds(allCoords) : undefined

  return (
    <div className="flex w-full pb-4 md:flex-row gap-4">
      <div className="flex-1">
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '70vh', width: '100%' }}
          bounds={filteredFeatures.length ? bounds : undefined}
          scrollWheelZoom
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics"
          />
          <FitMapBounds features={filteredFeatures} />

          {filteredFeatures
            .filter((f) => f.type === 'Point')
            .map((f, i) => {
              const c = f.coordinates as number[]
              const lon = Number(c[0])
              const lat = Number(c[1])
              if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
              return (
                <Marker key={`pt-${i}`} position={[lat, lon]}>
                  <Tooltip
                    className="text-xl font-bold"
                    offset={[-14, 26]}
                    direction="auto"
                    opacity={0.8}
                    permanent
                  >
                    {f.properties.name || 'Point'}
                  </Tooltip>
                </Marker>
              )
            })}

          {filteredFeatures
            .filter((f) => f.type === 'LineString')
            .map((f, i) => (
              <Polyline
                key={`ln-${i}`}
                positions={(f.coordinates as number[][]).map(([lon, lat]) => [lat, lon])}
                color="red"
                weight={4}
              />
            ))}
        </MapContainer>
      </div>

      {/* 🎥 Video */}
      <div className="flex-1 flex items-center justify-center">
        {videoUrl ? (
            <video
            key={videoUrl}
            src={videoUrl}
            controls
            className="w-full max-h-[72vh] rounded-xl shadow-md"
            preload="metadata"
            onPlay={() => (videoPlayingRef.current = true)}
            onPause={() => (videoPlayingRef.current = false)}
            onEnded={() => (videoPlayingRef.current = false)}
          />
        ) : (
          <div className="text-gray-500 italic">No video available for this route.</div>
        )}
      </div>
    </div>
  )
}
