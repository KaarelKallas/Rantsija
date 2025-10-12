
import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { DESTINATIONS } from '../data/destinations'

export const Route = createFileRoute('/destination')({
  validateSearch: (search: Record<string, unknown>) => {
    return { id: String(search.id ?? '') }
  },
  component: DestinationPage,
})

function DestinationPage() {
  const { id } = useSearch({ from: '/destination' })
  const dest = DESTINATIONS.find(d => d.id === id)

  if (!dest) {
    return (
      <div className="space-y-4">
        <p>Sihtkohta ei leitud.</p>
        <Link to="/" className="text-emerald-700 underline">Tagasi avalehele</Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">{dest.name}</h1>
        {dest.address && <div className="text-sm text-neutral-500">{dest.address}</div>}
        <div className="rounded-2xl overflow-hidden border shadow">
          <video
            src={dest.video}
            controls
            playsInline
            className="w-full h-[55vh] bg-black"
          >
            Teie brauser ei toeta video esitust.
          </video>
        </div>
        <Link to="/" className="text-emerald-700 underline">← Tagasi kaartile</Link>
      </section>
      <aside className="space-y-3">
        <div className="rounded-2xl border p-4 shadow bg-white">
          <h2 className="font-semibold text-lg mb-2">Ohukohad ja tähelepanekud</h2>
          <ul className="list-disc pl-5 space-y-2">
            {dest.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border p-4 bg-emerald-50 text-emerald-900">
          <h3 className="font-semibold">Kuidas videot kasutada?</h3>
          <p className="text-sm mt-1">
            Video näitab kogu teekonda algusest lõpuni. Vajadusel peata video, et lugeda märkusi
            või kerida tagasi keerulise koha juurde.
          </p>
        </div>
      </aside>
    </div>
  )
}
