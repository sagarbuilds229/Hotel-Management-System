import { formatCurrency } from "../../utils/format";

export default function BillPreview({ bill }) {
  if (!bill) return <p>No bill selected.</p>;
  return (
    <div className="bill-preview">
      <h4>Bill #{bill.id} — {bill.guestName} (Room {bill.roomNumber || "-"})</h4>
      <table className="table table-sm">
        <tbody>
          <tr><td>Room Charge ({bill.nights} nights × {formatCurrency(bill.roomCharge)})</td><td className="text-right">{formatCurrency(bill.roomCharge * bill.nights)}</td></tr>
          <tr><td>Services / Additional Charges</td><td className="text-right">{formatCurrency(bill.servicesTotal)}</td></tr>
          <tr><td>Tax (10%)</td><td className="text-right">{formatCurrency(bill.tax)}</td></tr>
          {bill.discount ? <tr><td>Discount</td><td className="text-right">- {formatCurrency(bill.discount)}</td></tr> : null}
          <tr className="total-row"><td><strong>Total Payable</strong></td><td className="text-right"><strong>{formatCurrency(bill.total)}</strong></td></tr>
          <tr><td>Paid</td><td className="text-right">{formatCurrency(bill.paid || 0)}</td></tr>
          <tr><td><strong>Due</strong></td><td className="text-right"><strong>{formatCurrency(Math.max(0, bill.total - (bill.paid||0)))}</strong></td></tr>
        </tbody>
      </table>
      <p className="muted">Payment: {bill.paymentMethod || "-"} • Status: {bill.status}</p>
    </div>
  );
}
