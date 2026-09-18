import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="app-shell">
      <Navbar />
      <div className="shell-body">
        <Sidebar collapsed={collapsed} onToggle={()=>setCollapsed(c=>!c)} />
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
