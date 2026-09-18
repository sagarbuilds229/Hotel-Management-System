import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storage } from "../../utils/storage";
import { formatCurrency } from "../../utils/format";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";

export default function Dashboard() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bills, setBills] = useState([]);

  useEffect(()=>{
    setReservations(storage.getReservations());
    setRooms(storage.getRooms());
    setComplaints(storage.getComplaints());
    setReviews(storage.getReviews());
    setBills(storage.getBills());
  },[]);

  const today = new Date().toISOString().slice(0,10);
  const checkInsToday = reservations.filter(r=> r.checkIn===today && r.status==="Reserved").length;
  const checkOutsToday = reservations.filter(r=> r.checkOut===today && r.status==="CheckedIn").length;
  const occupied = rooms.filter(r=> r.status==="Occupied").length;
  const revenue = bills.reduce((s,b)=> s+b.total, 0);
  const openComplaints = complaints.filter(c=> c.status!=="Resolved").length;
  const avgRating = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : "-";

  return (
    <div className="page">
      <div className="page-head">
        <h2>Receptionist Dashboard</h2>
        <p className="muted">Welcome, Sagar Bhagat • Today: {today} • Workflow: Reservation → Check-in → Services → Billing → Check-out → Receipt</p>
      </div>

      <div className="stats-grid">
        <Card><div className="stat"><span className="stat-num">{checkInsToday}</span><span className="stat-label">Check-ins Today</span></div></Card>
        <Card><div className="stat"><span className="stat-num">{checkOutsToday}</span><span className="stat-label">Check-outs Today</span></div></Card>
        <Card><div className="stat"><span className="stat-num">{occupied}/{rooms.length}</span><span className="stat-label">Occupied Rooms</span></div></Card>
        <Card><div className="stat"><span className="stat-num">{formatCurrency(revenue)}</span><span className="stat-label">Total Revenue (mock)</span></div></Card>
        <Card><div className="stat"><span className="stat-num">{openComplaints}</span><span className="stat-label">Open Complaints</span></div></Card>
        <Card><div className="stat"><span className="stat-num">{avgRating} ⭐</span><span className="stat-label">Avg Rating</span></div></Card>
      </div>

      <div className="quick-actions">
        <Link to="/receptionist/reservations" className="btn btn-primary">+ New Reservation</Link>
        <Link to="/receptionist/checkin" className="btn btn-outline">Check-In</Link>
        <Link to="/receptionist/checkout" className="btn btn-outline">Check-Out</Link>
        <Link to="/receptionist/services" className="btn btn-outline">Add Service</Link>
        <Link to="/receptionist/billing" className="btn btn-outline">Billing</Link>
      </div>

      <div className="grid-2">
        <Card title="Recent Reservations" action={<Link to="/receptionist/reservations" className="link">View all</Link>}>
          <table className="table">
            <thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Dates</th><th>Status</th></tr></thead>
            <tbody>
              {reservations.slice(0,5).map(r=>(
                <tr key={r.id}><td>{r.id}</td><td>{r.guestName}</td><td>{r.roomNumber||r.roomType}</td><td>{r.checkIn} → {r.checkOut}</td><td><Badge status={r.status}/></td></tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Pending Tasks">
          <ul className="list">
            <li>🔑 {reservations.filter(r=>r.status==="Reserved").length} guests awaiting check-in — <Link to="/receptionist/checkin">Handle</Link></li>
            <li>🚪 {reservations.filter(r=>r.status==="CheckedIn").length} guests in-house — <Link to="/receptionist/checkout">Check-out</Link></li>
            <li>⚠️ {openComplaints} unresolved complaints — <Link to="/receptionist/complaints">Resolve</Link></li>
            <li>💳 {reservations.filter(r=>r.status==="CheckedIn").length} bills pending — <Link to="/receptionist/billing">Billing</Link></li>
          </ul>
        </Card>
      </div>

      <Card title="Room Availability Snapshot">
        <div className="room-chips">
          {rooms.map(rm=> <span key={rm.id} className={`chip chip-${rm.status.toLowerCase()}`}>{rm.number} {rm.type} • {rm.status}</span>)}
        </div>
      </Card>
    </div>
  );
}
