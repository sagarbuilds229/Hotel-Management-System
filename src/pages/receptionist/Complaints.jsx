import { useEffect, useState } from "react";
import { storage } from "../../utils/storage";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";

export default function Complaints() {
  const [list, setList] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ reservationId:"", category:"Housekeeping", priority:"Medium", description:"" });

  const load = () => {
    setList(storage.getComplaints());
    setReservations(storage.getReservations().filter(r=> r.status==="CheckedIn"));
  };
  useEffect(load,[]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.reservationId || !form.description.trim()) { alert("Select guest and describe issue"); return; }
    const res = storage.getReservations().find(r=> r.id===form.reservationId);
    const rec = {
      id: "C" + String(Date.now()).slice(-4),
      reservationId: form.reservationId,
      guestName: res ? res.guestName : "Unknown",
      roomNumber: res ? res.roomNumber : "-",
      category: form.category,
      description: form.description.trim(),
      priority: form.priority,
      status: "Open",
      date: new Date().toISOString().slice(0,10),
    };
    const updated = [rec, ...storage.getComplaints()];
    storage.saveComplaints(updated);
    load();
    setOpen(false);
    setForm({ reservationId:"", category:"Housekeeping", priority:"Medium", description:"" });
  };

  const updateStatus = (id, status) => {
    const updated = list.map(c=> c.id===id ? {...c, status} : c);
    storage.saveComplaints(updated);
    setList(updated);
  };

  const filtered = filter==="All" ? list : list.filter(c=> c.status===filter);

  return (
    <div className="page">
      <div className="page-head">
        <h2>Complaint Management</h2>
        <p className="muted">Function 4: Log guest complaints, track status Open → In Progress → Resolved. Assigned by Receptionist.</p>
      </div>

      <Card>
        <div className="toolbar">
          <select value={filter} onChange={e=>setFilter(e.target.value)}>
            <option>All</option><option>Open</option><option>In Progress</option><option>Resolved</option>
          </select>
          <button className="btn btn-primary" onClick={()=>setOpen(true)}>+ Log Complaint</button>
          <span className="muted small">{filtered.length} records • {list.filter(c=>c.status==="Open").length} open</span>
        </div>
        <table className="table">
          <thead><tr><th>ID</th><th>Guest / Room</th><th>Category</th><th>Description</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(c=>(
              <tr key={c.id}>
                <td>{c.id}<br/><small className="muted">{c.date}</small></td>
                <td>{c.guestName}<br/><small className="muted">Room {c.roomNumber} • {c.reservationId}</small></td>
                <td>{c.category}</td><td style={{maxWidth:220}}>{c.description}</td>
                <td><Badge status={c.priority}/></td><td><Badge status={c.status}/></td>
                <td>
                  <div style={{display:"flex", gap:4, flexWrap:"wrap"}}>
                    {c.status==="Open" && <button className="btn btn-sm btn-outline" onClick={()=>updateStatus(c.id,"In Progress")}>Start</button>}
                    {c.status!=="Resolved" && <button className="btn btn-sm btn-primary" onClick={()=>updateStatus(c.id,"Resolved")}>Resolve</button>}
                    {c.status==="Resolved" && <span className="muted small">✓ Done</span>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={7} className="muted">No complaints in this filter.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={()=>setOpen(false)} title="Log New Complaint">
        <form className="form" onSubmit={handleCreate}>
          <label>Guest (Checked-In)
            <select value={form.reservationId} onChange={e=>setForm({...form, reservationId:e.target.value})}>
              <option value="">-- Select Guest --</option>
              {reservations.map(r=> <option key={r.id} value={r.id}>{r.guestName} — Room {r.roomNumber} ({r.id})</option>)}
            </select>
          </label>
          <label>Category
            <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
              <option>Housekeeping</option><option>Maintenance</option><option>Service</option><option>Food</option><option>Other</option>
            </select>
          </label>
          <label>Priority
            <select value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </label>
          <label>Description
            <textarea rows={3} value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Describe issue in detail" />
          </label>
          <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
            <button type="button" className="btn btn-ghost" onClick={()=>setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Complaint</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
