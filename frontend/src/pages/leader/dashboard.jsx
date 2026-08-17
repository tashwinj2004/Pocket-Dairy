import { format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

import CalendarGrid from "../../components/CalendarGrid";
import LeaderModal from "../../components/LeaderModal";
import Sidebar from "../../components/Sidebar";
import { api, clearSession, session } from "../../lib/api";

const POLL_INTERVAL_MS = 30_000; // auto-refresh every 30 seconds

export default function LeaderDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [month, setMonth] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [day, setDay] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const pollerRef = useRef(null);

  // Auth guard + initial employee list load
  useEffect(() => {
    const value = session();
    if (!value?.user || value.expiresAt < Date.now() || value.user.role !== "leader") {
      return router.replace("/");
    }
    setUser(value.user);

    api("/leader/employees")
      .then((data) => {
        setEmployees(data);
        setSelected(data[0] || null);
      })
      .catch(() => router.replace("/"));
  }, [router]);

  // Fetch entries — cache:no-store so browser never serves a stale cached response
  const loadEntries = useCallback(() => {
    if (!selected) return;
    api(
      `/leader/employees/${selected.id}/entries?month=${format(month, "yyyy-MM")}`,
      { headers: { "Cache-Control": "no-store" } }
    )
      .then((data) => {
        setEntries(data);
        setLastSynced(new Date());
      })
      .catch(() => {}); // silent — don't break UI on transient network errors
  }, [selected, month]);

  // Run immediately whenever employee/month changes, then poll every 30 s
  useEffect(() => {
    loadEntries();

    if (pollerRef.current) clearInterval(pollerRef.current);
    pollerRef.current = setInterval(loadEntries, POLL_INTERVAL_MS);

    return () => clearInterval(pollerRef.current);
  }, [loadEntries]);

  const chosenEntries = day
    ? entries.filter((x) => x.entry_date === format(day, "yyyy-MM-dd"))
    : [];

  return (
    <main className="app-shell">
      <Sidebar
        user={user}
        isLeader
        employees={employees}
        selectedEmployee={selected}
        onEmployee={(emp) => { setSelected(emp); setDay(null); }}
        onRefresh={loadEntries}
      />

      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="eyebrow">LEADER DASHBOARD</span>
            <h1>Team daily updates</h1>
            <p>
              {selected
                ? `Reviewing ${selected.full_name}'s calendar`
                : "Choose an employee to begin"}
            </p>
          </div>
          <div className="header-right">
            {lastSynced && (
              <span className="sync-label">
                Synced {format(lastSynced, "HH:mm:ss")}
              </span>
            )}
            <button
              className="logout-btn"
              onClick={() => { clearSession(); router.push("/"); }}
              title="Log out"
            >
              ⏻ Log out
            </button>
          </div>
        </header>

        {selected ? (
          <CalendarGrid
            month={month}
            entries={entries}
            readOnly
            onSelect={setDay}
            onMonthChange={setMonth}
          />
        ) : (
          <div className="empty-state">No employee accounts yet.</div>
        )}

        {day && (
          <LeaderModal
            day={day}
            employee={selected}
            entries={chosenEntries}
            onClose={() => setDay(null)}
          />
        )}
      </div>
    </main>
  );
}
