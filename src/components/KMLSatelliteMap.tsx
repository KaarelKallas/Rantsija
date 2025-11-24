// KMLSatelliteMap.tsx
import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import * as toGeoJSON from 'togeojson'
import { useParams, useRouter } from '@tanstack/react-router'
import 'leaflet/dist/leaflet.css'
import fs from 'fs'
import path from 'path'

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

// --- UTILITIES ---

const STOPWORDS = new Set([
  'bussijaam', 'buss', 'peatus', 'kontor', 'jaam', 'stop', 'busstop',
  'takso', 'peatused', 'maja', 'st', 'stopi', 'koht'
])
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
    .filter(t => t.length > 1 && !STOPWORDS.has(t) && !CITYNAMES.has(t))
}

function namesOverlap(a?: string, b?: string) {
  if (!a || !b) return 0
  const tokensA = tokensFromName(a)
  const tokensB = tokensFromName(b)
  return tokensA.filter(t => tokensB.includes(t)).length
}

function findBestMatchingVideo(destinationName: string, videoFiles: string[]) {
  const destNorm = normalizeStr(destinationName)
  let bestMatch: string | null = null
  let maxOverlap = 0

  for (const v of videoFiles) {
    const fileName = v.split('/').pop()?.replace(/\.mp4$/, '') || ''
    const overlap = namesOverlap(destNorm, fileName)
    if (overlap > maxOverlap) {
      maxOverlap = overlap
      bestMatch = v
    }
  }
  return bestMatch
}

// 🧭 MAIN COMPONENT
export default function KMLSatelliteMap() {
  const { destination } = useParams({ from: '/destinations/$destination' })
  const [features, setFeatures] = useState<KMLFeature[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const router = useRouter()
  const videoPlayingRef = router.options.context.videoPlayingRef

  // --- LOAD KML ---
  useEffect(() => {
    async function loadKML() {
        const base = await window.api.getKmlPath(); // "C:/rantsija/kml"
        const filePath = `${base.replace(/\\/g, "/")}/routes.kml`;

        const response = await fetch(`file:///${filePath}`);
        const text = await response.text();


      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const geojson = toGeoJSON.kml(xml);

      const extracted = geojson.features.map((f) => ({
        type: f.geometry.type,
        coordinates: f.geometry.coordinates,
        properties: f.properties,
      }));

      setFeatures(extracted);
    }

    loadKML();
  }, []);


  // --- FILTER FEATURES FOR DESTINATION ---
  const filteredFeatures = useMemo(() => {
    if (!destination) return []

    const destNorm = normalizeStr(destination)
    const points = features.filter(f => f.type === 'Point')
    const polylines = features.filter(f => f.type === 'LineString')

    let maxPointOverlap = 0
    const bestPoints = points
      .map(f => {
        const overlap = f.properties?.name ? namesOverlap(f.properties.name, destNorm) : 0
        if (overlap > maxPointOverlap) maxPointOverlap = overlap
        return { feature: f, overlap }
      })
      .filter(f => f.overlap === maxPointOverlap && maxPointOverlap > 0)
      .map(f => f.feature)

    const matchedPolylines = polylines.filter(f =>
      f.properties?.name && namesOverlap(f.properties.name, destNorm) > 0
    )

    return [...bestPoints, ...matchedPolylines]
  }, [features, destination])

  // --- LOAD VIDEOS ---
  useEffect(() => {
    if (!destination) return;

    async function loadVideo() {
      try {
        // Ask Electron for folder (C:\rantsija\videos)
        const videoBasePath = await window.api.getVideoBasePath();
        const fileList = await window.api.listVideos();

        if (!fileList || fileList.length === 0) {
          console.warn("No videos found in external folder");
          setVideoUrl(null);
          return;
        }

        // Find best match
        const matchedFile = findBestMatchingVideo(destination, fileList);
        if (!matchedFile) {
          setVideoUrl(null);
          return;
        }

        // Build final URL
        const finalPath = `file:///${videoBasePath.replace(/\\/g, "/")}/${matchedFile}`;
        setVideoUrl(finalPath);
      } catch (err) {
        console.error("Failed to load video:", err);
        setVideoUrl(null);
      }
    }

    loadVideo();
  }, [destination]);



  // --- MAP SETUP ---
  const center: [number, number] = [58.25, 22.48]
  const allCoords: [number, number][] = filteredFeatures.flatMap(f =>
    f.type === 'Point'
      ? (f.coordinates as number[]).length === 2
        ? [[(f.coordinates as number[])[1], (f.coordinates as number[])[0]] as [number, number]]
        : []
      : (f.coordinates as number[][]).map(([lon, lat]) => [lat, lon])
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
            .filter(f => f.type === 'Point')
            .map((f, i) => {
              const c = f.coordinates as number[]
              const lon = Number(c[0])
              const lat = Number(c[1])
              if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
              return (
                <Marker key={`pt-${i}`} position={[lat, lon]}>
                  <Tooltip className="text-xl font-bold" offset={[-14, 26]} direction="auto" opacity={0.8} permanent>
                    {f.properties.name || 'Point'}
                  </Tooltip>
                </Marker>
              )
            })}

          {filteredFeatures
            .filter(f => f.type === 'LineString')
            .map((f, i) => (
              <Polyline key={`ln-${i}`} positions={(f.coordinates as number[][]).map(([lon, lat]) => [lat, lon])} color="red" weight={4} />
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
