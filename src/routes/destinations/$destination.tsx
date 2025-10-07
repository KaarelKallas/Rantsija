import { createFileRoute, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/destinations/$destination')({
  component: DestinationDetail,
})

function DestinationDetail() {
  const { destination } = Route.useParams()
  const router = useRouter()
  const { destinations } = router.options.context

  const current = destinations.find((d) => d.name === destination)

  if (!current) {
    return <div className="text-center text-red-600 mt-8">Destination not found.</div>
  }

  return (
    <div className="mt-8 text-center">
      <h2 className="text-3xl font-bold mb-4">{current.name}</h2>
      <div className="flex flex-col gap-2 items-center">
        <a href={current.walking} target="_blank" className="text-blue-600 underline">
          🚶 Walking directions
        </a>
        <a href={current.bus} target="_blank" className="text-blue-600 underline">
          🚌 Bus route
        </a>
        <a href={current.taxi} target="_blank" className="text-blue-600 underline">
          🚕 Taxi link
        </a>
      </div>
    </div>
  )
}
