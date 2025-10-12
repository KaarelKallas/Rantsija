
import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router'
import Header from '../components/Header'
import '../styles.css'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-4">
        <Outlet />
      </main>
      <ScrollRestoration />
      <footer className="py-10 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Kuressaare liikumisabi
      </footer>
    </div>
  ),
})
