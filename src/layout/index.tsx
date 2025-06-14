import { useAppStore } from '@/stores'
import type { User } from '@/types'
import { Navigate, Outlet, useLoaderData, useLocation } from 'react-router'

export const layoutLoader = async () => ({ user: await useAppStore.getState().getUserInfo() })

export default function Layout() {
  const data = useLoaderData() as { user: User }
  const location = useLocation()
  if (!data.user) return <Navigate replace to="/login" />

  return (
    <>
      {location.pathname === '/' && <Navigate to="/chat" replace />}
      <Outlet />
    </>
  )
}
