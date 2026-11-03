import { NavLink } from 'react-router-dom';
import { colors } from '../theme/colors';
import { IconMap, type IconKey } from './SidebarIcons';

const links: { to: string; label: string; icon: IconKey }[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/complaints', label: 'Complaints', icon: 'complaints' },
  { to: '/users', label: 'Users', icon: 'users' },
  { to: '/routes', label: 'Routes', icon: 'routes' },
  { to: '/announcements', label: 'Announcements', icon: 'announcements' },
  { to: '/live-map', label: 'Live Map', icon: 'map' },
];
export function Sidebar() {
  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        background: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '22px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: colors.primarySoft,
            border: `1px solid ${colors.primaryLight}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.primary}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 4c-8 0-14 4-14 12 0 1.5.3 3 1 4" />
            <path d="M4 20c0-8 5-14 16-16" />
          </svg>
        </div>
        <div>
          <div
            style={{
              fontWeight: 800,
              color: colors.textPrimary,
              fontSize: 15,
            }}
          >
            EcoCollect
          </div>
          <div style={{ color: colors.textMuted, fontSize: 11 }}>
            Admin Console
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {links.map(({ to, label, icon }) => {
          const Icon = IconMap[icon];
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                textDecoration: 'none',
                color: isActive ? colors.primary : colors.textSecondary,
                background: isActive ? colors.primarySoft : 'transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                marginBottom: 4,
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />
                  {label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div
        style={{
          padding: 16,
          borderTop: `1px solid ${colors.border}`,
          fontSize: 11,
          color: colors.textMuted,
        }}
      >
        © 2026 EcoCollect
      </div>
    </aside>
  );
}