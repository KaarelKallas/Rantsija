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
    <div className="p-6 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-center">Vali sihtkoht</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {destinations
        .filter(d => d.type === 'Point')
        .map((d) => (

            <Link to={d.name + `/walking`} className="text-3xl text-center font-semibold border py-10 rounded-lg p-8 shadow-lg">
              {d.name}
            </Link>

        ))}
      </div>
    </div>
  )
}
