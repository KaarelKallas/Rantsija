
import { Link, useRouterState } from '@tanstack/react-router'

export default function Header() {
  const { location } = useRouterState()
  return (
    <header className="w-full bg-emerald-700 text-white sticky top-0 z-50 shadow">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold tracking-wide">Kuressaare abilist</Link>
        <nav className="text-sm flex gap-4">
          <Link to="/" className={location.pathname === '/' ? 'underline' : ''}>Avaleht</Link>
          <Link to="/destination" search={{ id: 'lossihoov' }}>Näide sihtkoht</Link>
        </nav>
      </div>
    </header>
  )
}
