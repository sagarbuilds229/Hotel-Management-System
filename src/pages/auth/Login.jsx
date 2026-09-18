import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login, demoReceptionist } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    email: demoReceptionist.email,
    password: demoReceptionist.password,
    rememberMe: true,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email / Username is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email address";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 3) e.password = "Password must be at least 3 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handle = (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    const res = login({ email: form.email.trim(), password: form.password, rememberMe: form.rememberMe });
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    // Role-based redirect: only receptionist has dashboard in this project
    if (res.user.role !== "receptionist") {
      // Still store session but inform user - scope is Receptionist frontend only
      alert(`Logged in as ${res.user.role}. This project implements Receptionist dashboard only. Please login as Receptionist to continue.`);
      // keep user on login? or allow but redirect to login? For prototype we log out non-receptionist
      // Instead we keep session but navigate to a placeholder - simplest: redirect to login info
      // We choose to redirect to /receptionist/dashboard only for receptionist, else show message on login page
      // Let's logout non-receptionist and show error
      // But to keep beginner-friendly, we just redirect receptionist correctly and block others via guard
      // So we still navigate - ProtectedRoute will handle role guard and show NotAllowed
    }
    nav("/receptionist/dashboard");
  };

  const handleForgot = (ev) => {
    ev.preventDefault();
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setForgotMsg("Please enter a valid email");
      return;
    }
    setForgotMsg(`If ${forgotEmail.trim()} exists (mock), a reset link would be sent. This is frontend prototype - no email is sent. Use demo password 123456.`);
  };

  const fillDemo = () => {
    setForm({ email: demoReceptionist.email, password: demoReceptionist.password, rememberMe: true });
    setErrors({});
    setServerError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <h1>🏨 Hotel Management</h1>
          <p>SE Lab • Sagar Bhagat — Receptionist</p>
          <span className="role-badge">Receptionist Login</span>
          <p className="muted small" style={{marginTop:8}}>Assignment-2: Login & Registration — All (including user) • This panel demonstrates Receptionist flow</p>
        </div>

        {/* Demo credentials box */}
        <div className="demo-box">
          <strong>Demo Receptionist Account</strong>
          <div className="demo-creds">
            <span><b>Email:</b> {demoReceptionist.email}</span>
            <span><b>Password:</b> {demoReceptionist.password}</span>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={fillDemo}>Fill Demo Credentials</button>
          <p className="muted small" style={{marginTop:6}}>Mock auth via localStorage — not production security. See AuthContext.jsx</p>
        </div>

        <form onSubmit={handle} className="form" noValidate>
          {serverError && <div className="alert alert-error">{serverError}</div>}

          <label>Email / Username *
            <input
              value={form.email}
              onChange={e=>setForm({...form, email:e.target.value})}
              placeholder="receptionist@hotel.com"
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>

          <label>Password *
            <input
              type="password"
              value={form.password}
              onChange={e=>setForm({...form, password:e.target.value})}
              placeholder="••••••"
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>

          <div className="form-row">
            <label className="checkbox">
              <input type="checkbox" checked={form.rememberMe} onChange={e=>setForm({...form, rememberMe:e.target.checked})} />
              Remember me
            </label>
            <button type="button" className="link-btn" onClick={()=>{ setShowForgot(v=>!v); setForgotMsg(""); }}>Forgot password?</button>
          </div>

          <button className="btn btn-primary btn-block" type="submit">Login</button>
        </form>

        {/* Forgot password UI (frontend only, mock) */}
        {showForgot && (
          <div className="forgot-box">
            <h4>Reset Password (Mock UI)</h4>
            <p className="muted small">Enter your email — in real backend this would send a reset link. Here it only shows a message.</p>
            <form onSubmit={handleForgot} className="form" style={{marginTop:8}}>
              <input value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="your email" />
              <button className="btn btn-outline btn-sm" type="submit">Send Reset Link (Mock)</button>
              {forgotMsg && <div className="alert alert-info">{forgotMsg}</div>}
            </form>
          </div>
        )}

        <p className="auth-foot">
          No account? <Link to="/register">Create Registration</Link>
          <br />
          <span className="muted small">Other roles: Administrator / Restaurant Owner / Housekeeping — dashboards not implemented (Receptionist scope only)</span>
        </p>
        <p className="security-note">⚠️ Frontend prototype only — localStorage auth is not secure for production. Do not use in real deployment.</p>
      </div>
    </div>
  );
}
