import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import CalendarGrid from "../../components/CalendarGrid";
import LeaderModal from "../../components/LeaderModal";
import Sidebar from "../../components/Sidebar";
import { api, clearSession, session } from "../../lib/api";

export default function LeaderDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null); // currently-viewed employee
  const [month, setMonth] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [day, setDay] = useState(null);

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

  // Reload entries when selected employee or month changes
  useEffect(() => {
    if (selected) {
      api(`/leader/employees/${selected.id}/entries?month=${format(month, "yyyy-MM")}`)
        .then(setEntries);
    }
  }, [selected, month]);

  // Entries that belong to the selected day
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
        onEmployee={setSelected}
        onLogout={() => {
          clearSession();
          router.push("/");
        }}
      />

      <div className="dashboard">
        <header>
          <span className="eyebrow">LEADER DASHBOARD</span>
          <h1>Team daily updates</h1>
          <p>
            {selected
              ? `Reviewing ${selected.full_name}'s calendar`
              : "Choose an employee to begin"}
          </p>
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
