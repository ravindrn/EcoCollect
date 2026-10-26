import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/complaints': 'Complaints',
  '/users': 'Users',
  '/announcements': 'Announcements',
  '/areas': 'Areas',
  '/live-map': 'Live Map',
};

export function Layout() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();

  const title = pageTitles[pathname] ?? 'Admin';
  const initial = (user?.email ?? '?').trim().charAt(0).toUpperCase();
  const isMapRoute = pathname === '/live-map';

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: colors.background,
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <header
          style={{
            height: 68,
            flexShrink: 0,
            background: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
          }}
        >
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
            }}
          >
            {title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                {user?.email}
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>
                {user?.role}
              </div>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: colors.primary,
                color: 'white',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {initial}
            </div>
            <button
              onClick={signOut}
              style={{
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                padding: '8px 14px',
                borderRadius: 10,
                color: colors.textSecondary,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflow: isMapRoute ? 'hidden' : 'auto',
            padding: isMapRoute ? 0 : 28,
            position: 'relative',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}