import { Link, Outlet } from 'react-router'

export default function AdminLayout() {
    return (
        <div>
            <nav>
                <Link to="/">Home</Link>
                <br />
                <Link to="/areas">Areas</Link>
            </nav>
            <Outlet/>
        </div>
    )
}