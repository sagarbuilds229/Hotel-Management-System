import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/receptionist/Dashboard";
import Guests from "./pages/receptionist/Guests";
import Reservations from "./pages/receptionist/Reservations";
import CheckIn from "./pages/receptionist/CheckIn";
import CheckOut from "./pages/receptionist/CheckOut";
import GuestServices from "./pages/receptionist/GuestServices";
import Billing from "./pages/receptionist/Billing";
import Complaints from "./pages/receptionist/Complaints";
import Reviews from "./pages/receptionist/Reviews";
import NotFound from "./pages/NotFound";

function ProtectedReceptionist({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "receptionist") {
    return (
      <div className="auth-page" style={{background:"#f1f5f9"}}>
        <div className="auth-card" style={{textAlign:"center"}}>
          <h2>Access Restricted</h2>
          <p className="muted">You are logged in as <b>{user?.role}</b>.</p>
          <p className="muted small">This project implements <b>Receptionist dashboard only</b> (Sagar Bhagat scope). Administrator / Restaurant Owner / Housekeeping dashboards are not built as per Phase 2 instruction.</p>
          <p className="muted small">Please logout and login as Receptionist.</p>
          <div style={{marginTop:16, display:"flex", gap:8, justifyContent:"center"}}>
            <a href="/login" className="btn btn-outline" onClick={()=>{ localStorage.removeItem("hms_auth"); }}>Logout & Go to Login</a>
          </div>
        </div>
      </div>
    );
  }
  return children;
}

function PublicOnly({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    // Receptionist goes to dashboard, others also blocked but send to receptionist guard to show message
    if (user?.role === "receptionist") return <Navigate to="/receptionist/dashboard" replace />;
    return <Navigate to="/receptionist/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      {/* Protected Receptionist */}
      <Route path="/receptionist" element={<ProtectedReceptionist><Layout /></ProtectedReceptionist>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="guests" element={<Guests />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="checkin" element={<CheckIn />} />
        <Route path="checkout" element={<CheckOut />} />
        <Route path="services" element={<GuestServices />} />
        <Route path="billing" element={<Billing />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="reviews" element={<Reviews />} />
      </Route>

      {/* Legacy redirects - keep old paths working for viva */}
      <Route path="/dashboard" element={<Navigate to="/receptionist/dashboard" replace />} />
      <Route path="/guests" element={<Navigate to="/receptionist/guests" replace />} />
      <Route path="/reservations" element={<Navigate to="/receptionist/reservations" replace />} />
      <Route path="/checkin" element={<Navigate to="/receptionist/checkin" replace />} />
      <Route path="/checkout" element={<Navigate to="/receptionist/checkout" replace />} />
      <Route path="/services" element={<Navigate to="/receptionist/services" replace />} />
      <Route path="/billing" element={<Navigate to="/receptionist/billing" replace />} />
      <Route path="/complaints" element={<Navigate to="/receptionist/complaints" replace />} />
      <Route path="/reviews" element={<Navigate to="/receptionist/reviews" replace />} />

      {/* Root */}
      <Route path="/" element={<Navigate to="/receptionist/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
