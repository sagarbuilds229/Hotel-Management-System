import { useEffect, useState } from "react";
import { storage } from "../../utils/storage";
import { formatDate } from "../../utils/format";
import { required, isPhone, isEmail } from "../../utils/validators";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";

const ID_TYPES = ["Aadhaar", "Passport", "Driving License", "Voter ID", "PAN Card"];
const ROOM_TYPES = ["Standard", "Deluxe", "Suite"];
const STATUS_OPTS = ["Reserved", "CheckedIn", "CheckedOut"];

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  idProofType: "Aadhaar",
  idProofNumber: "",
  guests: 1,
  room: "",
  roomType: "Deluxe",
  checkIn: "",
  checkOut: "",
  status: "Reserved",
  specialRequest: "",
};

function genGuestId() {
  return "G" + String(Date.now()).slice(-4) + String(Math.floor(Math.random()*90+10));
}

export default function Guests() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [toast, setToast] = useState("");

  // modals
  const [openRegister, setOpenRegister] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  // forms
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editForm, setEditForm] = useState(emptyForm);
  const [editErrors, setEditErrors] = useState({});

  const load = () => setList(storage.getGuests());
  useEffect(load, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(()=> setToast(""), 3000);
  };

  // derived filtered
  const filtered = list.filter(g => {
    const normStatus = (g.status || "").toLowerCase();
    const filterNorm = statusFilter.toLowerCase();
    const matchStatus = statusFilter === "All" || normStatus === filterNorm || normStatus.replace("-","") === filterNorm.replace("-","") || normStatus.replace(" ","") === filterNorm.replace(" ","");
    // for Checked-in variations
    const statusOk = (() => {
      if (statusFilter==="All") return true;
      const s = (g.status||"").toLowerCase();
      const f = statusFilter.toLowerCase();
      if (f==="reserved") return s==="reserved";
      if (f==="checkedin") return s==="checkedin" || s==="checked-in";
      if (f==="checkedout") return s==="checkedout" || s==="checked-out";
      return s===f;
    })();
    const q = search.trim().toLowerCase();
    const matchSearch = !q || 
      (g.name||"").toLowerCase().includes(q) ||
      (g.id||"").toLowerCase().includes(q) ||
      (g.phone||"").includes(q) ||
      (g.room||"").toLowerCase().includes(q);
    return matchStatus && matchSearch && statusOk;
  });

  const validate = (f) => {
    const e = {};
    if (!required(f.name)) e.name = "Full name is required";
    if (!required(f.phone)) e.phone = "Phone is required";
    else if (!isPhone(f.phone)) e.phone = "Invalid phone (10 digits, starts 6-9)";
    if (f.email && !isEmail(f.email)) e.email = "Invalid email";
    if (!required(f.idProofType)) e.idProofType = "ID proof type required";
    if (!required(f.idProofNumber)) e.idProofNumber = "ID proof number required";
    if (!f.guests || Number(f.guests) < 1) e.guests = "At least 1 guest required";
    if (Number(f.guests) > 10) e.guests = "Maximum 10 guests";
    if (f.checkIn && f.checkOut && new Date(f.checkOut) <= new Date(f.checkIn)) e.checkOut = "Check-out must be after check-in";
    return e;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    const newGuest = {
      id: genGuestId(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      idProofType: form.idProofType,
      idProofNumber: form.idProofNumber.trim(),
      idProof: `${form.idProofType} - ${form.idProofNumber.trim()}`,
      guests: Number(form.guests),
      room: form.room.trim() || null,
      roomType: form.roomType,
      checkIn: form.checkIn || null,
      checkOut: form.checkOut || null,
      status: form.status,
      specialRequest: form.specialRequest.trim(),
      createdAt: new Date().toISOString().slice(0,10),
      reservationId: null,
    };
    const updated = [newGuest, ...storage.getGuests()];
    storage.saveGuests(updated);
    load();
    setOpenRegister(false);
    setForm(emptyForm);
    setErrors({});
    showToast(`Guest ${newGuest.name} registered successfully (${newGuest.id})`);
  };

  const startView = (g) => { setSelected(g); setOpenView(true); };
  const startEdit = (g) => {
    setSelected(g);
    setEditForm({
      name: g.name || "",
      phone: g.phone || "",
      email: g.email || "",
      address: g.address || "",
      idProofType: g.idProofType || "Aadhaar",
      idProofNumber: g.idProofNumber || (g.idProof ? g.idProof.split(" - ").slice(1).join(" - ") : ""),
      guests: g.guests || 1,
      room: g.room || "",
      roomType: g.roomType || "Deluxe",
      checkIn: g.checkIn || "",
      checkOut: g.checkOut || "",
      status: g.status || "Reserved",
      specialRequest: g.specialRequest || g.notes || "",
    });
    setEditErrors({});
    setOpenEdit(true);
  };
  const startDelete = (g) => { setSelected(g); setOpenDelete(true); };

  const handleEditSave = (e) => {
    e.preventDefault();
    const v = validate(editForm);
    setEditErrors(v);
    if (Object.keys(v).length) return;
    const updatedList = storage.getGuests().map(g => {
      if (g.id !== selected.id) return g;
      return {
        ...g,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        address: editForm.address.trim(),
        idProofType: editForm.idProofType,
        idProofNumber: editForm.idProofNumber.trim(),
        idProof: `${editForm.idProofType} - ${editForm.idProofNumber.trim()}`,
        guests: Number(editForm.guests),
        room: editForm.room.trim() || null,
        roomType: editForm.roomType,
        checkIn: editForm.checkIn || null,
        checkOut: editForm.checkOut || null,
        status: editForm.status,
        specialRequest: editForm.specialRequest.trim(),
      };
    });
    storage.saveGuests(updatedList);
    load();
    setOpenEdit(false);
    showToast(`Guest ${selected.id} updated successfully`);
  };

  const confirmDelete = () => {
    const updated = storage.getGuests().filter(g => g.id !== selected.id);
    storage.saveGuests(updated);
    load();
    setOpenDelete(false);
    showToast(`Guest ${selected.id} deleted`);
  };

  const counts = {
    total: list.length,
    reserved: list.filter(g=> (g.status||"").toLowerCase()==="reserved").length,
    checkedin: list.filter(g=> { const s=(g.status||"").toLowerCase(); return s==="checkedin"||s==="checked-in" }).length,
    checkedout: list.filter(g=> { const s=(g.status||"").toLowerCase(); return s==="checkedout"||s==="checked-out" }).length,
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2>Guest Management</h2>
        <p className="muted">Receptionist — Sagar Bhagat • Register guest → Guest List → Reservation / Check-in → Guest Account → Billing</p>
      </div>

      {toast && <div className="alert alert-info" style={{background:"#dcfce7", color:"#166534", borderColor:"#86efac"}}>{toast}</div>}

      <div className="stats-grid">
        <Card><div className="stat"><span className="stat-num">{counts.total}</span><span className="stat-label">Total Guests</span></div></Card>
        <Card><div className="stat"><span className="stat-num">{counts.reserved}</span><span className="stat-label">Reserved</span></div></Card>
        <Card><div className="stat"><span className="stat-num">{counts.checkedin}</span><span className="stat-label">Checked-In</span></div></Card>
        <Card><div className="stat"><span className="stat-num">{counts.checkedout}</span><span className="stat-label">Checked-Out</span></div></Card>
      </div>

      <Card>
        <div className="toolbar" style={{justifyContent:"space-between"}}>
          <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", flex:1}}>
            <input className="input" placeholder="Search by Name / Guest ID / Phone / Room" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:320, flex:1}} />
            <select className="input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{maxWidth:160}}>
              <option value="All">All Status</option>
              <option value="Reserved">Reserved</option>
              <option value="CheckedIn">Checked-in</option>
              <option value="CheckedOut">Checked-out</option>
            </select>
            <span className="muted small">{filtered.length} of {list.length} guests</span>
          </div>
          <button className="btn btn-primary" onClick={()=>{ setForm(emptyForm); setErrors({}); setOpenRegister(true); }}>+ Register New Guest</button>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Guest ID</th>
                <th>Guest Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g=>(
                <tr key={g.id}>
                  <td><b>{g.id}</b><br/><small className="muted">{g.idProofType || "-"}</small></td>
                  <td>{g.name}<br/><small className="muted">{g.address || "-"}</small></td>
                  <td>{g.phone}</td>
                  <td style={{maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}} title={g.email}>{g.email || "-"}</td>
                  <td>{g.room ? <span><b>{g.room}</b> <small className="muted">({g.roomType})</small></span> : <span className="muted">-</span>}</td>
                  <td>{g.checkIn ? formatDate(g.checkIn) : "-"}</td>
                  <td>{g.checkOut ? formatDate(g.checkOut) : "-"}</td>
                  <td>{g.guests || g.numGuests || 1}</td>
                  <td><Badge status={g.status || "Reserved"} /></td>
                  <td>
                    <div style={{display:"flex", gap:4, flexWrap:"wrap"}}>
                      <button className="btn btn-outline btn-sm" onClick={()=>startView(g)} title="View">👁️</button>
                      <button className="btn btn-outline btn-sm" onClick={()=>startEdit(g)} title="Edit">✏️</button>
                      <button className="btn btn-outline btn-sm" style={{color:"#dc2626", borderColor:"#fecaca"}} onClick={()=>startDelete(g)} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={10} className="muted" style={{textAlign:"center", padding:20}}>No guests found. Try adjusting search or filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Data Flow">
        <p className="muted small" style={{lineHeight:1.6}}>
          <b>Register Guest</b> → Save to <code>hms_guests</code> (localStorage) → <b>Guest List</b> → <b>Reservation</b> (link via guestId / phone) → <b>Check-in</b> (assign room, status → CheckedIn) → <b>Guest Account</b> (services, stay) → <b>Billing</b> (generate bill by reservation/guest) → <b>Check-out</b> (status → CheckedOut).<br/>
          Guest record keeps: id, name, phone, email, address, idProofType/Number, guests, room, roomType, checkIn, checkOut, status, specialRequest, reservationId — reusable by all downstream modules without backend.
        </p>
      </Card>

      {/* Register Modal */}
      <Modal open={openRegister} onClose={()=>setOpenRegister(false)} title="Register New Guest">
        <form className="form" onSubmit={handleRegister}>
          <div className="grid-form">
            <label>Full Name* 
              <input className={errors.name ? "input-error" : ""} value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="e.g. Aman Kumar" />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </label>
            <label>Phone Number*
              <input className={errors.phone ? "input-error" : ""} value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="10-digit mobile" />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </label>
            <label>Email
              <input className={errors.email ? "input-error" : ""} value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="optional" />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>
            <label>Number of Guests*
              <input type="number" min={1} max={10} className={errors.guests ? "input-error" : ""} value={form.guests} onChange={e=>setForm({...form, guests:e.target.value})} />
              {errors.guests && <span className="field-error">{errors.guests}</span>}
            </label>
            <label style={{gridColumn:"1 / -1"}}>Address
              <input value={form.address} onChange={e=>setForm({...form, address:e.target.value})} placeholder="House, Street, City, State" />
            </label>
            <label>ID Proof Type*
              <select value={form.idProofType} onChange={e=>setForm({...form, idProofType:e.target.value})}>
                {ID_TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.idProofType && <span className="field-error">{errors.idProofType}</span>}
            </label>
            <label>ID Proof Number*
              <input className={errors.idProofNumber ? "input-error" : ""} value={form.idProofNumber} onChange={e=>setForm({...form, idProofNumber:e.target.value})} placeholder="e.g. 1234 5678 9012" />
              {errors.idProofNumber && <span className="field-error">{errors.idProofNumber}</span>}
            </label>
            <label>Room Type
              <select value={form.roomType} onChange={e=>setForm({...form, roomType:e.target.value})}>
                {ROOM_TYPES.map(r=> <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label>Room Number
              <input value={form.room} onChange={e=>setForm({...form, room:e.target.value})} placeholder="e.g. 101 or leave blank" />
            </label>
            <label>Check-in Date
              <input type="date" value={form.checkIn} onChange={e=>setForm({...form, checkIn:e.target.value})} />
            </label>
            <label>Check-out Date
              <input type="date" className={errors.checkOut ? "input-error" : ""} value={form.checkOut} onChange={e=>setForm({...form, checkOut:e.target.value})} />
              {errors.checkOut && <span className="field-error">{errors.checkOut}</span>}
            </label>
            <label>Status
              <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
                {STATUS_OPTS.map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label>Special Request / Notes
              <input value={form.specialRequest} onChange={e=>setForm({...form, specialRequest:e.target.value})} placeholder="Optional" />
            </label>
            <label style={{gridColumn:"1 / -1"}}>Special Request / Notes (full)
              <textarea rows={2} value={form.specialRequest} onChange={e=>setForm({...form, specialRequest:e.target.value})} placeholder="Any special request, accessibility, meal preference..." />
            </label>
          </div>
          <div className="muted small" style={{marginTop:6}}>Fields marked * are required. Room / dates can be assigned later via Reservation / Check-in. Data saved to localStorage <code>hms_guests</code>.</div>
          <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginTop:12}}>
            <button type="button" className="btn btn-outline" onClick={()=>setOpenRegister(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Register Guest</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={openView} onClose={()=>setOpenView(false)} title={`Guest Details — ${selected?.id || ""}`}>
        {selected && (
          <div className="form" style={{gap:8}}>
            <div className="grid-form">
              <div><b>Guest ID:</b> {selected.id}</div>
              <div><b>Status:</b> <Badge status={selected.status} /></div>
              <div><b>Name:</b> {selected.name}</div>
              <div><b>Phone:</b> {selected.phone}</div>
              <div><b>Email:</b> {selected.email || "-"}</div>
              <div><b>Guests:</b> {selected.guests}</div>
              <div style={{gridColumn:"1 / -1"}}><b>Address:</b> {selected.address || "-"}</div>
              <div><b>ID Proof:</b> {selected.idProof || `${selected.idProofType} - ${selected.idProofNumber}`}</div>
              <div><b>Room:</b> {selected.room ? `${selected.room} (${selected.roomType})` : "-"}</div>
              <div><b>Check-in:</b> {selected.checkIn ? formatDate(selected.checkIn) : "-"}</div>
              <div><b>Check-out:</b> {selected.checkOut ? formatDate(selected.checkOut) : "-"}</div>
              <div><b>Reservation ID:</b> {selected.reservationId || "-"}</div>
              <div><b>Created:</b> {selected.createdAt || "-"}</div>
              <div style={{gridColumn:"1 / -1"}}><b>Special Request / Notes:</b> {selected.specialRequest || selected.notes || "-"}</div>
            </div>
            <div className="alert alert-info" style={{marginTop:8}}>This record is stored in <code>hms_guests</code> and is reused by Reservation ({selected.reservationId || "link by guestId/phone"}), Check-in/out and Billing modules.</div>
            <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
              <button className="btn btn-outline" onClick={()=>setOpenView(false)}>Close</button>
              <button className="btn btn-primary" onClick={()=>{ setOpenView(false); startEdit(selected); }}>Edit Guest</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={openEdit} onClose={()=>setOpenEdit(false)} title={`Edit Guest — ${selected?.id || ""}`}>
        <form className="form" onSubmit={handleEditSave}>
          <div className="grid-form">
            <label>Full Name* 
              <input className={editErrors.name ? "input-error" : ""} value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} />
              {editErrors.name && <span className="field-error">{editErrors.name}</span>}
            </label>
            <label>Phone Number*
              <input className={editErrors.phone ? "input-error" : ""} value={editForm.phone} onChange={e=>setEditForm({...editForm, phone:e.target.value})} />
              {editErrors.phone && <span className="field-error">{editErrors.phone}</span>}
            </label>
            <label>Email
              <input className={editErrors.email ? "input-error" : ""} value={editForm.email} onChange={e=>setEditForm({...editForm, email:e.target.value})} />
              {editErrors.email && <span className="field-error">{editErrors.email}</span>}
            </label>
            <label>Number of Guests*
              <input type="number" min={1} max={10} className={editErrors.guests ? "input-error" : ""} value={editForm.guests} onChange={e=>setEditForm({...editForm, guests:e.target.value})} />
              {editErrors.guests && <span className="field-error">{editErrors.guests}</span>}
            </label>
            <label style={{gridColumn:"1 / -1"}}>Address
              <input value={editForm.address} onChange={e=>setEditForm({...editForm, address:e.target.value})} />
            </label>
            <label>ID Proof Type*
              <select value={editForm.idProofType} onChange={e=>setEditForm({...editForm, idProofType:e.target.value})}>
                {ID_TYPES.map(t=> <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>ID Proof Number*
              <input className={editErrors.idProofNumber ? "input-error" : ""} value={editForm.idProofNumber} onChange={e=>setEditForm({...editForm, idProofNumber:e.target.value})} />
              {editErrors.idProofNumber && <span className="field-error">{editErrors.idProofNumber}</span>}
            </label>
            <label>Room Type
              <select value={editForm.roomType} onChange={e=>setEditForm({...editForm, roomType:e.target.value})}>
                {ROOM_TYPES.map(r=> <option key={r}>{r}</option>)}
              </select>
            </label>
            <label>Room Number
              <input value={editForm.room} onChange={e=>setEditForm({...editForm, room:e.target.value})} />
            </label>
            <label>Check-in Date
              <input type="date" value={editForm.checkIn} onChange={e=>setEditForm({...editForm, checkIn:e.target.value})} />
            </label>
            <label>Check-out Date
              <input type="date" className={editErrors.checkOut ? "input-error" : ""} value={editForm.checkOut} onChange={e=>setEditForm({...editForm, checkOut:e.target.value})} />
              {editErrors.checkOut && <span className="field-error">{editErrors.checkOut}</span>}
            </label>
            <label>Status
              <select value={editForm.status} onChange={e=>setEditForm({...editForm, status:e.target.value})}>
                {STATUS_OPTS.map(s=> <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>Special Request
              <input value={editForm.specialRequest} onChange={e=>setEditForm({...editForm, specialRequest:e.target.value})} />
            </label>
            <label style={{gridColumn:"1 / -1"}}>Special Request / Notes
              <textarea rows={2} value={editForm.specialRequest} onChange={e=>setEditForm({...editForm, specialRequest:e.target.value})} />
            </label>
          </div>
          <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginTop:12}}>
            <button type="button" className="btn btn-outline" onClick={()=>setOpenEdit(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={openDelete} onClose={()=>setOpenDelete(false)} title="Confirm Delete">
        {selected && (
          <div>
            <p>Are you sure you want to delete <b>{selected.name}</b> ({selected.id})?</p>
            <p className="muted small" style={{margin:"8px 0"}}>This will permanently remove the guest from localStorage. This action cannot be undone.</p>
            <div className="alert alert-error" style={{margin:"12px 0"}}>Guest record will be deleted from <code>hms_guests</code>.</div>
            <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
              <button className="btn btn-outline" onClick={()=>setOpenDelete(false)}>Cancel</button>
              <button className="btn btn-primary" style={{background:"#dc2626"}} onClick={confirmDelete}>Delete Guest</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
