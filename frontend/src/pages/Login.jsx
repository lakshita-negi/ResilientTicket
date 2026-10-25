
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await loginUser(email, password);

      localStorage.setItem("resilientTicketUser", JSON.stringify(data.user));

      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#171717]">
      <div className="grid min-h-screen lg:grid-cols-2">

        <section className="hidden bg-[#171717] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <a
              href="/"
              className="font-serif text-2xl font-semibold"
            >
              ResilientTicket
            </a>
          </div>

          <div className="max-w-lg">
            <p className="text-xs font-bold tracking-[0.3em] text-[#D96C4F]">
              WELCOME BACK
            </p>

            <h1 className="mt-5 font-serif text-6xl font-semibold leading-[0.95]">
              Your journey
              <br />
              starts here.
            </h1>

            <p className="mt-7 max-w-md text-base leading-8 text-stone-400">
              Sign in to search trains, manage your bookings, and keep track
              of your journeys with ResilientTicket.
            </p>
          </div>

          <p className="text-xs tracking-wide text-stone-500">
            Reliable travel. Resilient technology.
          </p>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">

            <div className="mb-10 lg:hidden">
              <a
                href="/"
                className="font-serif text-2xl font-semibold text-[#171717]"
              >
                ResilientTicket
              </a>
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-[#D96C4F]">
                SIGN IN
              </p>

              <h2 className="mt-4 font-serif text-5xl font-semibold leading-tight">
                Welcome back.
              </h2>

              <p className="mt-4 text-sm leading-7 text-stone-500">
                Enter your details to continue to ResilientTicket.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-10 space-y-6"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-stone-300 bg-[#FFFDF8] px-4 py-3.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#D96C4F] focus:ring-1 focus:ring-[#D96C4F]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-stone-300 bg-[#FFFDF8] px-4 py-3.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#D96C4F] focus:ring-1 focus:ring-[#D96C4F]"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#D96C4F] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#C85F44] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-stone-300" />

              <span className="text-xs text-stone-400">
                RESILIENTTICKET
              </span>

              <div className="h-px flex-1 bg-stone-300" />
            </div>

            <p className="mt-6 text-center text-xs leading-6 text-stone-400">
              Your account determines whether you continue as a passenger
              or administrator.
            </p>

          </div>
        </section>

      </div>
    </div>
  );
}

export default Login;
