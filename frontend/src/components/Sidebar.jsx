export default function Sidebar({
  user,
  isLeader,
  employees = [],
  selectedEmployee,
  onEmployee,
  onRefresh,
}) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand-mark">
        <span>P</span>
        <div>
          POCKET
          <br />
          DAIRY
        </div>
      </div>

      {/* Logged-in user profile — avatar + name/email inline */}
      <div className="profile">
        <div className="profile-row">
          <div className="avatar">{user?.full_name?.[0] || "U"}</div>
          <div className="profile-info">
            <strong>{user?.full_name}</strong>
            <small>{user?.employee_id}</small>
            <span className="profile-email">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Employee list (leader only) */}
      {isLeader && (
        <div className="team">
          <p>EMPLOYEES</p>
          {employees.map((employee) => (
            <button
              key={employee.id}
              className={
                selectedEmployee?.id === employee.id ? "employee active" : "employee"
              }
              onClick={() => onEmployee(employee)}
            >
              {employee.full_name}
              <small>{employee.employee_id}</small>
            </button>
          ))}
        </div>
      )}

      {/* Bottom: refresh button for leaders */}
      {isLeader && onRefresh && (
        <div className="sidebar-bottom">
          <button className="sidebar-refresh" onClick={onRefresh} title="Refresh employee data">
            ↻ Refresh
          </button>
        </div>
      )}
    </aside>
  );
}
