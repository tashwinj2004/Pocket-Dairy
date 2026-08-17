import { format } from "date-fns";

/**
 * Opens a hidden print window with plans on page 1 and work-done on page 2.
 * The browser's "Save as PDF" dialog will use the window title as the filename.
 */
function downloadDayReport(employee, day, entries) {
  const plans = entries.filter((e) => e.entry_type === "plan");
  const works = entries.filter((e) => e.entry_type === "work_done");

  const employeeName = employee?.full_name || "Employee";
  const dateStr = format(day, "dd MMMM yyyy");       // e.g. 17 August 2026
  const fileName = `${employeeName} ${format(day, "dd MMM yyyy")}`;

  function renderEntries(list, sectionTitle) {
    if (list.length === 0) {
      return `<p style="color:#888;">No ${sectionTitle.toLowerCase()} for this date.</p>`;
    }
    return list
      .map(
        (e) => `
        <div class="entry">
          <div class="entry-title">${e.task_name}</div>
          ${e.client_name ? `<div class="entry-meta">Client: ${e.client_name}</div>` : ""}
          ${e.location ? `<div class="entry-meta">Location: ${e.location}</div>` : ""}
          ${e.description ? `<div class="entry-desc">${e.description}</div>` : ""}
        </div>`
      )
      .join("");
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${fileName}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #17233b;
    }
    .page {
      padding: 40px 48px;
      min-height: 100vh;
    }
    .page + .page {
      page-break-before: always;
    }
    .header {
      border-bottom: 2px solid #315ec6;
      padding-bottom: 14px;
      margin-bottom: 28px;
    }
    .badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 3px 10px;
      border-radius: 5px;
      margin-bottom: 8px;
    }
    .badge.plan { background: #ffe1bd; color: #7a4500; }
    .badge.work { background: #cdeedf; color: #1a5c3a; }
    .header-title {
      font-size: 22px;
      font-weight: 800;
      margin: 4px 0 2px;
      color: #17233b;
    }
    .header-sub {
      font-size: 13px;
      color: #5a6e8c;
    }
    .entry {
      background: #f6f8fd;
      border-left: 4px solid #315ec6;
      border-radius: 0 8px 8px 0;
      padding: 14px 18px;
      margin-bottom: 14px;
    }
    .entry-title {
      font-size: 15px;
      font-weight: 700;
      color: #17233b;
      margin-bottom: 6px;
    }
    .entry-meta {
      font-size: 12px;
      color: #6a7c96;
      margin-bottom: 3px;
    }
    .entry-desc {
      font-size: 13px;
      color: #354060;
      margin-top: 8px;
      padding: 8px 12px;
      background: #edf0f8;
      border-radius: 5px;
    }
    .footer {
      margin-top: 40px;
      font-size: 11px;
      color: #aab3c4;
      text-align: right;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- PAGE 1: Daily Plans -->
  <div class="page">
    <div class="header">
      <div class="badge plan">Daily Plan</div>
      <div class="header-title">${employeeName}</div>
      <div class="header-sub">${dateStr} &nbsp;·&nbsp; ${plans.length} plan${plans.length !== 1 ? "s" : ""}</div>
    </div>
    ${renderEntries(plans, "Daily Plans")}
    <div class="footer">Pocket Dairy &nbsp;·&nbsp; Downloaded ${format(new Date(), "dd MMM yyyy, HH:mm")}</div>
  </div>

  <!-- PAGE 2: Work Done -->
  <div class="page">
    <div class="header">
      <div class="badge work">Work Done</div>
      <div class="header-title">${employeeName}</div>
      <div class="header-sub">${dateStr} &nbsp;·&nbsp; ${works.length} item${works.length !== 1 ? "s" : ""}</div>
    </div>
    ${renderEntries(works, "Work Done")}
    <div class="footer">Pocket Dairy &nbsp;·&nbsp; Downloaded ${format(new Date(), "dd MMM yyyy, HH:mm")}</div>
  </div>

</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}

export default function LeaderModal({ day, employee, entries, onClose }) {
  const plans = entries.filter((e) => e.entry_type === "plan");
  const works = entries.filter((e) => e.entry_type === "work_done");

  return (
    <div className="modal-backdrop">
      <div className="modal read-only">
        <button className="close" onClick={onClose}>×</button>

        <span className="eyebrow">
          {format(day, "EEEE · dd MMMM yyyy")}
        </span>
        <h2>{employee?.full_name || "Employee"}'s update</h2>

        {entries.length === 0 ? (
          <p className="empty">No updates for this date.</p>
        ) : (
          <>
            {/* Daily Plans section */}
            {plans.length > 0 && (
              <section className="leader-section">
                <h3 className="leader-section-title plan-title">
                  📋 Daily Plan <span className="section-count">{plans.length}</span>
                </h3>
                <div className="entry-list">
                  {plans.map((entry) => (
                    <article key={entry.id}>
                      <div>
                        <b className={entry.entry_type}>Daily plan</b>
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
              </section>
            )}

            {/* Work Done section */}
            {works.length > 0 && (
              <section className="leader-section">
                <h3 className="leader-section-title work-title">
                  ✅ Work Done <span className="section-count">{works.length}</span>
                </h3>
                <div className="entry-list">
                  {works.map((entry) => (
                    <article key={entry.id}>
                      <div>
                        <b className={entry.entry_type}>Work done</b>
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
              </section>
            )}

            {/* Download button */}
            <button
              className="download-report-btn"
              onClick={() => downloadDayReport(employee, day, entries)}
              title={`Download report for ${format(day, "dd MMM yyyy")}`}
            >
              ⬇ Download Report
            </button>
          </>
        )}
      </div>
    </div>
  );
}
