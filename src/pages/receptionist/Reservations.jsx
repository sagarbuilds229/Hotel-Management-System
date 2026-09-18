import { useEffect, useState, useMemo } from "react";
import { storage } from "../../utils/storage";
import { formatDate, formatCurrency, calcNights, todayISO } from "../../utils/format";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";

// ---------- helpers ----------
function overlaps(aStart, aEnd, bStart, bEnd) {
  const aS = new Date(aStart);
  const aE = new Date(aEnd);
  const bS = new Date(bStart);
  const bE = new Date(bEnd);
  // [checkIn, checkOut) — checkOut day is free
  return aS < bE && bS < aE;
}

function isRoomAvailable(roomNumber, checkIn, checkOut, reservations, rooms, excludeId = null) {
  if (!roomNumber || !checkIn || !checkOut) return true;
  if (new Date(checkOut) <= new Date(checkIn)) return true; // let validation handle
  const room = rooms.find((r) => r.number === roomNumber);
  if (!room) return false;
  if (room.status === "Maintenance") return false;
  // any active reservation overlapping this range for same room
  const active = ["Reserved", "CheckedIn", "Checked-in", "Checked In"];
  const conflict = reservations.some((r) => {
    if (excludeId && r.id === excludeId) return false;
    if (r.roomNumber !== roomNumber) return false;
    const st = (r.status || "").toLowerCase().replace(/[\s-]/g, "");
    if (!active.map((s) => s.toLowerCase().replace(/[\s-]/g, "")).includes(st)) return false;
    if (!r.checkIn || !r.checkOut) return false;
    return overlaps(checkIn, checkOut, r.checkIn, r.checkOut);
  });
  return !conflict;
}

function genReservationId() {
  return "R" + String(Date.now()).slice(-5) + String(Math.floor(Math.random() * 90 + 10));
}

const STATUS_OPTIONS = ["Reserved", "CheckedIn", "CheckedOut", "Cancelled"];
const ROOM_TYPES = ["Standard", "Deluxe", "Suite"];

