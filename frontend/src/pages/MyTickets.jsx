import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getUserBookings, downloadTicket } from "../services/api";

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const storedUser = localStorage.getItem("resilientTicketUser");

      if (!storedUser) {
        setError("Please login to view your tickets.");
        return;
      }

      const user = JSON.parse(storedUser);

      const data = await getUserBookings(user.id);

      const userBookings = data.bookings || [];

      const generatedTickets = userBookings.filter(
        (booking) =>
          booking.booking_status === "CONFIRMED" &&
          booking.ticket_status === "GENERATED"
      );

      setTickets(generatedTickets);
    } catch (err) {
      console.error(err);
      setError("Unable to load your tickets.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (bookingId) => {
    try {
      setDownloadLoading(bookingId);

      await downloadTicket(bookingId);
    } catch (err) {
      console.error(err);
      alert("Unable to download ticket.");
    } finally {
      setDownloadLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0ECDD] text-[#23354D]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="mb-12 max-w-3xl">
          <p className="text-xs font-bold tracking-[0.3em] text-[#495B7D]">
            YOUR JOURNEYS
          </p>

          <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight tracking-tight text-[#02122F] md:text-6xl">
            My Tickets
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[#495B7D]">
            View your confirmed railway tickets and download them whenever
            you need them.
          </p>
        </div>

        {loading && (
          <div className="border border-[#C7CED8] bg-[#F7F4EA] px-6 py-12 text-center">
            <p className="text-sm text-[#495B7D]">
              Loading your tickets...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="border border-[#C7CED8] bg-[#E7E3D7] px-6 py-10 text-center">
            <p className="text-sm text-[#495B7D]">{error}</p>

            <button
              onClick={loadTickets}
              className="mt-5 bg-[#02122F] px-5 py-2.5 text-sm font-semibold text-[#F0ECDD] transition hover:bg-[#23354D]"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="border border-[#C7CED8] bg-[#F7F4EA] px-6 py-16 text-center">
            <p className="font-serif text-3xl font-semibold text-[#02122F]">
              No tickets yet.
            </p>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#495B7D]">
              Once you complete a railway booking and your ticket is
              generated, it will appear here.
            </p>

            <a
              href="/book-tickets"
              className="mt-7 inline-block bg-[#02122F] px-6 py-3 text-sm font-semibold text-[#F0ECDD] transition hover:bg-[#23354D]"
            >
              Book a Ticket
            </a>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {tickets.map((ticket) => (
              <article
                key={ticket.id}
                className="overflow-hidden border border-[#C7CED8] bg-[#F7F4EA]"
              >
                <div className="border-b border-[#C7CED8] px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold tracking-[0.2em] text-[#495B7D]">
                        CONFIRMED
                      </p>

                      <h2 className="mt-2 font-serif text-2xl font-semibold text-[#02122F]">
                        {ticket.train_number} · {ticket.train_name}
                      </h2>
                    </div>

                    <div className="shrink-0 border border-[#8BA3C5] bg-[#DCE3EC] px-3 py-1.5 text-xs font-semibold text-[#23354D]">
                      Ticket Ready
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-semibold text-[#02122F]">
                        {ticket.source_code}
                      </p>

                      <p className="mt-1 text-xs text-[#495B7D]">
                        {ticket.source_station}
                      </p>
                    </div>

                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-px flex-1 border-t border-dashed border-[#C7CED8]" />

                      <span className="text-xs text-[#495B7D]">
                        →
                      </span>

                      <div className="h-px flex-1 border-t border-dashed border-[#C7CED8]" />
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-semibold text-[#02122F]">
                        {ticket.destination_code}
                      </p>

                      <p className="mt-1 text-xs text-[#495B7D]">
                        {ticket.destination_station}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid grid-cols-2 gap-5 border-y border-[#C7CED8] py-5 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-[#495B7D]">
                        Journey Date
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#02122F]">
                        {ticket.journey_date}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#495B7D]">
                        Seat
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#02122F]">
                        {ticket.seat_number}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#495B7D]">
                        Coach
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#02122F]">
                        {ticket.coach}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#495B7D]">
                        Amount
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#02122F]">
                        ₹{ticket.total_amount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-[#495B7D]">
                        PNR
                      </p>

                      <p className="mt-1 font-mono text-sm font-semibold tracking-wide text-[#02122F]">
                        {ticket.pnr}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownload(ticket.id)}
                      disabled={downloadLoading === ticket.id}
                      className="bg-[#02122F] px-5 py-3 text-sm font-semibold text-[#F0ECDD] transition hover:bg-[#23354D] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadLoading === ticket.id
                        ? "Downloading..."
                        : "Download Ticket"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default MyTickets;