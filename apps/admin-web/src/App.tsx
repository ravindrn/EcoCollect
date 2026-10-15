import { env } from './config/env'

export default function App() {
  return (
    <main>
      <h1>EcoCollect Admin</h1>
      <p>Dashboard shell is running.</p>
      <p>API base: {env.apiBaseUrl}</p>
    </main>
  )
}