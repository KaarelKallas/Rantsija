import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useDestinationsFromKML } from '../../components/useDestinationsFromKML'
import KMLSatelliteMap from '@/components/KMLSatelliteMap'

export const Route = createFileRoute('/destinations/$destination/$selection')({
  component: SelectionPage,
})

function SelectionPage() {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
  const { destination, selection } = Route.useParams()
  const destinations = useDestinationsFromKML('/kml/routes.kml')

  // Hook always runs
  const current = destinations.find(d => d.name === destination)

  const start = [58.253, 22.503]
  const end = current?.coordinates?.[0] || null
   //console.log('Current destination coordinates:', end)
  const osrmMode = 'walking'

  useEffect(() => {
    if (!end) return
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/${osrmMode}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
       // console.log('Fetching route from OSRM:', url)
        const res = await fetch(url)
        const data = await res.json()
        if (data.routes?.length) {
          const coords = data.routes[0].geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon])
          setRouteCoords(coords)
        }
      } catch (e) {
        console.error('Error fetching route', e)
      }
    }
    fetchRoute()
  }, [start, end, osrmMode])

  // --- Render Section ---
  if (!destinations.length) {
    return <div className="text-center mt-8 text-gray-500">Loading destinations...</div>
  }

  if (!current) {
    return <div className="text-red-600 mt-8 text-center">Destination not found</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2 text-center">{destination}</h1>
      <h2 className="text-2xl font-semibold mb-4 text-center">{selection.toUpperCase()}</h2>

      <KMLSatelliteMap />

      <div className="text-center mt-4" />
    </div>
  )
}
