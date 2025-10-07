import { Link, Outlet, createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/destinations/')({
  component: Destinations,
})

function Destinations() {
  const router = useRouter()
  const { destinations } = router.options.context

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold my-8 text-center">Destinations</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {destinations.map((destination) => (
          <div key={destination.name} className="border rounded-lg p-4 shadow-lg">
            <Link
              to={destination.name}
              activeProps={{ className: 'bg-blue-100 border-blue-500' }}
            >
              <h2 className="text-2xl font-semibold mb-2">{destination.name}</h2>
            </Link>
          </div>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
