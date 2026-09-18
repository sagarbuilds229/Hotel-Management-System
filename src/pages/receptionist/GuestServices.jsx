import { useEffect, useState } from "react";
import { storage } from "../../utils/storage";
import { formatCurrency } from "../../utils/format";
import { serviceCatalog } from "../../data/mockServices";
import Card from "../../components/common/Card";

export default function GuestServices() {
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedRes, setSelectedRes] = useState("");
  const [serviceId, setServiceId] = useState("S01");
  const [qty, setQty] = useState(1);

  const load = () => {
    setReservations(storage.getReservations().filter(r=> r.status==="CheckedIn"));
    setOrders(storage.getServiceOrders());
  };
  useEffect(load,[]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!selectedRes) { alert("Select a guest reservation"); return; }
    const svc = serviceCatalog.find(s=> s.id===serviceId);
    const rec = {
      id: "SO" + String(Date.now()).slice(-4),
      reservationId: selectedRes,
      serviceId: svc.id,
      serviceName: svc.name,
      price: svc.price,
      qty: Number(qty),
      date: new Date().toISOString().slice(0,10),
      status: "Delivered"
    };
    const updated = [rec, ...storage.getServiceOrders()];
    storage.saveServiceOrders(updated);
    // Also need to update bill servicesTotal if bill exists
    const bills = storage.getBills();
    const bill = bills.find(b=> b.reservationId===selectedRes);
    if (bill) {
      bill.servicesTotal = (bill.servicesTotal||0) + svc.price*rec.qty;
      bill.tax = Math.round((bill.roomCharge*bill.nights + bill.servicesTotal)*0.1);
      bill.total = bill.roomCharge*bill.nights + bill.servicesTotal + bill.tax - (bill.discount||0);
      if (bill.paid >= bill.total) bill.status="Paid"; else bill.status="Pending";
      storage.saveBills(bills);
    }
    load();
  };

  const ordersForRes = selectedRes ? orders.filter(o=> o.reservationId===selectedRes) : orders.slice(0,8);

  return (
    <div className="page">
      <div className="page-head">
        <h2>Guest Service Management</h2>
        <p className="muted">Function 3: Add services / additional charges during stay. Charges flow into Billing.</p>
      </div>

      <div className="grid-2">
        <Card title="Add Service / Additional Charge">
          <form className="form" onSubmit={handleAdd}>
            <label>Guest (Checked-In only)
              <select value={selectedRes} onChange={e=>setSelectedRes(e.target.value)}>
                <option value="">-- Select Guest --</option>
                {reservations.map(r=> <option key={r.id} value={r.id}>{r.guestName} — Room {r.roomNumber} ({r.id})</option>)}
              </select>
            </label>
            {reservations.length===0 && <p className="alert alert-error">No guests currently checked in. Check-in a guest first.</p>}
            <label>Service
              <select value={serviceId} onChange={e=>setServiceId(e.target.value)}>
                {serviceCatalog.map(s=> <option key={s.id} value={s.id}>{s.name} — {formatCurrency(s.price)} ({s.category})</option>)}
              </select>
            </label>
            <label>Quantity
              <input type="number" min={1} value={qty} onChange={e=>setQty(e.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit">Add to Guest Bill</button>
          </form>
          <p className="muted small">RestaurantOwner charges also appear here — Receptionist merges them into final bill (shared Billing & Payment feature).</p>
        </Card>

        <Card title="Service Catalog (Mock)">
          <table className="table table-sm">
            <thead><tr><th>Service</th><th>Category</th><th>Price</th></tr></thead>
            <tbody>
              {serviceCatalog.map(s=> <tr key={s.id}><td>{s.name}</td><td>{s.category}</td><td>{formatCurrency(s.price)}</td></tr>)}
            </tbody>
          </table>
        </Card>
      </div>

      <Card title={selectedRes ? `Orders for ${selectedRes}` : "Recent Service Orders"}>
        <table className="table">
          <thead><tr><th>ID</th><th>Reservation</th><th>Service</th><th>Qty</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {ordersForRes.map(o=>(
              <tr key={o.id}><td>{o.id}</td><td>{o.reservationId}</td><td>{o.serviceName}</td><td>{o.qty}</td><td>{formatCurrency(o.price*o.qty)}</td><td>{o.date}</td><td>{o.status}</td></tr>
            ))}
            {ordersForRes.length===0 && <tr><td colSpan={7} className="muted">No service orders yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
