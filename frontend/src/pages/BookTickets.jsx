import Navbar from "../components/Navbar";
import SearchPanel from "../components/SearchPanel";
import Footer from "../components/Footer";

function BookTickets() {
  return (
    <div className="min-h-screen bg-[#F0ECDD] text-[#23354D]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-bold tracking-[0.3em] text-[#495B7D]">
            BOOK YOUR JOURNEY
          </p>

          <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            Find your train.
            <br />
            <span className="text-[#495B7D]">
              Reserve your seat.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[#495B7D]">
            Search available trains, choose your preferred seat, and
            complete your booking with ResilientTicket.
          </p>
        </div>

        <SearchPanel />
      </main>

      <Footer />
    </div>
  );
}

export default BookTickets;
