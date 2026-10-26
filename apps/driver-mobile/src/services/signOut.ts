import { queryClient } from './queryClient'
import { useSession } from '@/stores/session'
import { useTrip } from '@/stores/trip'

export async function signOut(): Promise<void> {
  await useSession.getState().clear()
  useTrip.getState().reset()
  queryClient.clear()
}
