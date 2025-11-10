import { useEffect, useState } from 'react'

const normalizeName = (name: string) => name.toLowerCase().replace(/[\s-_]+/g, '')

export function useDestinationVideo(destination: string) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!destination) return
    const normalized = normalizeName(destination)

    // fetch the file listing from /public/videos
    // Vite cannot list files at runtime, so we’ll use static import glob
    const videos = import.meta.glob('/public/videos/fixed/*.mp4', { eager: true })

    // Build a list of available files
    const available = Object.keys(videos).map((path) => ({
      path,
      normalized: normalizeName(path.split('/').pop()?.replace('.mp4', '') || ''),
    }))

    // Try to find a close match
    const found =
      available.find((v) => v.normalized === normalized) ||
      available.find((v) => v.normalized.includes(normalized)) ||
      available.find((v) => normalized.includes(v.normalized)) ||
      null

    if (found) {
      // convert public path for browser
      const publicPath = found.path.replace('/public/fixed', '')
      setVideoUrl(publicPath)
    } else {
      setVideoUrl(null)
    }
  }, [destination])

  return videoUrl
}
