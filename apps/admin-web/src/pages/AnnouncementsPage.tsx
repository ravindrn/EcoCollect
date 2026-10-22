import { useEffect, useState } from "react"
import {
    createAnnouncement,
    publishAnnouncement,
    getPublishedAnnouncements,
    type Announcement,
} from '../services/announcements'

export default function AnnouncementsPage() {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [draft, setDraft] = useState<Announcement | null>(null)
    const [published, setPublished] = useState<Announcement[]>([])
    const [error, setError] = useState<string | null> (null)

    useEffect(() => {
        getPublishedAnnouncements()
         .then(setPublished)
         .catch((err: unknown) =>
           setError(err instanceof Error ? err.message: 'Could not load announcements'),
        )
    }, [])

    async function onCreate() {
        setError(null)
        try {
            const created = await createAnnouncement(title, description)
            setDraft(created)
        } catch (err) {
            setError(err instanceof Error ? err.message: 'Could not create announcement')
        }
    }

    async function onPublish() {
        if (!draft) return
        setError(null)
        try {
            await publishAnnouncement(draft.id)
            setDraft(null)
            setTitle('')
            setDescription('')
            setPublished(await getPublishedAnnouncements())
        } catch (err) {
            setError(err instanceof Error ? err.message: 'Could not publish announcement')
        }
    }

    return (
        <main>
      <h1>Announcements</h1>
      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <button type="button" onClick={() => void onCreate()}>
        Create draft
      </button>
      <button type="button" onClick={() => void onPublish()} disabled={draft === null}>
        Publish
      </button>
      {draft ? <p>Draft: {draft.title}</p> : null}
      {error ? <p>{error}</p> : null}
      <h2>Published</h2>
      <ul>
        {published.map((item) => (
          <li key={item.id}>
            {item.title}: {item.description}
          </li>
        ))}
      </ul>
    </main>
    )

}