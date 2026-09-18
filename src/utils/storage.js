// Central localStorage helper - mock DB layer
import { mockRooms } from "../data/mockRooms";
import { mockReservations } from "../data/mockReservations";
import { mockComplaints } from "../data/mockComplaints";
import { mockReviews } from "../data/mockReviews";
import { mockServiceOrders } from "../data/mockServices";
import { mockBills } from "../data/mockBills";
import { mockGuests } from "../data/mockGuests";

const KEYS = {
  ROOMS: "hms_rooms",
  RESERVATIONS: "hms_reservations",
  COMPLAINTS: "hms_complaints",
  REVIEWS: "hms_reviews",
  SERVICES: "hms_serviceOrders",
  BILLS: "hms_bills",
  GUESTS: "hms_guests",
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  } catch {
    return fallback;
  }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const storage = {
  getRooms: () => load(KEYS.ROOMS, mockRooms),
  saveRooms: (d) => save(KEYS.ROOMS, d),

  getReservations: () => load(KEYS.RESERVATIONS, mockReservations),
  saveReservations: (d) => save(KEYS.RESERVATIONS, d),

  getComplaints: () => load(KEYS.COMPLAINTS, mockComplaints),
  saveComplaints: (d) => save(KEYS.COMPLAINTS, d),

  getReviews: () => load(KEYS.REVIEWS, mockReviews),
  saveReviews: (d) => save(KEYS.REVIEWS, d),

  getServiceOrders: () => load(KEYS.SERVICES, mockServiceOrders),
  saveServiceOrders: (d) => save(KEYS.SERVICES, d),

  getBills: () => load(KEYS.BILLS, mockBills),
  saveBills: (d) => save(KEYS.BILLS, d),

  getGuests: () => load(KEYS.GUESTS, mockGuests),
  saveGuests: (d) => save(KEYS.GUESTS, d),

  resetAll: () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }
};
