import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/destination')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/destination"!</div>
}
