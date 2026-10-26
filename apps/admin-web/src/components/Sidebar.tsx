import { NavLink } from 'react-router-dom';
import { colors } from '../theme/colors';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/complaints', label: 'Complaints', icon: '📋' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/announcements', label: 'Announcements', icon: '📢' },
  { to: '/areas', label: 'Areas', icon: '📍' },
  { to: '/live-map', label: 'Live Map', icon: '🗺️' },
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
            fontSize: 18,
          }}
        >
          ♻️
        </div>
        <div>
          <div style={{ fontWeight: 800, color: colors.textPrimary, fontSize: 15 }}>
            EcoCollect
          </div>
          <div style={{ color: colors.textMuted, fontSize: 11 }}>Admin Console</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {links.map(({ to, label, icon }) => (
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
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}`, fontSize: 11, color: colors.textMuted }}>
        © 2026 EcoCollect
      </div>
    </aside>
  );
}