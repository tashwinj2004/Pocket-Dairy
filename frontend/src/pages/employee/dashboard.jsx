import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import CalendarGrid from "../../components/CalendarGrid";
import EmployeeModal from "../../components/EmployeeModal";
import RecycleBin from "../../components/RecycleBin";
import Sidebar from "../../components/Sidebar";
import { api, clearSession, session } from "../../lib/api";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function yearOptions() {
  const current = new Date().getFullYear();
  return Array.from({ length: 11 }, (_, i) => current - 5 + i);
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed

  // Derive the Date object used by CalendarGrid and API calls
  const month = new Date(selectedYear, selectedMonth, 1);

  const [entries, setEntries] = useState([]);
  const [day, setDay] = useState(null);
  const [binOpen, setBinOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    const value = session();
    if (!value?.user || value.expiresAt < Date.now() || value.user.role !== "employee") {
      return router.replace("/");
    }
    setUser(value.user);
  }, [router]);

  function load() {
    api(`/employee/entries?month=${format(month, "yyyy-MM")}`)
      .then(setEntries)
      .catch(() => {
        clearSession();
        router.replace("/");
      });
  }

  useEffect(() => {
    if (user) load();
  }, [user, selectedYear, selectedMonth]);

  const selectedEntries = day
    ? entries.filter((x) => x.entry_date === format(day, "yyyy-MM-dd"))
    : [];

  async function handleCreate(payload) {
    await api("/employee/entries", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    load();
  }

  async function handleEdit(id, payload) {
    await api(`/employee/entries/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    load();
  }

  async function handleDelete(id) {
    await api(`/employee/entries/${id}`, { method: "DELETE" });
    load();
  }

  // Sync CalendarGrid arrows back to year/month state
  function handleMonthChange(newDate) {
    setSelectedYear(newDate.getFullYear());
    setSelectedMonth(newDate.getMonth());
  }

  return (
    <main className="app-shell">
      <Sidebar
        user={user}
        onLogout={() => {
          clearSession();
          router.push("/");
        }}
      />

      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="eyebrow">EMPLOYEE DASHBOARD</span>
            <h1>Good day, {user?.full_name?.split(" ")[0]}</h1>
            <p>Plan ahead and record what you achieved.</p>
          </div>

          <div className="header-right">
            {/* Year / Month filter */}
            <div className="filter-bar">
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {yearOptions().map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>

            {/* Recycle Bin button */}
            <button className="bin-btn" onClick={() => setBinOpen(true)} title="Recycle Bin">
              🗑
            </button>
          </div>
        </header>

        <CalendarGrid
          month={month}
          entries={entries}
          onSelect={setDay}
          onMonthChange={handleMonthChange}
        />

        {day && (
          <EmployeeModal
            day={day}
            entries={selectedEntries}
            onClose={() => setDay(null)}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {binOpen && (
          <RecycleBin
            onClose={() => setBinOpen(false)}
            onRestored={load}
          />
        )}
      </div>
    </main>
  );
}

