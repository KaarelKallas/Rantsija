import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useDestinationsFromKML } from '../../components/useDestinationsFromKML';
export const Route = createFileRoute('/destinations/')({
  component: DestinationsList,
})

function DestinationsList() {
  const router = useRouter()
  const  destinations  = useDestinationsFromKML('/kml/routes.kml')
    console.log('Loaded destinations:', destinations);

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Destinations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {destinations
        .filter(d => d.type === 'Point')
        .map((d) => (
          <div key={d.name} className="border rounded-lg p-4 shadow-lg">
            <Link to={d.name} className="text-2xl font-semibold">
              {d.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
