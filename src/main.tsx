import { StrictMode, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import data from './data/data.json'
import { routeTree } from './routeTree.gen'
import './styles.css'
import reportWebVitals from './reportWebVitals.ts'
import { useInactivityTimer } from './hooks/useInactivityTimer'

const router = createRouter({
  routeTree,
  context: { destinations: data, videoPlayingRef: null }, // placeholder
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const videoPlayingRef = useRef(false)
  useInactivityTimer(router, 20 * 60 * 1000, videoPlayingRef)

  return (
    <RouterProvider
      router={router}
      context={{ destinations: data, videoPlayingRef }}
    />
  )
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

reportWebVitals()
