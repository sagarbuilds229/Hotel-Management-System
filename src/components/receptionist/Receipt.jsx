import { formatCurrency, formatDate } from "../../utils/format";

export default function Receipt({ bill, reservation }) {
  if (!bill) return null;
  return (
    <div className="receipt" id="print-receipt">
      <div className="receipt-head">
        <h2>🏨 Grand Horizon Hotel</h2>
        <p>Receipt — Receptionist: Sagar Bhagat</p>
      </div>
      <div className="receipt-meta">
        <div><strong>Bill No:</strong> {bill.id}</div>
        <div><strong>Reservation:</strong> {bill.reservationId}</div>
        <div><strong>Guest:</strong> {bill.guestName}</div>
        <div><strong>Room:</strong> {bill.roomNumber}</div>
        <div><strong>Stay:</strong> {formatDate(bill.checkIn)} → {formatDate(bill.checkOut)} ({bill.nights} nights)</div>
      </div>
      <table className="table">
        <thead><tr><th>Description</th><th className="text-right">Amount</th></tr></thead>
        <tbody>
          <tr><td>Room Charges ({bill.nights} × {formatCurrency(bill.roomCharge)})</td><td className="text-right">{formatCurrency(bill.roomCharge * bill.nights)}</td></tr>
          <tr><td>Services & Additional</td><td className="text-right">{formatCurrency(bill.servicesTotal)}</td></tr>
          <tr><td>Tax</td><td className="text-right">{formatCurrency(bill.tax)}</td></tr>
          {bill.discount ? <tr><td>Discount</td><td className="text-right">-{formatCurrency(bill.discount)}</td></tr> : null}
          <tr className="total-row"><td><strong>Grand Total</strong></td><td className="text-right"><strong>{formatCurrency(bill.total)}</strong></td></tr>
        </tbody>
      </table>
      <p className="muted">Payment Method: {bill.paymentMethod} | Status: {bill.status}</p>
      <p className="receipt-foot">Thank you for staying with us! Visit again.</p>
      <button className="btn btn-primary no-print" onClick={()=>window.print()}>🖨️ Print Receipt</button>
    </div>
  );
}
