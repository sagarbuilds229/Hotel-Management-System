import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "Sagar Bhagat",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "receptionist",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full Name is required";
    else if (form.name.trim().length < 3) e.name = "Name must be at least 3 characters";

    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email address";

    if (!form.phone.trim()) e.phone = "Phone Number is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = "Enter valid 10-digit phone (starts 6-9)";

    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters";

    if (!form.confirmPassword) e.confirmPassword = "Confirm Password is required";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";

    if (!form.role) e.role = "Role is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handle = (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;

    // For college project scope: only Receptionist dashboard is implemented.
    // We allow registration with any role but warn if non-receptionist.
    if (form.role !== "receptionist") {
      const proceed = window.confirm(
        `You selected "${form.role}". Note: This project implements ONLY Receptionist dashboard.\n\nAdministrator / Restaurant Owner / Housekeeping dashboards are NOT built (as per your scope).\n\nIf you continue, you can register but will not see a dashboard for that role. For viva demo, use "Receptionist".\n\nProceed with ${form.role}?`
      );
      if (!proceed) return;
    }

    const res = register({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      role: form.role,
    });
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    // After successful registration, redirect based on role
    if (res.user.role === "receptionist") {
      nav("/receptionist/dashboard");
    } else {
      // For non-receptionist, keep mock login but inform
      alert(`Registered as ${res.user.role}. Receptionist dashboard is the only implemented panel. Login as Receptionist for full demo.`);
      nav("/login");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{maxWidth:520}}>
        <div className="auth-head">
          <h1>Create Account</h1>
          <p>Hotel Management — Registration (All users) • Demo for Receptionist • Sagar Bhagat</p>
        </div>

        <form onSubmit={handle} className="form" noValidate>
          {serverError && <div className="alert alert-error">{serverError}</div>}

          <label>Full Name *
            <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Sagar Bhagat" className={errors.name ? "input-error" : ""} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>

          <div className="grid-2" style={{gap:12}}>
            <label>Email *
              <input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="you@hotel.com" className={errors.email ? "input-error" : ""} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>
            <label>Phone Number *
              <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="9876543210" className={errors.phone ? "input-error" : ""} />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </label>
          </div>

          <div className="grid-2" style={{gap:12}}>
            <label>Password *
              <input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} placeholder="Min 6 characters" className={errors.password ? "input-error" : ""} />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </label>
            <label>Confirm Password *
              <input type="password" value={form.confirmPassword} onChange={e=>setForm({...form, confirmPassword:e.target.value})} placeholder="Repeat password" className={errors.confirmPassword ? "input-error" : ""} />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </label>
          </div>

          <label>Role *
            <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})} className={errors.role ? "input-error" : ""}>
              <option value="receptionist">Receptionist — Sagar Bhagat (Implemented)</option>
              <option value="user">User / Customer — (Not in this panel)</option>
              <option value="administrator">Administrator — (Not implemented)</option>
              <option value="restaurant">Restaurant Owner — (Not implemented)</option>
              <option value="housekeeping">Housekeeping — (Not implemented)</option>
            </select>
            {errors.role && <span className="field-error">{errors.role}</span>}
            <span className="muted small">Assignment-1 scope: All can register, but this frontend implements only Receptionist flow. Other roles show info only.</span>
          </label>

          <button className="btn btn-primary btn-block" type="submit">Register</button>
        </form>

        <p className="auth-foot">Already have account? <Link to="/login">Login here</Link></p>
        <p className="security-note">⚠️ Mock registration stored in localStorage (hms_users). No backend yet — for college prototype only.</p>
      </div>
    </div>
  );
}
