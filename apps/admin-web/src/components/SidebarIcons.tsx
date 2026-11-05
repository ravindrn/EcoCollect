// Monochrome SVG icons for the admin sidebar.
// Each accepts a `color` prop so we can theme green/gray.

type IconProps = {
  color?: string;
  size?: number;
};

const stroke = (color: string) => ({
  fill: 'none',
  stroke: color,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function DashboardIcon({ color = '#0F172A', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function ComplaintsIcon({ color = '#0F172A', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </svg>
  );
}

export function UsersIcon({ color = '#0F172A', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.5-3.3 3.2-5.5 6.5-5.5s6 2.2 6.5 5.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14.5c2.5 0 4.5 1.7 5 4.5" />
    </svg>
  );
}

export function AnnouncementsIcon({ color = '#0F172A', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)}>
      <path d="M4 8h3l9-4v14l-9-4H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z" />
      <line x1="19" y1="9" x2="19" y2="15" />
      <line x1="22" y1="10" x2="22" y2="14" />
    </svg>
  );
}

export function AreasIcon({ color = '#0F172A', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)}>
      <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function MapIcon({ color = '#0F172A', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)}>
      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

export function RoutesIcon({ color = '#0F172A', size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke(color)}>
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M7 6h6a4 4 0 0 1 4 4v4" />
      <path d="M17 18h-6a4 4 0 0 1-4-4v-4" />
    </svg>
  );
}

export const IconMap = {
  dashboard: DashboardIcon,
  complaints: ComplaintsIcon,
  users: UsersIcon,
  announcements: AnnouncementsIcon,
  areas: AreasIcon,
  map: MapIcon,
  routes: RoutesIcon,
} as const;

export type IconKey = keyof typeof IconMap;