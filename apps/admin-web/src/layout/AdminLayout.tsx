import { Link, Outlet } from 'react-router'

export default function AdminLayout() {
    return (
        <div>
            <nav>
                <Link to="/">Home</Link>
            </nav>
            <Outlet/>
        </div>
    )
}