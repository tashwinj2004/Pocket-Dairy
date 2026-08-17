import { format } from "date-fns";

export default function LeaderModal({ day, employee, entries, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal read-only">
        <button className="close" onClick={onClose}>
          ×
        </button>

        <span className="eyebrow">
          {format(day, "EEEE · dd MMMM yyyy")}
        </span>
        <h2>{employee?.full_name || "Employee"}'s update</h2>

        {entries.length ? (
          <div className="entry-list">
            {entries.map((entry) => (
              <article key={entry.id}>
                <div>
                  <b className={entry.entry_type}>
                    {entry.entry_type === "plan" ? "Daily plan" : "Work done"}
                  </b>
                  <strong>{entry.task_name}</strong>
                  <span>
                    {entry.client_name}
                    {entry.location && ` · ${entry.location}`}
                  </span>
                  <p>{entry.description || "No description"}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No updates for this date.</p>
        )}
      </div>
    </div>
  );
}
