import { BrowserRouter, Route, Routes } from 'react-router'
import AdminLayout from './layout/AdminLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RequireAdmin from './routes/RequireAdmin'
import AreasPage from './pages/AreasPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/areas" element={<AreasPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}