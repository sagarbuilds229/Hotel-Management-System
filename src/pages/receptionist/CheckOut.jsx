import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storage } from "../../utils/storage";
import { calcNights } from "../../utils/format";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";

export default function CheckOut() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bills, setBills] = useState([]);

  const load = () => {
    setReservations(storage.getReservations());
    setRooms(storage.getRooms());
    setBills(storage.getBills());
  };
  useEffect(load,[]);

  const checkedIn = reservations.filter(r=> r.status==="CheckedIn");

  const canCheckout = (res) => {
    const bill = bills.find(b=> b.reservationId===res.id);
    if (!bill) return false;
    return bill.status==="Paid";
  };

  const doCheckOut = (res) => {
    const bill = bills.find(b=> b.reservationId===res.id);
    if (!bill || bill.status!=="Paid") { alert("Bill not paid yet! Go to Billing & complete payment first."); return; }
    // free room
    if (res.roomNumber) {
      const newRooms = rooms.map(r=> r.number===res.roomNumber ? {...r, status:"Available"} : r);
      storage.saveRooms(newRooms);
    }
    const newRes = reservations.map(r=> r.id===res.id ? {...r, status:"CheckedOut"} : r);
    storage.saveReservations(newRes);
    load();
  };

  // Auto-create bill helper for demo
  const ensureBill = (res) => {
    let bill = bills.find(b=> b.reservationId===res.id);
    if (bill) return bill;
    const serviceOrders = storage.getServiceOrders().filter(s=> s.reservationId===res.id);
    const servicesTotal = serviceOrders.reduce((s,x)=> s+ x.price*x.qty, 0);
    const nights = calcNights(res.checkIn, res.checkOut);
    const priceMap = { Standard:2000, Deluxe:3500, Suite:6000 };
    const roomCharge = priceMap[res.roomType]||2000;
    const roomTotal = roomCharge * nights;
    const tax = Math.round((roomTotal + servicesTotal)*0.1);
    const total = roomTotal + servicesTotal + tax;
    const newBill = {
      id: "B" + String(Date.now()).slice(-4),
      reservationId: res.id,
      guestName: res.guestName,
      roomNumber: res.roomNumber,
      checkIn: res.checkIn,
      checkOut: res.checkOut,
      nights, roomCharge, servicesTotal, tax, discount:0, total, paid: res.advance||0, paymentMethod:"-", status: (res.advance>=total?"Paid":"Pending")
    };
    const nb = [...bills, newBill];
    storage.saveBills(nb);
    setBills(nb);
    return newBill;
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2>Check-Out</h2>
        <p className="muted">Function 2B: Verify bill paid, free room, mark CheckedOut, generate receipt. Workflow ensures Billing → Payment → Check-out.</p>
      </div>

      <Card title={`Guests In-House (${checkedIn.length})`}>
        {checkedIn.length===0 ? <p className="muted">No guests currently checked in.</p> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Guest / Room</th><th>Stay</th><th>Bill Status</th><th>Action</th></tr></thead>
            <tbody>
              {checkedIn.map(r=>{
                const bill = ensureBill(r);
                const paid = bill.status==="Paid";
                return (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.guestName}<br/><small className="muted">Room {r.roomNumber} • {r.roomType}</small></td>
                    <td>{r.checkIn} → {r.checkOut}</td>
                    <td><Badge status={bill.status}/><br/><small>{bill.paid}/{bill.total} paid</small></td>
                    <td>
                      {!paid ? <Link to={`/receptionist/billing`} className="btn btn-outline btn-sm">Go to Billing</Link> : <button className="btn btn-primary btn-sm" onClick={()=>doCheckOut(r)}>Confirm Check-Out</button> }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Recently Checked-Out">
        <table className="table">
          <thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Status</th></tr></thead>
          <tbody>
            {reservations.filter(r=>r.status==="CheckedOut").slice(0,5).map(r=>(
              <tr key={r.id}><td>{r.id}</td><td>{r.guestName}</td><td>{r.roomNumber}</td><td><Badge status={r.status}/></td></tr>
            ))}
            {reservations.filter(r=>r.status==="CheckedOut").length===0 && <tr><td colSpan={4} className="muted">None yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
