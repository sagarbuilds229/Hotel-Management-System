import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="brand">
          <span className="brand-icon">🏨</span>
          <div>
            <strong>HMS</strong> <span className="brand-sub">Receptionist Panel</span>
          </div>
        </div>
      </div>
      <div className="navbar-right">
        <div className="user-info">
          <span className="user-name">{user?.name || "Sagar Bhagat"}</span>
          <span className="user-role" style={{textTransform:"capitalize"}}>{user?.role || "Receptionist"}</span>
        </div>
        <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
