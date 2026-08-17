import { format } from "date-fns";
import { useState } from "react";

const EMPTY_FORM = {
  entry_type: "plan",
  task_name: "",
  client_name: "",
  location: "",
  description: "",
};

export default function EmployeeModal({ day, entries, onClose, onCreate, onEdit, onDelete }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null); // id of entry being edited
  const [saving, setSaving] = useState(false);

  const taskReady = form.task_name.trim().length >= 5;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await onEdit(editingId, {
          entry_type: form.entry_type,
          task_name: form.task_name,
          client_name: form.client_name,
          location: form.location,
          description: form.description,
        });
        setEditingId(null);
      } else {
        await onCreate({ ...form, entry_date: format(day, "yyyy-MM-dd") });
      }
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  }

  function field(key) {
    return (e) => setForm({ ...form, [key]: e.target.value });
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setForm({
      entry_type: entry.entry_type,
      task_name: entry.task_name,
      client_name: entry.client_name || "",
      location: entry.location || "",
      description: entry.description || "",
    });
    // Scroll form into view
    document.getElementById("entry-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="close" onClick={onClose}>×</button>

        <span className="eyebrow">{format(day, "EEEE · dd MMMM yyyy")}</span>
        <h2>Daily update</h2>

        {/* Existing entries */}
        <div className="entry-list">
          {entries.map((entry) => (
            <article key={entry.id} className={editingId === entry.id ? "editing" : ""}>
              <div className="entry-body">
                <b className={entry.entry_type}>
                  {entry.entry_type === "plan" ? "Daily plan" : "Work done"}
                </b>
                <strong>{entry.task_name}</strong>
                <span>
                  {entry.client_name}
                  {entry.location && ` · ${entry.location}`}
                </span>
                {entry.description && <p>{entry.description}</p>}
              </div>
              <div className="entry-actions">
                <button
                  className="edit-btn"
                  title="Edit entry"
                  onClick={() => startEdit(entry)}
                >
                  Edit
                </button>
                <button className="delete" onClick={() => onDelete(entry.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Add / Edit form */}
        <form id="entry-form" onSubmit={submit}>
          <div className="form-header-row">
            <span className="form-label">{editingId ? "✏ Editing entry" : "New entry"}</span>
            {editingId && (
              <button type="button" className="cancel-edit" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>

          <div className="type-tabs">
            <button
              type="button"
              className={form.entry_type === "plan" ? "selected" : ""}
              onClick={() => setForm({ ...form, entry_type: "plan" })}
            >
              Daily plan
            </button>
            <button
              type="button"
              className={form.entry_type === "work_done" ? "selected" : ""}
              onClick={() => setForm({ ...form, entry_type: "work_done" })}
            >
              Work done
            </button>
          </div>

          <input
            required
            placeholder="Task name (min 5 characters)"
            value={form.task_name}
            onChange={field("task_name")}
          />
          <input
            placeholder="Client name"
            value={form.client_name}
            onChange={field("client_name")}
            disabled={!taskReady}
            title={!taskReady ? "Enter a task name first" : ""}
            className={!taskReady ? "field-locked" : ""}
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={field("location")}
            disabled={!taskReady}
            title={!taskReady ? "Enter a task name first" : ""}
            className={!taskReady ? "field-locked" : ""}
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={field("description")}
            disabled={!taskReady}
            title={!taskReady ? "Enter a task name first" : ""}
            className={!taskReady ? "field-locked" : ""}
          />

          <button className="primary" disabled={saving}>
            {saving ? "Saving…" : editingId ? "Save changes" : "Add update"}
          </button>
        </form>
      </div>
    </div>
  );
}

