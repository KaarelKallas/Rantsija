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


        <Outlet />
        <Link to={`/destinations`} className="text-3xl text-center font-semibold border rounded-lg p-8 m-6 shadow-lg">Tagasi</Link>
    </div>
  )
}
