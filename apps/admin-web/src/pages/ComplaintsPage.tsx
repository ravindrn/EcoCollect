import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getComplaints,
  type ComplaintStatus,
  type ComplaintsListResult,
} from '../services/adminApi';
import { ApiError } from '../services/http';
import { StatusBadge, CategoryBadge } from '../components/StatusBadge';
import { colors } from '../theme/colors';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; result: ComplaintsListResult }
  | { kind: 'error'; message: string };

const STATUS_TABS: { key: ComplaintStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'REJECTED', label: 'Rejected' },
];

const CATEGORIES = [
  'ALL',
  'OVERFLOW',
  'MISSED_PICKUP',
  'ILLEGAL_DUMPING',
  'BURNING',
  'DAMAGED_BIN',
  'OTHER',
];

const CATEGORY_LABELS: Record<string, string> = {
  ALL: 'All categories',
  OVERFLOW: 'Overflow',
  MISSED_PICKUP: 'Missed pickup',
  ILLEGAL_DUMPING: 'Illegal dumping',
  BURNING: 'Burning waste',
  DAMAGED_BIN: 'Damaged bin',
  OTHER: 'Other',
};

export function ComplaintsPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [status, setStatus] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [category, setCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    (async () => {
      try {
        const result = await getComplaints({
          page,
          pageSize: 15,
          status: status === 'ALL' ? undefined : status,
          category: category === 'ALL' ? undefined : category,
          q: search.trim() || undefined,
        });
        if (!cancelled) setState({ kind: 'ok', result });
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to load complaints';
        if (!cancelled) setState({ kind: 'error', message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, status, category, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: colors.textPrimary,
            margin: 0,
          }}
        >
          Complaints
        </h2>
        <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 14 }}>
          Review and update reported waste issues.
        </p>
      </section>

      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: `1px solid ${colors.border}`,
          overflowX: 'auto',
        }}
      >
        {STATUS_TABS.map((s) => {
          const active = status === s.key;
          const count =
            s.key === 'ALL'
              ? Object.values(
                  state.kind === 'ok' ? state.result.statusCounts : {},
                ).reduce((a, b) => a + b, 0)
              : state.kind === 'ok'
                ? (state.result.statusCounts[s.key] ?? 0)
                : 0;
          return (
            <button
              key={s.key}
              onClick={() => {
                setStatus(s.key);
                setPage(1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? colors.primary : colors.textSecondary,
                borderBottom: active
                  ? `2px solid ${colors.primary}`
                  : '2px solid transparent',
                marginBottom: -1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
              {count > 0 && (
                <span
                  style={{
                    background: active ? colors.primary : colors.border,
                    color: active ? 'white' : colors.textPrimary,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 7px',
                    minWidth: 20,
                    textAlign: 'center',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search title, description, or reporter"
          style={{
            flex: 1,
            minWidth: 240,
            maxWidth: 400,
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${colors.border}`,
            fontSize: 14,
            background: colors.surface,
            color: colors.textPrimary,
            outline: 'none',
          }}
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${colors.border}`,
            fontSize: 14,
            background: colors.surface,
            color: colors.textPrimary,
            outline: 'none',
            minWidth: 180,
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {state.kind === 'loading' && (
        <p style={{ color: colors.textSecondary }}>Loading complaints…</p>
      )}

      {state.kind === 'error' && (
        <div
          role="alert"
          style={{
            background: colors.errorSoft,
            border: '1px solid #FECACA',
            color: colors.error,
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: 14,
          }}
        >
          {state.message}
        </div>
      )}

      {state.kind === 'ok' && (
        <>
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <table
              style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}
            >
              <thead>
                <tr style={{ background: colors.background, textAlign: 'left' }}>
                  <th style={thStyle}>Complaint</th>
                  <th style={thStyle}>Reporter</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Submitted</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {state.result.items.map((c) => (
                  <tr
                    key={c.id}
                    style={{
                      borderTop: `1px solid ${colors.border}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/complaints/${c.id}`)}
                  >
                    <td style={tdStyle}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: colors.textPrimary,
                          maxWidth: 360,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: colors.textMuted,
                          maxWidth: 360,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.description}
                      </div>
                      <div style={{ fontSize: 11, color: colors.textMuted }}>
                        {c.photoUrl ? '📷 has photo' : 'no photo'}
                        {c.latitude != null ? ' · 📍 has location' : ''}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {c.user ? (
                        <>
                          <div
                            style={{
                              fontWeight: 600,
                              color: colors.textPrimary,
                            }}
                          >
                            {c.user.fullName ?? '—'}
                          </div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>
                            {c.user.email}
                          </div>
                          {c.user.phone && (
                            <div
                              style={{ fontSize: 12, color: colors.textMuted }}
                            >
                              {c.user.phone}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: colors.textMuted, fontStyle: 'italic' }}>
                          {c.isAnonymous ? 'Anonymous' : '—'}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <CategoryBadge category={c.category} />
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 13, color: colors.textSecondary }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>
                        {new Date(c.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          color: colors.primary,
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        View →
                      </span>
                    </td>
                  </tr>
                ))}
                {state.result.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 40,
                        textAlign: 'center',
                        color: colors.textMuted,
                      }}
                    >
                      No complaints match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 13,
              color: colors.textSecondary,
            }}
          >
            <span>
              Page {state.result.meta.page} of{' '}
              {state.result.meta.totalPages || 1} · {state.result.meta.total}{' '}
              total
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={pagerStyle}
              >
                ← Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) =>
                    Math.min(state.result.meta.totalPages || 1, p + 1),
                  )
                }
                disabled={page >= (state.result.meta.totalPages || 1)}
                style={pagerStyle}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 700,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle',
};

const pagerStyle: React.CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  padding: '8px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  color: colors.textPrimary,
  cursor: 'pointer',
};