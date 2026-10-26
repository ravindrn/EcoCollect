import { useEffect, useState } from 'react';
import {
  getAnnouncementsAdmin,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type Announcement,
  type AnnouncementPriority,
  type AnnouncementStatus,
  type AnnouncementListResult,
} from '../services/adminApi';
import { ApiError } from '../services/http';
import { colors } from '../theme/colors';

const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  NORMAL: 'Normal',
  IMPORTANT: 'Important',
  URGENT: 'Urgent',
};

const PRIORITY_COLORS: Record<
  AnnouncementPriority,
  { bg: string; fg: string }
> = {
  NORMAL: { bg: colors.infoSoft, fg: colors.info },
  IMPORTANT: { bg: colors.warningSoft, fg: colors.warning },
  URGENT: { bg: colors.errorSoft, fg: colors.error },
};

const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

const STATUS_COLORS: Record<AnnouncementStatus, { bg: string; fg: string }> = {
  DRAFT: { bg: colors.background, fg: colors.textSecondary },
  PUBLISHED: { bg: colors.successSoft, fg: colors.success },
  ARCHIVED: { bg: colors.border, fg: colors.textMuted },
};

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; result: AnnouncementListResult }
  | { kind: 'error'; message: string };

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; announcement: Announcement };

export function AnnouncementsPage() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [filter, setFilter] = useState<AnnouncementStatus | ''>('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    setState({ kind: 'loading' });
    try {
      const result = await getAnnouncementsAdmin({
        page,
        pageSize: 15,
        status: filter || undefined,
      });
      setState({ kind: 'ok', result });
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof ApiError ? err.message : 'Failed to load',
      });
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  const handlePublishToggle = async (a: Announcement) => {
    setActionId(a.id);
    try {
      const nextStatus: AnnouncementStatus =
        a.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
      await updateAnnouncement(a.id, { status: nextStatus });
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Failed');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (a: Announcement) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    setActionId(a.id);
    try {
      await deleteAnnouncement(a.id);
      await load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
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
            Announcements
          </h2>
          <p style={{ color: colors.textSecondary, marginTop: 6, fontSize: 14 }}>
            Publish updates for citizens to see in the mobile app.
          </p>
        </div>
        <button
          onClick={() => setModal({ kind: 'create' })}
          style={{
            background: colors.primary,
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          + New announcement
        </button>
      </section>

      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as AnnouncementStatus | '');
            setPage(1);
          }}
          style={{ ...inputStyle, width: 200 }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </section>

      {state.kind === 'loading' && (
        <p style={{ color: colors.textSecondary }}>Loading…</p>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: colors.background, textAlign: 'left' }}>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Priority</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Published</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.result.items.map((a) => (
                  <tr key={a.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: colors.textPrimary }}>
                        {a.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: colors.textMuted,
                          maxWidth: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.description}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: PRIORITY_COLORS[a.priority].bg,
                          color: PRIORITY_COLORS[a.priority].fg,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 999,
                        }}
                      >
                        {PRIORITY_LABELS[a.priority]}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: STATUS_COLORS[a.status].bg,
                          color: STATUS_COLORS[a.status].fg,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 999,
                        }}
                      >
                        {STATUS_LABELS[a.status]}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {a.publishedAt
                        ? new Date(a.publishedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setModal({ kind: 'edit', announcement: a })}
                          style={smallBtn(colors.primary)}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handlePublishToggle(a)}
                          disabled={actionId === a.id}
                          style={smallBtn(
                            a.status === 'PUBLISHED' ? colors.warning : colors.success,
                          )}
                        >
                          {a.status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
                          disabled={actionId === a.id}
                          style={smallBtn(colors.error)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {state.result.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}
                    >
                      No announcements yet.
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
              {state.result.meta.totalPages || 1} · {state.result.meta.total} total
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
                  setPage((p) => Math.min(state.result.meta.totalPages || 1, p + 1))
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

      {modal.kind !== 'closed' && (
        <AnnouncementModal
          announcement={modal.kind === 'edit' ? modal.announcement : undefined}
          onClose={() => setModal({ kind: 'closed' })}
          onSaved={async () => {
            setModal({ kind: 'closed' });
            await load();
          }}
        />
      )}
    </div>
  );
}

function AnnouncementModal({
  announcement,
  onClose,
  onSaved,
}: {
  announcement?: Announcement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!announcement;
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [description, setDescription] = useState(announcement?.description ?? '');
  const [priority, setPriority] = useState<AnnouncementPriority>(
    announcement?.priority ?? 'NORMAL',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isEdit && announcement) {
        await updateAnnouncement(announcement.id, {
          title: title.trim(),
          description: description.trim(),
          priority,
        });
      } else {
        await createAnnouncement({
          title: title.trim(),
          description: description.trim(),
          priority,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} style={modalCard}>
        <h2 style={{ margin: 0, color: colors.textPrimary }}>
          {isEdit ? 'Edit announcement' : 'New announcement'}
        </h2>

        <label style={fieldLabel}>
          <div style={labelText}>Title</div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label style={fieldLabel}>
          <div style={labelText}>Description</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </label>

        <label style={fieldLabel}>
          <div style={labelText}>Priority</div>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
            style={inputStyle}
          >
            <option value="NORMAL">Normal</option>
            <option value="IMPORTANT">Important</option>
            <option value="URGENT">Urgent</option>
          </select>
        </label>

        {error && (
          <div
            role="alert"
            style={{
              background: colors.errorSoft,
              border: '1px solid #FECACA',
              color: colors.error,
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} disabled={saving} style={cancelBtn}>
            Cancel
          </button>
          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  fontSize: 14,
  background: colors.surface,
  color: colors.textPrimary,
  outline: 'none',
  boxSizing: 'border-box',
};

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

const smallBtn = (color: string): React.CSSProperties => ({
  background: 'transparent',
  color,
  border: `1px solid ${color}`,
  padding: '6px 10px',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
});

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.45)',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  zIndex: 1000,
};

const modalCard: React.CSSProperties = {
  background: colors.surface,
  borderRadius: 16,
  padding: 24,
  width: '100%',
  maxWidth: 560,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(15,23,42,0.25)',
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  marginTop: 16,
};

const labelText: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: colors.textPrimary,
  marginBottom: 6,
};

const primaryBtn: React.CSSProperties = {
  background: colors.primary,
  color: 'white',
  border: 'none',
  padding: '10px 18px',
  borderRadius: 10,
  fontWeight: 700,
  cursor: 'pointer',
};

const cancelBtn: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${colors.border}`,
  color: colors.textSecondary,
  padding: '10px 16px',
  borderRadius: 10,
  fontWeight: 600,
  cursor: 'pointer',
};