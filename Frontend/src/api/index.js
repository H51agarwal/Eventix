const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(method, path, body) {
  const token = localStorage.getItem("eb_token");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export const authAPI = {
  login: (email, password) => request("POST", "/auth/login", { email, password }),
  register: (name, email, password, role) =>
    request("POST", "/auth/register", { name, email, password, role }),
};

export const eventsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/events${qs ? "?" + qs : ""}`);
  },
  getOne: (id) => request("GET", `/events/${id}`),
  create: (data) => request("POST", "/events", data),
  update: (id, data) => request("PUT", `/events/${id}`, data),
  delete: (id) => request("DELETE", `/events/${id}`),
  myEvents: () => request("GET", "/events/mine"),
  cancel: (id) => request("PUT", `/events/${id}/cancel`),
};

export const bookingsAPI = {
  create: (eventId, quantity, tierLabel, totalPrice) => request("POST", "/bookings", { eventId, quantity, tierLabel, totalPrice }),
  myBookings: () => request("GET", "/bookings/mine"),
  eventBookings: (eventId) => request("GET", `/bookings/event/${eventId}`),
};

export const pricingAPI = { 
  suggest: (eventData) => request("POST", "/pricing/suggest", eventData),
};

export const realEventsAPI = {
  getByCity: (city, category) => {
    const qs = new URLSearchParams({ city, category, t: Date.now() }).toString();
    return request("GET", `/real-events?${qs}`);
  },
};

export const paymentAPI = {
  createOrder: (data) => request("POST", "/payments/create-order", data),
  verify: (data) => request("POST", "/payments/verify", data),
};