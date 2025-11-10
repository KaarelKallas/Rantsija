import { createFileRoute, Link } from '@tanstack/react-router'
import logo from '../logo.png'


export const Route = createFileRoute('/')({
  component: App,

})
console.log('Parent path:', Route.fullPath)

function App() {


  return (
    <div className="text-center">
            <Link to="/destinations/">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
      <span className='text-6xl pb-8'>Räntsija teejuht</span>
        <img
          src={logo}
          className="h-[50vmin] pointer-events-none"
          alt="logo"
        />
<span className='text-6xl pt-4'>Alustamiseks puuduta ekraani</span>
      </header>
      </Link>
    </div>
  )
}
