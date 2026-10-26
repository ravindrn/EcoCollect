import { createContext, useContext } from 'react'

type NavControls = {
  open: boolean
  toggle: () => void
}

export const NavContext = createContext<NavControls | null>(null)

export function useNav() {
  return useContext(NavContext)
}
