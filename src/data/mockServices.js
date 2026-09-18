export const serviceCatalog = [
  { id: "S01", name: "Room Service - Breakfast", price: 350, category: "Restaurant" },
  { id: "S02", name: "Room Service - Dinner", price: 600, category: "Restaurant" },
  { id: "S03", name: "Laundry - Wash & Iron (per kg)", price: 200, category: "Housekeeping" },
  { id: "S04", name: "Extra Bed", price: 800, category: "Room" },
  { id: "S05", name: "Mineral Water / Minibar", price: 150, category: "Restaurant" },
  { id: "S06", name: "Airport Pickup", price: 1000, category: "Transport" },
  { id: "S07", name: "Spa / Massage", price: 1500, category: "Wellness" },
];

export const mockServiceOrders = [
  { id: "SO001", reservationId: "R001", serviceId: "S01", serviceName: "Room Service - Breakfast", price: 350, qty: 2, date: "2026-09-17", status: "Delivered" },
  { id: "SO002", reservationId: "R002", serviceId: "S03", serviceName: "Laundry - Wash & Iron (per kg)", price: 200, qty: 3, date: "2026-09-17", status: "Pending" },
];
