import { useEffect, useState } from "react";
import { storage } from "../../utils/storage";
import { formatCurrency, calcNights } from "../../utils/format";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import BillPreview from "../../components/receptionist/BillPreview";
import Receipt from "../../components/receptionist/Receipt";

export default function Billing() {
  const [reservations, setReservations] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [payAmount, setPayAmount] = useState("");
  const [discount, setDiscount] = useState(0);

  const load = () => {
    setReservations(storage.getReservations());
    setBills(storage.getBills());
  };
  useEffect(load,[]);

  const ensureBillFor = (res) => {
    let bill = bills.find(b=> b.reservationId===res.id);
    if (bill) return bill;
    const serviceOrders = storage.getServiceOrders().filter(s=> s.reservationId===res.id);
    const servicesTotal = serviceOrders.reduce((s,x)=> s+ x.price*x.qty, 0);
    const nights = calcNights(res.checkIn, res.checkOut);
    const priceMap = { Standard:2000, Deluxe:3500, Suite:6000 };
    const roomCharge = priceMap[res.roomType]||2000;
    const tax = Math.round((roomCharge*nights + servicesTotal)*0.1);
    const total = roomCharge*nights + servicesTotal + tax;
    const newBill = {
      id: "B" + String(Date.now()).slice(-4),
      reservationId: res.id,
      guestName: res.guestName,
      roomNumber: res.roomNumber || "-",
      checkIn: res.checkIn,
      checkOut: res.checkOut,
      nights, roomCharge, servicesTotal, tax, discount:0, total, paid: res.advance||0, paymentMethod:"-", status: ( (res.advance||0) >= total ? "Paid" : "Pending")
    };
    const nb = [...bills, newBill];
    storage.saveBills(nb);
    setBills(nb);
    return newBill;
  };

  const selectedBill = bills.find(b=> b.reservationId===selectedId) || (selectedId ? ensureBillFor(reservations.find(r=>r.id===selectedId)) : null);
  const due = selectedBill ? Math.max(0, selectedBill.total - (selectedBill.paid||0)) : 0;

  const handlePay = () => {
    if (!selectedBill) return;
    const amt = Number(payAmount);
    if (!amt || amt<=0) { alert("Enter valid amount"); return; }
    if (amt > due) { alert("Amount exceeds due"); return; }
    const updated = bills.map(b=> b.reservationId===selectedId ? {
      ...b,
      paid: (b.paid||0) + amt,
      paymentMethod,
      discount: Number(discount)||0,
      // recalc total if discount changed
      total: b.roomCharge*b.nights + b.servicesTotal + b.tax - (Number(discount)||0),
      status: ((b.paid||0)+amt) >= (b.roomCharge*b.nights + b.servicesTotal + b.tax - (Number(discount)||0)) ? "Paid" : "Pending"
    } : b);
    // fix discount calc for target bill
    const target = updated.find(b=> b.reservationId===selectedId);
    if (target) {
      target.total = target.roomCharge*target.nights + target.servicesTotal + target.tax - (Number(discount)||0);
      target.status = target.paid >= target.total ? "Paid" : "Pending";
    }
    storage.saveBills(updated);
    setBills(updated);
    setPayAmount("");
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2>Billing & Payment</h2>
        <p className="muted">Shared feature: Receptionist + Restaurant Owner. Here Receptionist generates bill, collects payment, prints receipt.</p>
      </div>

      <div className="grid-2">
        <Card title="Select Guest / Reservation">
          <select value={selectedId} onChange={e=>setSelectedId(e.target.value)} style={{width:"100%", padding:8}}>
            <option value="">-- Choose reservation --</option>
            {reservations.filter(r=> r.status!=="Reserved" || true).map(r=> <option key={r.id} value={r.id}>{r.id} — {r.guestName} — Room {r.roomNumber||r.roomType} — {r.status}</option>)}
          </select>
          <div style={{marginTop:12}}>
            <table className="table table-sm">
              <thead><tr><th>ID</th><th>Guest</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {reservations.slice(0,6).map(r=>(
                  <tr key={r.id}><td>{r.id}</td><td>{r.guestName}</td><td><Badge status={r.status}/></td><td><button className="btn btn-sm btn-outline" onClick={()=>setSelectedId(r.id)}>View Bill</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Bill Preview">
          {selectedBill ? <BillPreview bill={selectedBill} /> : <p className="muted">Select a reservation to preview bill.</p>}
        </Card>
      </div>

      {selectedBill && (
        <div className="grid-2">
          <Card title="Make Payment">
            <div className="form">
              <p>Due: <strong>{formatCurrency(due)}</strong> {selectedBill.status==="Paid" && "— Already Paid ✓"}</p>
              <label>Discount (₹) <input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0" /></label>
              <label>Payment Method
                <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
                  <option>Cash</option><option>Card</option><option>UPI</option><option>Net Banking</option>
                </select>
              </label>
              <label>Amount to Pay <input type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)} placeholder={String(due)} /></label>
              <button className="btn btn-primary" onClick={handlePay} disabled={due===0}>Pay {payAmount ? formatCurrency(payAmount) : ""}</button>
              {due===0 && <p className="muted small">No due. Ready for check-out → <a href="/receptionist/checkout">Go to Check-Out</a></p>}
            </div>
          </Card>
          <Card title="Receipt (Printable)">
            <Receipt bill={selectedBill} />
          </Card>
        </div>
      )}

      <Card title="All Bills">
        <table className="table">
          <thead><tr><th>Bill ID</th><th>Reservation</th><th>Guest</th><th>Total</th><th>Paid</th><th>Due</th><th>Method</th><th>Status</th></tr></thead>
          <tbody>
            {bills.map(b=>(
              <tr key={b.id}><td>{b.id}</td><td>{b.reservationId}</td><td>{b.guestName}</td><td>{formatCurrency(b.total)}</td><td>{formatCurrency(b.paid)}</td><td>{formatCurrency(Math.max(0,b.total-b.paid))}</td><td>{b.paymentMethod}</td><td><Badge status={b.status}/></td></tr>
            ))}
            {bills.length===0 && <tr><td colSpan={8} className="muted">No bills yet. Select a reservation to generate.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
