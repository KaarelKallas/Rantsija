
import { createFileRoute, Link } from '@tanstack/react-router'
import { DESTINATIONS } from '../data/destinations'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

/**
 * Kaart ilma teekideta: kasutame OpenStreetMap iframe'i.
 * Märgised on lihtsad absoluutse positsioneerimisega nupud, mille positsioon on
 * käsitsi paika pandud (protsentuaalne), et katta Kuressaare põhipiirkond.
 * See väldib väliseid kaarditeeke ja töötab puhtalt HTML/CSS/Reactiga.
 */

const markerPositions: Record<string, { top: string; left: string }> = {
  lossihoov: { top: '56%', left: '44%' },
  haigla: { top: '40%', left: '50%' },
  bussijaam: { top: '54%', left: '49%' },
}

function MapFrame() {
  // OSM embed keskendatud Kuressaarele
  const src =
    'https://www.openstreetmap.org/export/embed.html?bbox=22.463%2C58.241%2C22.507%2C58.262&layer=mapnik&marker=58.252%2C22.486'
  return (
    <iframe
      title="Kuressaare kaart"
      src={src}
      className="w-full h-[65vh] rounded-2xl border"
      loading="lazy"
    />
  )
}

function IndexPage() {
  return (
    <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
      <section className="relative rounded-2xl overflow-hidden shadow">
        <MapFrame />
        {/* Ülekattena klõpsatavad märgised (ei kasuta ühtegi kaarditeeki) */}
        <div className="pointer-events-none absolute inset-0">
          {DESTINATIONS.map((d) => {
            const pos = markerPositions[d.id] || { top: '50%', left: '50%' }
            return (
              <Link
                key={d.id}
                to="/destination"
                search={{ id: d.id }}
                className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full"
                style={{ top: pos.top, left: pos.left }}
                title={d.name}
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 text-white text-xs px-2 py-1 shadow">
                  <span className="block w-2 h-2 rounded-full bg-white" />
                  {d.name}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <aside className="space-y-3">
        <h2 className="font-semibold text-lg">Vali sihtkoht</h2>
        <ul className="space-y-2">
          {DESTINATIONS.map((d) => (
            <li key={d.id} className="border rounded-xl p-3 hover:shadow transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{d.name}</div>
                  {d.address && <div className="text-xs text-neutral-500">{d.address}</div>}
                </div>
                <Link to="/destination" search={{ id: d.id }} className="text-emerald-700 underline">
                  Ava
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <div className="text-sm text-neutral-600">
          Nõuanne: saad sihtkoha valida kas kaardilt või nimekirjast.
        </div>
      </aside>
    </div>
  )
}
