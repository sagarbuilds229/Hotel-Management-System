export const formatCurrency = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export const formatDate = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
};

export const calcNights = (checkIn, checkOut) => {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const diff = Math.ceil((b - a) / (1000*60*60*24));
  return diff > 0 ? diff : 1;
};

export const todayISO = () => new Date().toISOString().slice(0,10);
