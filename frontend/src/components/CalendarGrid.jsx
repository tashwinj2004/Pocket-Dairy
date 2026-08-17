import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
} from "date-fns";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const today = new Date();

export default function CalendarGrid({
  month,
  entries = [],
  onSelect,
  readOnly = false,
  onMonthChange,
}) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  // Monday-first offset: shift Sunday (0) to position 6
  const blanks = Array.from({ length: (getDay(start) + 6) % 7 });
  const cells = [...blanks, ...eachDayOfInterval({ start, end })];

  function entriesFor(day) {
    return entries.filter((item) => item.entry_date === format(day, "yyyy-MM-dd"));
  }

  return (
    <section className="calendar-panel">
      {/* Month navigation */}
      <div className="calendar-top">
        <button onClick={() => onMonthChange && onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
        <div>
          <p>Daily update</p>
          <h1>{format(month, "MMMM yyyy")}</h1>
        </div>
        <button onClick={() => onMonthChange && onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
      </div>

      {/* Grid */}
      <div className="calendar">
        <div className="weekdays">
          {WEEK_DAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="days">
          {cells.map((day, index) =>
            day ? (
              <button
                className={`day${isSameDay(day, today) ? " today" : ""}`}
                key={format(day, "yyyy-MM-dd")}
                onClick={() => onSelect(day)}
              >
                <time>{format(day, "d")}</time>

                {(() => {
                  const dayEntries = entriesFor(day);
                  const planCount = dayEntries.filter((e) => e.entry_type === "plan").length;
                  const workCount = dayEntries.filter((e) => e.entry_type === "work_done").length;
                  if (dayEntries.length === 0) return null;
                  return (
                    <div className="entry-counts">
                      {planCount > 0 && (
                        <span className="entry-count plan-count">
                          {planCount}P
                        </span>
                      )}
                      {workCount > 0 && (
                        <span className="entry-count work-count">
                          {workCount}W
                        </span>
                      )}
                    </div>
                  );
                })()}
              </button>
            ) : (
              <div className="day blank" key={`blank-${index}`} />
            )
          )}
        </div>
      </div>

      {/* Legend */}
      <p className="legend">
        <i className="plan" /> Plan{" "}
        <i className="work_done" /> Work done{" "}
        {readOnly && "· Read-only employee view"}
      </p>
    </section>
  );
}

