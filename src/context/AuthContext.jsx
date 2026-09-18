import { createContext, useContext, useEffect, useState } from "react";

// Demo Receptionist account - shown on Login page for viva demo (no backend)
const DEMO_RECEPTIONIST = {
  name: "Sagar Bhagat",
  email: "receptionist@hotel.com",
  phone: "9876543210",
  password: "123456",
  role: "receptionist",
};

const AuthContext = createContext(null);

function ensureDemoSeed() {
  try {
    const raw = localStorage.getItem("hms_users");
    let users = raw ? JSON.parse(raw) : [];
    const exists = users.some(u => u.email.toLowerCase() === DEMO_RECEPTIONIST.email.toLowerCase());
    if (!exists) {
      users.unshift(DEMO_RECEPTIONIST);
      localStorage.setItem("hms_users", JSON.stringify(users));
    }
    // also ensure at least the demo exists even if corrupted
    if (!raw) localStorage.setItem("hms_users", JSON.stringify([DEMO_RECEPTIONIST]));
  } catch {
    localStorage.setItem("hms_users", JSON.stringify([DEMO_RECEPTIONIST]));
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("hms_auth");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  // Seed demo account once on load (frontend prototype only)
  useEffect(() => { ensureDemoSeed(); }, []);

  // Keep isAuthenticated in sync across tabs
  useEffect(() => {
    const h = (e) => {
      if (e.key === "hms_auth") {
        try { setUser(e.newValue ? JSON.parse(e.newValue) : null); } catch {}
      }
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  const getUsers = () => {
    try {
      const raw = localStorage.getItem("hms_users");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  // Login: validate against localStorage mock DB (demo + registered users)
  // Returns { ok: true } or { ok: false, error: string }
  const login = ({ email, password, rememberMe }) => {
    const users = getUsers();
    const found = users.find(u => u.email.toLowerCase() === String(email).toLowerCase().trim());
    if (!found) {
      return { ok: false, error: "No account found with this email. Try Registration or use demo account." };
    }
    if (found.password !== String(password)) {
      return { ok: false, error: "Invalid password. Hint: demo password is 123456" };
    }
    // Role check: this project scope is Receptionist frontend
    // We allow any role to login, but non-receptionist will be redirected to info page.
    // For viva we emphasize Receptionist.
    const session = {
      name: found.name,
      email: found.email,
      phone: found.phone || "",
      role: found.role || "receptionist",
    };
    // Remember me: if false, we still store in localStorage for prototype simplicity,
    // but we annotate session with rememberMe flag for transparency (beginner-friendly).
    // NOTE: This is NOT production security - localStorage is insecure (mock only).
    localStorage.setItem("hms_auth", JSON.stringify(session));
    if (rememberMe !== undefined) localStorage.setItem("hms_remember", rememberMe ? "1" : "0");
    setUser(session);
    return { ok: true, user: session };
  };

  // Register: validate + store new user in hms_users
  const register = ({ name, email, phone, password, role }) => {
    const users = getUsers();
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) {
      return { ok: false, error: "Email already registered. Please login." };
    }
    const newUser = { name: name.trim(), email: email.trim(), phone: phone.trim(), password, role };
    users.push(newUser);
    localStorage.setItem("hms_users", JSON.stringify(users));
    // Auto-login after registration (common for prototype)
    const session = { name: newUser.name, email: newUser.email, phone: newUser.phone, role: newUser.role };
    localStorage.setItem("hms_auth", JSON.stringify(session));
    setUser(session);
    return { ok: true, user: session };
  };

  const logout = () => {
    localStorage.removeItem("hms_auth");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      demoReceptionist: DEMO_RECEPTIONIST,
      getUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
