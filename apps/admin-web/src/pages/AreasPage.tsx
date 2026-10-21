import { useEffect, useState } from 'react'
import { getAreas, type Area } from '../services/areas'

export default function AreasPage() {
    const [areas, setAreas] = useState<Area[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        getAreas()
         .then(setAreas)
         .catch((err: unknown) => 
          setError(err instanceof Error ? err.message : 'Could not load areas'),
         )
        
    }, [])

    return(
        <main>
      <h1>Areas</h1>
      {error ? <p>{error}</p> : null}
      {areas.length === 0 ? <p>No areas</p> : null}
      <ul>
        {areas.map((area) => (
          <li key={area.id}>{area.name}</li>
        ))}
      </ul>
    </main>
    )
}
