import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("resilientTicketUser");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("resilientTicketUser");
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("resilientTicketUser");
    setUser(null);
    navigate("/");
  };

  return (
    <header className="border-b border-[#495B7D]/20 bg-[#F0ECDD]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">

        <Link
          to="/"
          className="font-serif text-2xl font-semibold tracking-tight text-[#02122F]"
        >
          Resilient
          <span className="text-[#495B7D]">Ticket</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-[#495B7D] transition hover:text-[#02122F]"
          >
            Home
          </Link>

          <Link
            to="/book-tickets"
            className="text-sm font-medium text-[#495B7D] transition hover:text-[#02122F]"
          >
            Book Tickets
          </Link>

          <Link
            to="/bookings"
            className="text-sm font-medium text-[#495B7D] transition hover:text-[#02122F]"
          >
            My Bookings
          </Link>

          <Link
            to="/tickets"
            className="text-sm font-medium text-[#495B7D] transition hover:text-[#02122F]"
          >
            My Tickets
          </Link>
        </nav>

        <div className="hidden items-center gap-5 lg:flex">

          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              className="flex items-center gap-2 text-xs font-semibold text-[#23354D] transition hover:text-[#02122F]"
            >
              <span className="h-2 w-2 rounded-full bg-[#8BA3C5]" />
              Admin Dashboard
            </Link>
          )}

          {!user ? (
            <Link
              to="/login"
              className="rounded-xl bg-[#02122F] px-5 py-2.5 text-sm font-semibold text-[#F0ECDD] transition hover:bg-[#23354D]"
            >
              Login
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[#23354D]">
                {user.name}
              </span>

              <button
                onClick={handleLogout}
                className="rounded-xl border border-[#495B7D] px-5 py-2.5 text-sm font-semibold text-[#23354D] transition hover:border-[#02122F] hover:text-[#02122F]"
              >
                Logout
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}

export default Navbar;