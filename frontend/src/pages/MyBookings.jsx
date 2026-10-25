import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getUserBookings } from "../services/api";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const storedUser = localStorage.getItem("resilientTicketUser");

      if (!storedUser) {
        setError("Please login to view your bookings.");
        return;
      }

      const user = JSON.parse(storedUser);

      const data = await getUserBookings(user.id);

      setBookings(data.bookings || data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load your bookings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0ECDD] text-[#23354D]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="mb-12 border-b border-[#C7CED8] pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#495B7D]">
            Your Travel
          </p>

          <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight tracking-tight text-[#02122F] md:text-6xl">
            My bookings.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[#495B7D]">
            View your recent railway bookings and keep track of your journeys.
          </p>
        </div>

        {loading && (
          <div className="border border-[#C7CED8] bg-[#F7F4EA] p-10 text-center">
            <p className="text-sm text-[#495B7D]">
              Loading your bookings...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="border border-[#C7CED8] bg-[#E7E3D7] p-6">
            <p className="text-sm text-[#23354D]">{error}</p>

            <button
              onClick={loadBookings}
              className="mt-4 bg-[#02122F] px-5 py-2.5 text-sm font-semibold text-[#F0ECDD] transition hover:bg-[#23354D]"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="border border-[#C7CED8] bg-[#F7F4EA] px-6 py-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#495B7D]">
              No Bookings Yet
            </p>

            <h2 className="mt-4 font-serif text-3xl font-semibold text-[#02122F]">
              Your journeys will appear here.
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#495B7D]">
              Search for a train and book your first journey with
              ResilientTicket.
            </p>

            <a
              href="/book-tickets"
              className="mt-7 inline-block bg-[#02122F] px-6 py-3 text-sm font-semibold text-[#F0ECDD] transition hover:bg-[#23354D]"
            >
              Book Tickets
            </a>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-[#C7CED8] bg-[#F7F4EA] p-6 md:p-8"
              >
                <div className="flex flex-col gap-6 border-b border-[#C7CED8] pb-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#495B7D]">
                      Booking #{booking.id}
                    </p>

                    <h2 className="mt-2 font-serif text-2xl font-semibold text-[#02122F]">
                      {booking.train_name ||
                        booking.train?.name ||
                        booking.train?.train_name ||
                        "Train Journey"}
                    </h2>
                  </div>

                  <span
                    className={`w-fit px-4 py-2 text-xs font-semibold ${
                      booking.booking_status === "CONFIRMED"
                        ? "border border-[#8BA3C5] bg-[#DCE3EC] text-[#23354D]"
                        : booking.booking_status === "CANCELLED"
                        ? "border border-[#C7CED8] bg-[#E7E3D7] text-[#495B7D]"
                        : "border border-[#C7CED8] bg-[#F0ECDD] text-[#495B7D]"
                    }`}
                  >
                    {booking.booking_status || "PENDING"}
                  </span>
                </div>

                <div className="grid gap-6 border-b border-[#C7CED8] py-7 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#495B7D]">
                      From
                    </p>

                    <p className="mt-2 font-semibold text-[#02122F]">
                      {booking.source_station_name ||
                        booking.source_station?.name ||
                        booking.source_station?.station_name ||
                        booking.source ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#495B7D]">
                      To
                    </p>

                    <p className="mt-2 font-semibold text-[#02122F]">
                      {booking.destination_station_name ||
                        booking.destination_station?.name ||
                        booking.destination_station?.station_name ||
                        booking.destination ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#495B7D]">
                      Journey Date
                    </p>

                    <p className="mt-2 font-semibold text-[#02122F]">
                      {booking.journey_date || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#495B7D]">
                      Seat
                    </p>

                    <p className="mt-2 font-semibold text-[#02122F]">
                      {booking.seat_number ||
                        booking.seat?.seat_number ||
                        booking.seat?.seat_no ||
                        booking.seat_id ||
                        "—"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#495B7D]">
                      PNR
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold text-[#02122F]">
                      {booking.pnr || "Not generated"}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#495B7D]">
                      Amount
                    </p>

                    <p className="mt-1 text-lg font-semibold text-[#02122F]">
                      ₹{booking.amount || booking.total_amount || "0"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default MyBookings;