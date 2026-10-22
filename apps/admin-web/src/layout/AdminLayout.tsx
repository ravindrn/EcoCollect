import { Link, Outlet, useNavigate } from 'react-router'
import { adminSession } from '../services/session'

export default function AdminLayout() {
    const navigate = useNavigate()

    function signOut() {
        adminSession.clear()
        navigate('/login')
    }
    return (
        <div>
            <nav>
                <Link to="/">Home</Link>
                
                <Link to="/areas">Areas</Link>
                <Link to="/announcements">Announcements</Link>
                <button type="button" onClick={signOut}>
                    Sign out
                </button>
            </nav>
            <Outlet/>
        </div>
    )
}