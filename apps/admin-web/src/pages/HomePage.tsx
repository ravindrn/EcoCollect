import { useEffect, useState } from 'react'
import { getAreas } from '../services/areas'
import { getPublishedAnnouncements, type Announcement } from '../services/announcements'

export default function HomePage() {
  const [areaCount, setAreaCount] = useState<number | null>(null)
  const [notices, setNotices] = useState<Announcement[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAreas(), getPublishedAnnouncements()])
      .then(([areas, published]) => {
        setAreaCount(areas.length)
        setNotices(published.slice(0, 3))
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Could not load the summary'),
      )
  }, [])

  return (
    <main>
      <h1>EcoCollect Admin</h1>
      {error ? <p>{error}</p> : null}
      <p>Areas: {areaCount ?? '...'}</p>
      <h2>Latest notices</h2>
      {notices.length === 0 ? <p>No published notices</p> : null}
      <ul>
        {notices.map((notice) => (
          <li key={notice.id}>{notice.title}</li>
        ))}
      </ul>
    </main>
  )
}