export default function Reservations() {
  const [list, setList] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  // toasts
  const [toast, setToast] = useState("");

  // modals
  const [openNew, setOpenNew] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [selected, setSelected] = useState(null);

  // form state for New
  const [form, setForm] = useState({
    guestId: "",
    roomType: "Deluxe",
    roomNumber: "",
    checkIn: todayISO(),
    checkOut: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })(),
    guests: 1,
    advance: 0,
  });
  const [errors, setErrors] = useState({});
  const [availabilityMsg, setAvailabilityMsg] = useState("");

  // form state for Edit
  const [editForm, setEditForm] = useState({ guestId: "", roomType: "Deluxe", roomNumber: "", checkIn: "", checkOut: "", guests: 1, advance: 0 });
  const [editErrors, setEditErrors] = useState({});
  const [editAvailabilityMsg, setEditAvailabilityMsg] = useState("");

  const load = () => {
    setList(storage.getReservations());
    setRooms(storage.getRooms());
    setGuests(storage.getGuests());
  };
  useEffect(load, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // derived calculations for New form
  const newSelectedRoom = useMemo(() => rooms.find((r) => r.number === form.roomNumber), [rooms, form.roomNumber]);
  const newTariff = newSelectedRoom ? Number(newSelectedRoom.price) : 0;
  const newNights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 0;
    if (new Date(form.checkOut) <= new Date(form.checkIn)) return 0;
    return calcNights(form.checkIn, form.checkOut);
  }, [form.checkIn, form.checkOut]);
  const newTotal = newTariff * newNights;
  const newBalance = Math.max(0, newTotal - Number(form.advance || 0));

  // derived for Edit form
  const editSelectedRoom = useMemo(() => rooms.find((r) => r.number === editForm.roomNumber), [rooms, editForm.roomNumber]);
  const editTariff = editSelectedRoom ? Number(editSelectedRoom.price) : 0;
  const editNights = useMemo(() => {
    if (!editForm.checkIn || !editForm.checkOut) return 0;
    if (new Date(editForm.checkOut) <= new Date(editForm.checkIn)) return 0;
    return calcNights(editForm.checkIn, editForm.checkOut);
  }, [editForm.checkIn, editForm.checkOut]);
  const editTotal = editTariff * editNights;
  const editBalance = Math.max(0, editTotal - Number(editForm.advance || 0));

  // available rooms for New form's selected type + dates
  const availableRoomsForNew = useMemo(() => {
    return rooms.filter((r) => r.type === form.roomType);
  }, [rooms, form.roomType]);

  const availableRoomsForEdit = useMemo(() => {
    return rooms.filter((r) => r.type === editForm.roomType);
  }, [rooms, editForm.roomType]);

  // validate availability whenever room/dates change for New
  useEffect(() => {
    if (!form.roomNumber || !form.checkIn || !form.checkOut) { setAvailabilityMsg(""); return; }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) { setAvailabilityMsg(""); return; }
    const ok = isRoomAvailable(form.roomNumber, form.checkIn, form.checkOut, list, rooms);
    if (!ok) setAvailabilityMsg(`Room ${form.roomNumber} is unavailable for ${formatDate(form.checkIn)} → ${formatDate(form.checkOut)} (overlapping reservation or maintenance). Choose another room or change dates.`);
    else setAvailabilityMsg("");
  }, [form.roomNumber, form.checkIn, form.checkOut, list, rooms]);

  useEffect(() => {
    if (!editForm.roomNumber || !editForm.checkIn || !editForm.checkOut) { setEditAvailabilityMsg(""); return; }
    if (new Date(editForm.checkOut) <= new Date(editForm.checkIn)) { setEditAvailabilityMsg(""); return; }
    const ok = isRoomAvailable(editForm.roomNumber, editForm.checkIn, editForm.checkOut, list, rooms, selected?.id);
    if (!ok) setEditAvailabilityMsg(`Room ${editForm.roomNumber} is unavailable for ${formatDate(editForm.checkIn)} → ${formatDate(editForm.checkOut)}. Choose another room or change dates.`);
    else setEditAvailabilityMsg("");
  }, [editForm.roomNumber, editForm.checkIn, editForm.checkOut, list, rooms, selected]);

  // ----- filtering -----
  const filtered = list.filter((r) => {
    // search: guest name / id / phone / room number / type
    const q = search.trim().toLowerCase();
    const matchSearch = !q || [r.guestName, r.id, r.phone, r.roomNumber, r.roomType, r.guestId].some((v) => String(v || "").toLowerCase().includes(q));
    // status
    const normStatus = (r.status || "").toLowerCase().replace(/[\s-]/g, "");
    const filterNorm = statusFilter.toLowerCase().replace(/[\s-]/g, "");
    const matchStatus = statusFilter === "All" || normStatus === filterNorm;
    // date filter: show reservations where filter date lies inside [checkIn, checkOut) or equals checkIn
    let matchDate = true;
    if (dateFilter) {
      const d = new Date(dateFilter);
      const ci = new Date(r.checkIn);
      const co = new Date(r.checkOut);
      // if invalid dates, don't filter out
      if (!isNaN(ci) && !isNaN(co) && !isNaN(d)) {
        matchDate = d >= new Date(ci.toISOString().slice(0, 10)) && d < new Date(co.toISOString().slice(0, 10));
        // also allow exact checkIn match even if single night
        if (r.checkIn === dateFilter) matchDate = true;
      }
    }
    return matchSearch && matchStatus && matchDate;
  });

  const counts = {
    total: list.length,
    reserved: list.filter((r) => (r.status || "").toLowerCase().replace(/[\s-]/g, "") === "reserved").length,
    checkedin: list.filter((r) => { const s = (r.status || "").toLowerCase().replace(/[\s-]/g, ""); return s === "checkedin"; }).length,
    checkedout: list.filter((r) => { const s = (r.status || "").toLowerCase().replace(/[\s-]/g, ""); return s === "checkedout"; }).length,
    cancelled: list.filter((r) => (r.status || "").toLowerCase() === "cancelled").length,
  };

  // ----- validations -----
  const validateForm = (f, tariff, nights, total, excludeId = null) => {
    const e = {};
    if (!f.guestId) e.guestId = "Guest is required — select an existing registered guest";
    if (!f.roomType) e.roomType = "Room type is required";
    if (!f.roomNumber) e.roomNumber = "Room is required";
    if (!f.checkIn) e.checkIn = "Check-in date is required";
    if (!f.checkOut) e.checkOut = "Check-out date is required";
    if (f.checkIn && f.checkOut && new Date(f.checkOut) <= new Date(f.checkIn)) e.checkOut = "Check-out must be after check-in";
    if (!f.guests || Number(f.guests) < 1) e.guests = "At least 1 guest required";
    if (Number(f.guests) > 10) e.guests = "Maximum 10 guests";
    if (f.roomNumber && f.checkIn && f.checkOut && new Date(f.checkOut) > new Date(f.checkIn)) {
      const ok = isRoomAvailable(f.roomNumber, f.checkIn, f.checkOut, list, rooms, excludeId);
      if (!ok) e.roomNumber = `Room ${f.roomNumber} is unavailable for selected dates`;
    }
    const adv = Number(f.advance || 0);
    if (adv < 0) e.advance = "Advance cannot be negative";
    if (tariff && nights && adv > total) e.advance = `Advance (₹${adv}) cannot exceed total (₹${total})`;
    if (!tariff && f.roomNumber) e.roomNumber = e.roomNumber || "Selected room tariff invalid";
    if (nights === 0 && f.checkIn && f.checkOut) e.checkOut = e.checkOut || "Invalid date range";
    return e;
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const v = validateForm(form, newTariff, newNights, newTotal);
    setErrors(v);
    if (Object.keys(v).length) return;

    const guest = guests.find((g) => g.id === form.guestId);
    if (!guest) { setErrors({ guestId: "Selected guest not found. Please re-register." }); return; }

    const newId = genReservationId();
    const rec = {
      id: newId,
      guestId: guest.id,
      guestName: guest.name,
      phone: guest.phone,
      email: guest.email || "",
      roomId: newSelectedRoom?.id || null,
      roomNumber: form.roomNumber,
      roomType: form.roomType,
      bed: newSelectedRoom?.bed || "",
      floor: newSelectedRoom?.floor || null,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      guests: Number(form.guests),
      nights: newNights,
      pricePerNight: newTariff,
      roomTariff: newTariff,
      totalAmount: newTotal,
      advance: Number(form.advance) || 0,
      balance: newBalance,
      status: "Reserved",
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const updated = [rec, ...storage.getReservations()];
    storage.saveReservations(updated);

    // connect to guest data: set reservationId + mirror stay fields for downstream reuse
    const gList = storage.getGuests().map((g) => {
      if (g.id !== guest.id) return g;
      return {
        ...g,
        reservationId: newId,
        room: rec.roomNumber,
        roomType: rec.roomType,
        checkIn: rec.checkIn,
        checkOut: rec.checkOut,
        guests: rec.guests,
        status: "Reserved",
      };
    });
    storage.saveGuests(gList);

    load();
    setOpenNew(false);
    setForm({
      guestId: "",
      roomType: "Deluxe",
      roomNumber: "",
      checkIn: todayISO(),
      checkOut: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })(),
      guests: 1,
      advance: 0,
    });
    setErrors({});
    setAvailabilityMsg("");
    showToast(`Reservation ${newId} confirmed for ${guest.name} — Room ${rec.roomNumber} • ${newNights} night(s) • Advance ₹${rec.advance}`);
  };

  // View / Edit / Cancel triggers
  const startView = (r) => { setSelected(r); setOpenView(true); };
  const startEdit = (r) => {
    setSelected(r);
    setEditForm({
      guestId: r.guestId || "",
      roomType: r.roomType || "Deluxe",
      roomNumber: r.roomNumber || "",
      checkIn: r.checkIn || "",
      checkOut: r.checkOut || "",
      guests: r.guests || 1,
      advance: r.advance || 0,
    });
    setEditErrors({});
    setEditAvailabilityMsg("");
    setOpenEdit(true);
  };
  const startCancel = (r) => { setSelected(r); setOpenCancel(true); };

  const handleEditSave = (e) => {
    e.preventDefault();
    const v = validateForm(editForm, editTariff, editNights, editTotal, selected.id);
    setEditErrors(v);
    if (Object.keys(v).length) return;
    // preserve immutable fields
    const guest = guests.find((g) => g.id === editForm.guestId);
    const roomObj = rooms.find((r) => r.number === editForm.roomNumber);
    const updatedList = storage.getReservations().map((r) => {
      if (r.id !== selected.id) return r;
      // do not allow editing if already CheckedOut/Cancelled to Reserved blindly — keep logic but allow correction
      return {
        ...r,
        guestId: guest ? guest.id : r.guestId,
        guestName: guest ? guest.name : r.guestName,
        phone: guest ? guest.phone : r.phone,
        email: guest ? guest.email || r.email : r.email,
        roomId: roomObj?.id ?? r.roomId,
        roomNumber: editForm.roomNumber,
        roomType: editForm.roomType,
        bed: roomObj?.bed || r.bed,
        floor: roomObj?.floor ?? r.floor,
        checkIn: editForm.checkIn,
        checkOut: editForm.checkOut,
        guests: Number(editForm.guests),
        nights: editNights,
        pricePerNight: editTariff,
        roomTariff: editTariff,
        totalAmount: editTotal,
        advance: Number(editForm.advance) || 0,
        balance: editBalance,
        // status unchanged unless it was Reserved/CheckedIn — keep as is
      };
    });
    storage.saveReservations(updatedList);
    // sync guest if linked
    if (guest) {
      const gList = storage.getGuests().map((g) => {
        if (g.id !== guest.id) return g;
        return { ...g, room: editForm.roomNumber, roomType: editForm.roomType, checkIn: editForm.checkIn, checkOut: editForm.checkOut, guests: Number(editForm.guests) };
      });
      storage.saveGuests(gList);
    }
    load();
    setOpenEdit(false);
    showToast(`Reservation ${selected.id} updated`);
  };

  const confirmCancel = () => {
    const updated = storage.getReservations().map((r) => {
      if (r.id !== selected.id) return r;
      return { ...r, status: "Cancelled" };
    });
    storage.saveReservations(updated);
    // if room was occupied, free it — but only if this reservation was the one holding it
    // Do not blindly free: if roomNumber assigned and status was CheckedIn, set room Available
    if (selected.roomNumber) {
      const stillActiveForRoom = updated.some((r) => r.id !== selected.id && r.roomNumber === selected.roomNumber && ["Reserved", "CheckedIn"].includes(r.status) && overlaps(selected.checkIn, selected.checkOut, r.checkIn, r.checkOut));
      if (!stillActiveForRoom) {
        const statusNorm = (selected.status || "").toLowerCase().replace(/[\s-]/g, "");
        if (statusNorm === "checkedin") {
          const newRooms = storage.getRooms().map((rm) => rm.number === selected.roomNumber ? { ...rm, status: "Available" } : rm);
          storage.saveRooms(newRooms);
        }
      }
    }
    // sync guest status
    if (selected.guestId) {
      const gList = storage.getGuests().map((g) => g.id === selected.guestId ? { ...g, status: "Cancelled" } : g);
      storage.saveGuests(gList);
    }
    load();
    setOpenCancel(false);
    showToast(`Reservation ${selected.id} cancelled`);
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2>Reservations — Receptionist (Sagar Bhagat)</h2>
        <p className="muted">Guest Registration → Check Availability → Select Room → Nights & Tariff auto-calc → Advance → Confirm → Available for Check-in. LocalStorage: <code>hms_reservations</code> linked to <code>hms_guests</code>.</p>
      </div>

      {toast && <div className="alert alert-info" style={{ background: "#dcfce7", color: "#166534", borderColor: "#86efac" }}>{toast}</div>}

      <div className="stats-grid">
        <Card><div className="stat"><span className="stat-num">{counts.total}</span><span className="stat-label">Total</span></div></Card>
        <Card><div className="stat"><span className="stat-num">{counts.reserved}</span><span className="stat-label">Reserved</span></div></Card>
        <Card><div className="stat"><span className="stat-num">{counts.checkedin}</span><span className="stat-label">Checked-In</span></div></Card>
        <Card><div className="stat"><span className="stat-num">{counts.checkedout}</span><span className="stat-label">Checked-Out</span></div></Card>
        <Card><div className="stat"><span className="stat-num">{counts.cancelled}</span><span className="stat-label">Cancelled</span></div></Card>
      </div>

      <Card>
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", flex: 1 }}>
            <input className="input" placeholder="Search Guest / Reservation ID / Phone / Room" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320, flex: 1 }} />
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
              <option value="All">All Status</option>
              <option value="Reserved">Reserved</option>
              <option value="CheckedIn">Checked-in</option>
              <option value="CheckedOut">Checked-out</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              Date
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8 }} />
              {dateFilter && <button className="btn btn-ghost btn-sm" onClick={() => setDateFilter("")}>✕</button>}
            </label>
            <span className="muted small">{filtered.length} of {list.length}</span>
          </div>
          <button className="btn btn-primary" onClick={() => { setErrors({}); setAvailabilityMsg(""); setOpenNew(true); }}>+ New Reservation</button>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Reservation ID</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Room Type</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Nights</th>
                <th>Room Tariff</th>
                <th>Advance Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const tariff = r.roomTariff ?? r.pricePerNight ?? "-";
                const nights = r.nights ?? (r.checkIn && r.checkOut ? calcNights(r.checkIn, r.checkOut) : "-");
                const total = r.totalAmount ?? (typeof tariff === "number" && typeof nights === "number" ? tariff * nights : 0);
                const adv = Number(r.advance || 0);
                const bal = r.balance != null ? r.balance : Math.max(0, (total || 0) - adv);
                const canCancel = (r.status === "Reserved" || r.status === "CheckedIn") && r.status !== "Cancelled" && r.status !== "CheckedOut";
                return (
                  <tr key={r.id}>
                    <td><b>{r.id}</b><br /><small className="muted">{r.guestId || "-"}</small></td>
                    <td>
                      {r.guestName}<br /><small className="muted">{r.phone || ""}</small>
                    </td>
                    <td>{r.roomNumber ? <b>{r.roomNumber}</b> : <span className="muted">-</span>}</td>
                    <td>{r.roomType}</td>
                    <td>{r.checkIn ? formatDate(r.checkIn) : "-"}</td>
                    <td>{r.checkOut ? formatDate(r.checkOut) : "-"}</td>
                    <td>{r.guests ?? 1}</td>
                    <td>{nights}</td>
                    <td>{typeof tariff === "number" ? formatCurrency(tariff) : tariff}</td>
                    <td>{formatCurrency(adv)}</td>
                    <td><b>{formatCurrency(bal)}</b><br /><small className="muted">{formatCurrency(total)}</small></td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => startView(r)} title="View">👁️</button>
                        <button className="btn btn-outline btn-sm" onClick={() => startEdit(r)} title="Edit" disabled={r.status === "Cancelled" || r.status === "CheckedOut"} style={r.status === "Cancelled" || r.status === "CheckedOut" ? { opacity: 0.5 } : {}}>✏️</button>
                        {canCancel ? <button className="btn btn-outline btn-sm" style={{ color: "#dc2626", borderColor: "#fecaca" }} onClick={() => startCancel(r)} title="Cancel">✕</button> : <span className="muted small" style={{ padding: "6px" }}>-</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={13} className="muted" style={{ textAlign: "center", padding: 20 }}>No reservations found. Adjust search / status / date filters or create a new reservation.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Data Flow & Storage">
        <p className="muted small" style={{ lineHeight: 1.6 }}>
          <b>Guest Registration</b> (<code>hms_guests</code>) → <b>Select Guest</b> → <b>Check Room Availability</b> (overlap check per room + maintenance) → <b>Select Room</b> (filtered by type + available) → <b>Select Dates</b> → <b>Calculate Nights</b> (<code>checkOut - checkIn</code>) → <b>Tariff × Nights = Total</b> → <b>Advance ≤ Total</b> → <b>Reservation Confirmed</b> (<code>hms_reservations</code>) with <code>guestId</code> FK → Guest record updated (<code>reservationId</code>, room, dates, status) → <b>Available for Check-in</b> (Check-In page picks <code>Reserved</code>) → Billing reuses <code>totalAmount/advance/balance</code> → Check-Out.
        </p>
      </Card>

      {/* New Reservation Modal */}
      <Modal open={openNew} onClose={() => setOpenNew(false)} title="New Reservation">
        <form className="form" onSubmit={handleCreate}>
          <div className="grid-form">
            <label style={{ gridColumn: "1 / -1" }}>Select Existing Guest*
              <select className={errors.guestId ? "input-error" : ""} value={form.guestId} onChange={(e) => setForm({ ...form, guestId: e.target.value })} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}>
                <option value="">-- Choose registered guest --</option>
                {guests.map((g) => <option key={g.id} value={g.id}>{g.name} — {g.id} — {g.phone} {g.room ? `• Room ${g.room}` : ""}</option>)}
              </select>
              {errors.guestId && <span className="field-error">{errors.guestId}</span>}
              {guests.length === 0 && <span className="muted small">No guests found. Register via <a href="/receptionist/guests">Guest Management</a> first.</span>}
            </label>

            <label>Room Type*
              <select value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value, roomNumber: "" })}>
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.roomType && <span className="field-error">{errors.roomType}</span>}
            </label>

            <label>Available Room* {newTariff ? <small className="muted"> — ₹{newTariff}/night</small> : null}
              <select className={errors.roomNumber ? "input-error" : ""} value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}>
                <option value="">-- Select room --</option>
                {availableRoomsForNew.map((rm) => {
                  const avail = isRoomAvailable(rm.number, form.checkIn, form.checkOut, list, rooms);
                  const label = `${rm.number} — ${rm.type} — ${rm.bed} — ₹${rm.price}/night — Floor ${rm.floor} ${rm.status === "Maintenance" ? "• Maintenance" : avail ? "• Available" : "• Unavailable"}`;
                  return <option key={rm.number} value={rm.number} disabled={!avail || rm.status === "Maintenance"}>{label}</option>;
                })}
              </select>
              {errors.roomNumber && <span className="field-error">{errors.roomNumber}</span>}
              {availabilityMsg && <span className="field-error" style={{ background: "#fef2f2", padding: "6px 8px", borderRadius: 6, marginTop: 4 }}>{availabilityMsg}</span>}
              {!availabilityMsg && form.roomNumber && <span className="muted small" style={{ color: "#166534" }}>✓ Room {form.roomNumber} is available for selected dates.</span>}
            </label>

            <label>Check-in Date*
              <input type="date" className={errors.checkIn ? "input-error" : ""} value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
              {errors.checkIn && <span className="field-error">{errors.checkIn}</span>}
            </label>

            <label>Check-out Date*
              <input type="date" className={errors.checkOut ? "input-error" : ""} value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
              {errors.checkOut && <span className="field-error">{errors.checkOut}</span>}
            </label>

            <label>Number of Guests*
              <input type="number" min={1} max={10} className={errors.guests ? "input-error" : ""} value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} />
              {errors.guests && <span className="field-error">{errors.guests}</span>}
            </label>

            <label>Advance Payment (₹)
              <input type="number" min={0} className={errors.advance ? "input-error" : ""} value={form.advance} onChange={(e) => setForm({ ...form, advance: e.target.value })} placeholder="0" />
              {errors.advance && <span className="field-error">{errors.advance}</span>}
              <span className="muted small">Must not exceed total ₹{newTotal || 0}</span>
            </label>

            <div style={{ gridColumn: "1 / -1", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 8, padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 13 }}>
              <div>Tariff: <b>{newTariff ? formatCurrency(newTariff) : "-"}</b> <span className="muted">/night</span></div>
              <div>Nights: <b>{newNights || 0}</b> <span className="muted">({form.checkIn && form.checkOut ? `${formatDate(form.checkIn)} → ${formatDate(form.checkOut)}` : "-"})</span></div>
              <div>Total: <b>{formatCurrency(newTotal || 0)}</b> <span className="muted">= tariff × nights</span></div>
              <div>Advance: <b>{formatCurrency(Number(form.advance || 0))}</b></div>
              <div>Balance: <b style={{ color: newBalance > 0 ? "#92400e" : "#166534" }}>{formatCurrency(newBalance)}</b></div>
              <div>Status: <Badge status="Reserved" /></div>
              <div className="muted small" style={{ gridColumn: "1 / -1", marginTop: 4 }}>Nights auto = ceil((checkOut - checkIn)/24h). Advance required for confirmed booking; validated ≤ total. Paid at confirmation → balance carried to Billing.</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            <button type="button" className="btn btn-outline" onClick={() => setOpenNew(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Confirm Reservation</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={openView} onClose={() => setOpenView(false)} title={`Reservation — ${selected?.id || ""}`}>
        {selected && (() => {
          const tariff = selected.roomTariff ?? selected.pricePerNight ?? 0;
          const nights = selected.nights ?? calcNights(selected.checkIn, selected.checkOut);
          const total = selected.totalAmount ?? tariff * nights;
          const bal = selected.balance != null ? selected.balance : Math.max(0, total - Number(selected.advance || 0));
          return (
            <div className="form" style={{ gap: 10 }}>
              <div className="grid-form">
                <div><b>Reservation ID:</b> {selected.id}</div>
                <div><b>Status:</b> <Badge status={selected.status} /></div>
                <div><b>Guest:</b> {selected.guestName} <small className="muted">({selected.guestId})</small></div>
                <div><b>Phone:</b> {selected.phone}</div>
                <div><b>Email:</b> {selected.email || "-"}</div>
                <div><b>Room:</b> {selected.roomNumber ? `${selected.roomNumber} (${selected.roomType})` : `- (${selected.roomType})`}</div>
                <div><b>Bed / Floor:</b> {selected.bed || "-"} {selected.floor ? `• Floor ${selected.floor}` : ""}</div>
                <div><b>Guests:</b> {selected.guests}</div>
                <div><b>Check-in:</b> {formatDate(selected.checkIn)}</div>
                <div><b>Check-out:</b> {formatDate(selected.checkOut)}</div>
                <div><b>Nights:</b> {nights} <small className="muted">(auto: checkOut - checkIn)</small></div>
                <div><b>Room Tariff:</b> {formatCurrency(tariff)}/night</div>
                <div><b>Total Amount:</b> {formatCurrency(total)} <small className="muted">= {formatCurrency(tariff)} × {nights}</small></div>
                <div><b>Advance Paid:</b> {formatCurrency(selected.advance || 0)}</div>
                <div><b>Balance:</b> {formatCurrency(bal)}</div>
                <div><b>Created:</b> {selected.createdAt || "-"}</div>
              </div>
              <div className="alert alert-info">Stored in <code>hms_reservations</code> linked by <code>guestId={selected.guestId}</code> to <code>hms_guests</code>. Reused by Check-in → Billing → Check-out.</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn-outline" onClick={() => setOpenView(false)}>Close</button>
                <button className="btn btn-primary" onClick={() => { setOpenView(false); startEdit(selected); }} disabled={selected.status === "Cancelled" || selected.status === "CheckedOut"}>Edit</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Modal */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title={`Edit Reservation — ${selected?.id || ""}`}>
        <form className="form" onSubmit={handleEditSave}>
          <div className="grid-form">
            <label style={{ gridColumn: "1 / -1" }}>Guest*
              <select className={editErrors.guestId ? "input-error" : ""} value={editForm.guestId} onChange={(e) => setEditForm({ ...editForm, guestId: e.target.value })}>
                <option value="">-- Choose guest --</option>
                {guests.map((g) => <option key={g.id} value={g.id}>{g.name} — {g.id}</option>)}
              </select>
              {editErrors.guestId && <span className="field-error">{editErrors.guestId}</span>}
            </label>
            <label>Room Type*
              <select value={editForm.roomType} onChange={(e) => setEditForm({ ...editForm, roomType: e.target.value, roomNumber: "" })}>
                {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              {editErrors.roomType && <span className="field-error">{editErrors.roomType}</span>}
            </label>
            <label>Room* {editTariff ? <small className="muted"> — ₹{editTariff}/night</small> : null}
              <select className={editErrors.roomNumber ? "input-error" : ""} value={editForm.roomNumber} onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}>
                <option value="">-- Select room --</option>
                {availableRoomsForEdit.map((rm) => {
                  const avail = isRoomAvailable(rm.number, editForm.checkIn, editForm.checkOut, list, rooms, selected?.id);
                  const label = `${rm.number} — ${rm.type} — ₹${rm.price}/night ${rm.status === "Maintenance" ? "• Maintenance" : avail ? "• Available" : "• Unavailable"}`;
                  return <option key={rm.number} value={rm.number} disabled={!avail || rm.status === "Maintenance"}>{label}</option>;
                })}
              </select>
              {editErrors.roomNumber && <span className="field-error">{editErrors.roomNumber}</span>}
              {editAvailabilityMsg && <span className="field-error" style={{ background: "#fef2f2", padding: "6px 8px", borderRadius: 6, marginTop: 4 }}>{editAvailabilityMsg}</span>}
            </label>
            <label>Check-in*
              <input type="date" className={editErrors.checkIn ? "input-error" : ""} value={editForm.checkIn} onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })} />
              {editErrors.checkIn && <span className="field-error">{editErrors.checkIn}</span>}
            </label>
            <label>Check-out*
              <input type="date" className={editErrors.checkOut ? "input-error" : ""} value={editForm.checkOut} onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })} />
              {editErrors.checkOut && <span className="field-error">{editErrors.checkOut}</span>}
            </label>
            <label>Guests*
              <input type="number" min={1} max={10} className={editErrors.guests ? "input-error" : ""} value={editForm.guests} onChange={(e) => setEditForm({ ...editForm, guests: e.target.value })} />
              {editErrors.guests && <span className="field-error">{editErrors.guests}</span>}
            </label>
            <label>Advance (₹)
              <input type="number" min={0} className={editErrors.advance ? "input-error" : ""} value={editForm.advance} onChange={(e) => setEditForm({ ...editForm, advance: e.target.value })} />
              {editErrors.advance && <span className="field-error">{editErrors.advance}</span>}
              <span className="muted small">≤ total ₹{editTotal || 0}</span>
            </label>
            <div style={{ gridColumn: "1 / -1", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 8, padding: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 13 }}>
              <div>Tariff: <b>{editTariff ? formatCurrency(editTariff) : "-"}</b></div>
              <div>Nights: <b>{editNights || 0}</b></div>
              <div>Total: <b>{formatCurrency(editTotal || 0)}</b></div>
              <div>Advance: <b>{formatCurrency(Number(editForm.advance || 0))}</b></div>
              <div>Balance: <b>{formatCurrency(editBalance)}</b></div>
              <div>Status: <Badge status={selected?.status} /></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            <button type="button" className="btn btn-outline" onClick={() => setOpenEdit(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirm */}
      <Modal open={openCancel} onClose={() => setOpenCancel(false)} title="Confirm Cancellation">
        {selected && (
          <div>
            <p>Cancel reservation <b>{selected.id}</b> for <b>{selected.guestName}</b> (Room {selected.roomNumber || selected.roomType}, {formatDate(selected.checkIn)} → {formatDate(selected.checkOut)})?</p>
            <div className="alert alert-error" style={{ margin: "12px 0" }}>
              This will set status to <b>Cancelled</b> in <code>hms_reservations</code>. If checked-in, the room will be freed. This action can be reversed only by editing the reservation.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setOpenCancel(false)}>Keep Reservation</button>
              <button className="btn btn-primary" style={{ background: "#dc2626" }} onClick={confirmCancel}>Confirm Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
