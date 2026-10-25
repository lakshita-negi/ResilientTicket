import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-16 bg-[#02122F] text-[#F0ECDD]">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 lg:px-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          <div className="lg:col-span-2">
            <Link
              to="/"
              className="font-serif text-3xl font-semibold tracking-tight"
            >
              Resilient
              <span className="text-[#8BA3C5]">Ticket</span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-7 text-[#B8C5D8]">
              A self-healing railway ticket booking system designed to
              detect failures, recover automatically, and keep the booking
              experience running smoothly.
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs text-[#8BA3C5]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#8BA3C5]" />
              Self-healing system active
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8BA3C5]">
              Explore
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/"
                className="text-sm text-[#D8E0EA] transition hover:text-[#8BA3C5]"
              >
                Home
              </Link>

              <Link
                to="/book-tickets"
                className="text-sm text-[#D8E0EA] transition hover:text-[#8BA3C5]"
              >
                Book Tickets
              </Link>

              <Link
                to="/my-bookings"
                className="text-sm text-[#D8E0EA] transition hover:text-[#8BA3C5]"
              >
                My Bookings
              </Link>

              <Link
                to="/my-tickets"
                className="text-sm text-[#D8E0EA] transition hover:text-[#8BA3C5]"
              >
                My Tickets
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8BA3C5]">
              System
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <span className="text-sm text-[#D8E0EA]">
                Automatic Recovery
              </span>

              <span className="text-sm text-[#D8E0EA]">
                Failure Detection
              </span>

              <span className="text-sm text-[#D8E0EA]">
                Health Monitoring
              </span>

              <span className="text-sm text-[#D8E0EA]">
                Incident Tracking
              </span>
            </div>
          </div>
        </div>

        <div className="my-10 h-px bg-[#8BA3C5]/20" />

        <div className="flex flex-col gap-3 text-xs text-[#9EADC2] md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} ResilientTicket. All rights reserved.
          </p>

          <p>
            Built as a self-healing software project.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
