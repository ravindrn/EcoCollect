import type { LiveVehicle, RouteAlertKind } from '../services/adminApi';
import { colors } from '../theme/colors';

type FilterMode = 'all' | 'moving' | 'stopped';

type Props = {
  vehicles: LiveVehicle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  lastRefresh: string | null;
  onResetView: () => void;
  filter: FilterMode;
  onFilterChange: (mode: FilterMode) => void;
  routeStatus?: Record<string, RouteAlertKind>;
};

export function VehicleSidebar({
  vehicles,
  selectedId,
  onSelect,
  loading,
  lastRefresh,
  onResetView,
  filter,
  onFilterChange,
  routeStatus = {},
}: Props) {
  const movingCount = vehicles.filter((v) => v.isMoving).length;

  return (
    <div
      style={{
        width: 320,
        background: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 20, borderBottom: `1px solid ${colors.border}` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              color: colors.textPrimary,
            }}
          >
            Live Vehicles
          </h2>
          <span
            style={{
              background: colors.primarySoft,
              color: colors.primary,
              borderRadius: 999,
              padding: '2px 10px',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {movingCount}/{vehicles.length} moving
          </span>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: colors.textMuted }}>
          {loading ? 'Updating…' : lastRefresh ? `Updated ${lastRefresh}` : '—'}
        </p>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', gap: 6 }}>
        {(['all', 'moving', 'stopped'] as const).map((mode) => {
          const active = filter === mode;
          const labels: Record<FilterMode, string> = {
            all: 'All',
            moving: 'Moving',
            stopped: 'Stopped',
          };
          return (
            <button
              key={mode}
              onClick={() => onFilterChange(mode)}
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                cursor: 'pointer',
                background: active ? colors.primary : colors.surface,
                color: active ? 'white' : colors.textSecondary,
                border: `1px solid ${active ? colors.primary : colors.border}`,
              }}
            >
              {labels[mode]}
            </button>
          );
        })}
      </div>

      <button
        onClick={onResetView}
        style={{
          margin: '0 16px 8px',
          padding: '8px 12px',
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          background: colors.surface,
          color: colors.textPrimary,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ⤢ Fit all vehicles
      </button>

      <div style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
        {vehicles.length === 0 && !loading && (
          <div
            style={{
              padding: 20,
              textAlign: 'center',
              color: colors.textMuted,
              fontSize: 13,
            }}
          >
            No active vehicles
          </div>
        )}

        {vehicles.map((v) => {
          const isSelected = v.id === selectedId;
          const dotColor = v.isMoving ? colors.success : colors.textMuted;
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: isSelected ? colors.primarySoft : 'transparent',
                border: `1px solid ${
                  isSelected ? colors.primaryLight : 'transparent'
                }`,
                borderRadius: 10,
                padding: '10px 12px',
                marginBottom: 6,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: dotColor,
                    boxShadow: `0 0 0 3px ${
                      v.isMoving ? colors.successSoft : '#F1F5F9'
                    }`,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: isSelected ? colors.primary : colors.textPrimary,
                    }}
                  >
                    {v.plateNumber}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>
                    {v.name ?? 'Unnamed'}
                  </div>
                </div>
              </div>

              {v.lastLocation && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: colors.textMuted,
                  }}
                >
                  {v.isMoving ? 'Moving' : 'Stopped'}
                  {v.lastLocation.speed != null &&
                    ` · ${v.lastLocation.speed.toFixed(1)} km/h`}
                </div>
              )}
              {routeStatus[v.id] ? (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: routeStatus[v.id] === 'OUTSIDE' ? colors.error : colors.success,
                  }}
                >
                  {routeStatus[v.id] === 'OUTSIDE' ? 'Outside the route' : 'Inside the route'}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}