import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect, useState } from 'react'

// Lazy load the map component to avoid SSR issues with Leaflet
const KitaMap = lazy(() => import('#/components/KitaMapOptimized').then(m => ({ default: m.KitaMap })))

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4" />
          <p className="text-lg font-medium">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4" />
          <p className="text-lg font-medium">Loading map...</p>
        </div>
      </div>
    }>
      <KitaMap />
    </Suspense>
  )
}
