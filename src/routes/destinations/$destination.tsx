import { createFileRoute, Outlet, Link, useRouter } from '@tanstack/react-router'
import { useDestinationsFromKML } from '../../components/useDestinationsFromKML';

export const Route = createFileRoute('/destinations/$destination')({
  component: DestinationPage,
})

function DestinationPage() {
  const  destinations  = useDestinationsFromKML('/kml/routes.kml')
  const { destination } = Route.useParams()
  const router = useRouter()
  //const { destinations } = router.options.context

  const current = destinations.find((d) => d.name === destination)
  if (!current) return <div className="text-red-600 mt-8 text-center">Destination not found</div>

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">{destination}</h1>

      <div className="flex justify-center gap-4 mb-4">
      <div className="flex justify-center gap-4 mb-4">
  <Link to={`/destinations/${destination}/walking`} className="text-blue-600 underline">🚶 Walking</Link>
  <Link to={`/destinations/${destination}/bus`} className="text-blue-600 underline">🚌 Bus</Link>
  <Link to={`/destinations/${destination}/taxi`} className="text-blue-600 underline">🚕 Taxi</Link>
</div>

      </div>
        <Outlet />
    </div>
  )
}
