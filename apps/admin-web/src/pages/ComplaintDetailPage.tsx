import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  getComplaint,
  updateComplaintStatus,
  resolvePhotoUrl,
  type AdminComplaintItem,
  type ComplaintStatus,
} from '../services/adminApi';
import { ApiError } from '../services/http';
import { StatusBadge, CategoryBadge, CATEGORY_LABELS } from '../components/StatusBadge';
import { colors } from '../theme/colors';

setWorkerUrl(maplibreWorkerUrl);

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; complaint: AdminComplaintItem }
  | { kind: 'error'; message: string };

const STATUS_BUTTONS: { key: ComplaintStatus; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'REJECTED', label: 'Rejected' },
];
export function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [state, setState] = useState<State>({ kind: 'loading' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState({ kind: 'loading' });
    (async () => {
      try {
        const complaint = await getComplaint(id);
        if (!cancelled) setState({ kind: 'ok', complaint });
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: 'error',
            message:
              err instanceof ApiError ? err.message : 'Failed to load complaint',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (state.kind !== 'ok') return;
    if (state.complaint.latitude == null || state.complaint.longitude == null) return;
    if (!mapContainer.current || mapRef.current) return;

    const center: [number, number] = [
      state.complaint.longitude,
      state.complaint.latitude,
    ];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center,
      zoom: 15,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const el = document.createElement('div');
    el.style.cssText = `
      width: 32px; height: 32px; border-radius: 50%;
      background: ${colors.error}; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(15,23,42,0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    `;
    el.textContent = '📍';

    new maplibregl.Marker({ element: el }).setLngLat(center).addTo(map);

    mapRef.current = map;
    setTimeout(() => map.resize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [state]);

  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    if (!id || state.kind !== 'ok') return;
    if (state.complaint.status === newStatus) return;

    setUpdating(true);
    try {
      await updateComplaintStatus(id, newStatus);
      setState({
        kind: 'ok',
        complaint: { ...state.complaint, status: newStatus },
      });
    } catch (err) {
      window.alert(
        err instanceof ApiError ? err.message : 'Failed to update status',
      );
    } finally {
      setUpdating(false);
    }
  };

  if (state.kind === 'loading') {
    return (
      <div style={{ padding: 40, color: colors.textSecondary }}>
        Loading complaint…
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => navigate('/complaints')} style={backBtn}>
          ← Back to complaints
        </button>
        <div
          role="alert"
          style={{
            background: colors.errorSoft,
            border: '1px solid #FECACA',
            color: colors.error,
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: 14,
            marginTop: 20,
          }}
        >
          {state.message}
        </div>
      </div>
    );
  }

  const c = state.complaint;
  const photoAbs = resolvePhotoUrl(c.photoUrl);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <button onClick={() => navigate('/complaints')} style={backBtn}>
          ← Back to complaints
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: colors.textPrimary,
              margin: 0,
            }}
          >
            {c.title}
          </h2>
          <p
            style={{
              color: colors.textSecondary,
              marginTop: 6,
              fontSize: 13,
            }}
          >
            Submitted {new Date(c.createdAt).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <CategoryBadge category={c.category} />
          {c.isAnonymous && (
            <span
              style={{
                background: colors.background,
                color: colors.textMuted,
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Anonymous
            </span>
          )}
          <StatusBadge status={c.status} />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
        }}
      >
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div>
            <div style={labelStyle}>Description</div>
            <p
              style={{
                margin: 0,
                color: colors.textPrimary,
                fontSize: 15,
                lineHeight: 1.5,
              }}
            >
              {c.description}
            </p>
          </div>

          <div>
            <div style={labelStyle}>Category</div>
            <div style={{ fontSize: 15, color: colors.textPrimary }}>
              {CATEGORY_LABELS[c.category] ?? c.category}
            </div>
          </div>

          <div>
            <div style={labelStyle}>Reported by</div>
            {c.user ? (
              <>
                <div style={{ fontSize: 15, color: colors.textPrimary }}>
                  {c.user.fullName ?? '—'}
                </div>
                <div style={{ fontSize: 13, color: colors.textSecondary }}>
                  {c.user.email}
                </div>
                {c.user.phone && (
                  <div style={{ fontSize: 13, color: colors.textSecondary }}>
                    {c.user.phone}
                  </div>
                )}
                {c.user.wardDivision && (
                  <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                    Ward: {c.user.wardDivision}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 15, color: colors.textMuted, fontStyle: 'italic' }}>
                {c.isAnonymous ? 'Anonymous report' : 'Unknown reporter'}
              </div>
            )}
          </div>

          <div>
            <div style={labelStyle}>Update status</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATUS_BUTTONS.map((s) => {
                const active = c.status === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => handleStatusChange(s.key)}
                    disabled={updating || active}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: active || updating ? 'default' : 'pointer',
                      background: active ? colors.primary : colors.surface,
                      color: active ? 'white' : colors.textPrimary,
                      border: `1px solid ${
                        active ? colors.primary : colors.border
                      }`,
                      opacity: updating ? 0.6 : 1,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {photoAbs && (
            <div
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={labelStyle}>Photo</div>
              <img
                src={photoAbs}
                alt="Complaint"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 320,
                  objectFit: 'cover',
                  borderRadius: 10,
                  background: colors.background,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {c.latitude != null && c.longitude != null && (
            <div
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={labelStyle}>Location</div>
              <div
                ref={mapContainer}
                style={{
                  width: '100%',
                  height: 280,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: colors.background,
                }}
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: colors.textMuted,
                  fontFamily: 'monospace',
                }}
              >
                {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}
              </div>
            </div>
          )}

          {!photoAbs && (c.latitude == null || c.longitude == null) && (
            <div
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: 32,
                textAlign: 'center',
                color: colors.textMuted,
                fontSize: 13,
              }}
            >
              No photo or location submitted
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  marginBottom: 6,
};

const backBtn: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${colors.border}`,
  color: colors.textSecondary,
  padding: '8px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};