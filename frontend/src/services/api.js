const API_BASE_URL = "http://localhost:5000/api";

export async function searchTrains(from, to) {
  const params = new URLSearchParams({
    from: from.trim().toUpperCase(),
    to: to.trim().toUpperCase(),
  });

  const response = await fetch(
    `${API_BASE_URL}/trains/search?${params.toString()}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to search trains");
  }

  return data;
}

export async function getTrainDetails(trainId) {
  const response = await fetch(
    `${API_BASE_URL}/trains/${trainId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch train details"
    );
  }

  return data;
}

export async function getStations() {
  const response = await fetch(`${API_BASE_URL}/stations`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch stations");
  }

  return data;
}

export async function createBooking(bookingData) {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookingData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Booking failed");
  }

  return data;
}

export async function getBookingDetails(bookingId) {
  const response = await fetch(
    `${API_BASE_URL}/bookings/${bookingId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch booking details"
    );
  }

  return data;
}

export async function downloadTicket(bookingId) {
  const response = await fetch(
    `${API_BASE_URL}/bookings/${bookingId}/ticket`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(
      data.message || "Failed to download ticket"
    );
  }

  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `ResilientTicket-${bookingId}.pdf`;

  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function getUserBookings(userId) {
  const response = await fetch(
    `${API_BASE_URL}/bookings/user/${userId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch user bookings"
    );
  }

  return data;
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}