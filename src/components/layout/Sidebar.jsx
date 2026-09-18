import { NavLink } from "react-router-dom";

const links = [
  { to: "/receptionist/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/receptionist/guests", label: "Guest Management", icon: "👥" },
  { to: "/receptionist/reservations", label: "Reservations", icon: "📅" },
  { to: "/receptionist/checkin", label: "Check-In", icon: "🔑" },
  { to: "/receptionist/services", label: "Guest Services", icon: "🛎️" },
  { to: "/receptionist/billing", label: "Billing & Payment", icon: "💳" },
  { to: "/receptionist/checkout", label: "Check-Out", icon: "🚪" },
  { to: "/receptionist/complaints", label: "Complaints", icon: "⚠️" },
  { to: "/receptionist/reviews", label: "Reviews", icon: "⭐" },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <button className="sidebar-toggle" onClick={onToggle} title="Toggle sidebar">
        {collapsed ? "→" : "←"}
      </button>
      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} className={({isActive})=> isActive ? "nav-link active" : "nav-link"}>
            <span className="nav-icon">{l.icon}</span>
            {!collapsed && <span>{l.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        {!collapsed && <small>SE Lab • Sagar Bhagat<br/>Receptionist Role<br/><span style={{opacity:0.7}}>Phase 2: Auth • /receptionist/*</span></small>}
      </div>
    </aside>
  );
}
