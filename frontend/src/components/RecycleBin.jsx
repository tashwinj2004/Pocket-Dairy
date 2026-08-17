import { format, formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function RecycleBin({ onClose, onRestored }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null); // entry currently previewed
  const [working, setWorking] = useState(null); // id of entry being acted on

  async function load() {
    setLoading(true);
    try {
      const data = await api("/employee/trash");
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function restore(id) {
    setWorking(id);
    try {
      await api(`/employee/trash/${id}/restore`, { method: "POST" });
      setPreview(null);
      await load();
      onRestored?.();
    } finally {
      setWorking(null);
    }
  }

  async function deletePermanently(id) {
    if (!confirm("Permanently delete this entry? This cannot be undone.")) return;
    setWorking(id);
    try {
      await api(`/employee/trash/${id}`, { method: "DELETE" });
      setPreview(null);
      await load();
    } finally {
      setWorking(null);
    }
  }

  function daysLeft(entry) {
    if (!entry.deleted_at) return null;
    const deleted = new Date(entry.deleted_at);
    const expiry = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal bin-modal">
        <button className="close" onClick={onClose}>×</button>
        <span className="eyebrow">🗑 RECYCLE BIN</span>
        <h2>Deleted entries</h2>
        <p className="bin-subtitle">Items are permanently deleted after 30 days.</p>

        {loading ? (
          <p className="empty">Loading…</p>
        ) : items.length === 0 ? (
          <p className="empty">Your bin is empty.</p>
        ) : (
          <div className="bin-list">
            {items.map((entry) => {
              const days = daysLeft(entry);
              const expiring = days !== null && days <= 7;
              return (
                <button
                  key={entry.id}
                  className={`bin-entry${expiring ? " expiring" : ""}`}
                  onClick={() => setPreview(entry)}
                >
                  <div className="bin-entry-left">
                    <span className={`bin-type ${entry.entry_type}`}>
                      {entry.entry_type === "plan" ? "Plan" : "Work done"}
                    </span>
                    <strong>{entry.task_name}</strong>
                    <small>{format(new Date(entry.entry_date), "dd MMM yyyy")}</small>
                  </div>
                  <div className="bin-entry-right">
                    {days !== null && (
                      <span className={`bin-days${expiring ? " bin-days-warn" : ""}`}>
                        {days <= 0 ? "Expiring…" : `${days}d left`}
                      </span>
                    )}
                    <span className="bin-ago">
                      {entry.deleted_at
                        ? formatDistanceToNow(new Date(entry.deleted_at), { addSuffix: true })
                        : ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Read-only entry preview */}
        {preview && (
          <div className="bin-preview">
            <div className="bin-preview-header">
              <span className="eyebrow">Preview — read only</span>
              <button className="close-preview" onClick={() => setPreview(null)}>×</button>
            </div>
            <b className={preview.entry_type}>
              {preview.entry_type === "plan" ? "Daily plan" : "Work done"}
            </b>
            <h3>{preview.task_name}</h3>
            {preview.client_name && <p className="bin-meta">Client: {preview.client_name}</p>}
            {preview.location && <p className="bin-meta">Location: {preview.location}</p>}
            {preview.description && <p className="bin-desc">{preview.description}</p>}
            <p className="bin-meta">
              Date: {format(new Date(preview.entry_date), "dd MMMM yyyy")}
            </p>
            <div className="bin-preview-actions">
              <button
                className="primary restore-btn"
                disabled={working === preview.id}
                onClick={() => restore(preview.id)}
              >
                {working === preview.id ? "Restoring…" : "↩ Restore entry"}
              </button>
              <button
                className="perm-delete-btn"
                disabled={working === preview.id}
                onClick={() => deletePermanently(preview.id)}
              >
                Delete forever
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
