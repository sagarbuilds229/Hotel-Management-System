import { useEffect, useState } from "react";
import { storage } from "../../utils/storage";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";

export default function CheckIn() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);

  const load = () => {
    setReservations(storage.getReservations());
    setRooms(storage.getRooms());
  };
  useEffect(load,[]);

  const reserved = reservations.filter(r=> r.status==="Reserved");

  const doCheckIn = (res) => {
    const available = rooms.find(r=> r.type===res.roomType && r.status==="Available");
    if (!available) { alert(`No ${res.roomType} rooms available!`); return; }
    const newRooms = rooms.map(r=> r.id===available.id ? {...r, status:"Occupied"} : r);
    storage.saveRooms(newRooms);
    const newRes = reservations.map(r=> r.id===res.id ? {...r, status:"CheckedIn", roomNumber: available.number } : r);
    storage.saveReservations(newRes);
    load();
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2>Check-In</h2>
        <p className="muted">Function 2A: Verify reservation, assign available room, mark CheckedIn.</p>
      </div>

      <Card title={`Pending Check-Ins (${reserved.length})`}>
        {reserved.length===0 ? <p className="muted">No pending check-ins. Create a reservation first.</p> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Guest</th><th>Room Type</th><th>Dates</th><th>Guests</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {reserved.map(r=>(
                <tr key={r.id}>
                  <td>{r.id}</td><td>{r.guestName} <br/><small className="muted">{r.phone}</small></td>
                  <td>{r.roomType}</td><td>{r.checkIn} → {r.checkOut}</td><td>{r.guests}</td>
                  <td><Badge status={r.status}/></td>
                  <td><button className="btn btn-primary btn-sm" onClick={()=>doCheckIn(r)}>Check-In & Assign Room</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Room Availability">
        <div className="room-chips">
          {rooms.map(rm=> <span key={rm.id} className={`chip chip-${rm.status.toLowerCase()}`}>{rm.number} ({rm.type}) — {rm.status} {rm.status==="Available" ? "· ₹"+rm.price : ""}</span>)}
        </div>
      </Card>
    </div>
  );
}
