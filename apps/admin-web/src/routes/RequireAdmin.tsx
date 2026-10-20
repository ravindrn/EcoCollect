import { Navigate, Outlet } from 'react-router'
import { adminSession } from '../services/session'

export default function RequireAdmin() {
    if(!adminSession.getToken()) {
        return <Navigate to="/login" replace/>
    }

    return <Outlet />
}