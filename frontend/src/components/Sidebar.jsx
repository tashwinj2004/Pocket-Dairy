export default function Sidebar({
  user,
  isLeader,
  employees = [],
  selectedEmployee,
  onEmployee,
  onLogout,
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

      {/* Logged-in user profile */}
      <div className="profile">
        <div className="avatar">{user?.full_name?.[0] || "U"}</div>
        <strong>{user?.full_name}</strong>
        <small>{user?.employee_id}</small>
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

      {/* Bottom: email + logout */}
      <div className="sidebar-bottom">
        <span>{user?.email}</span>
        <button className="logout" onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
