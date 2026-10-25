import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_BASE_URL = "http://localhost:5000/api";

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "health") {
    return (
      <svg {...commonProps}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
        <path d="M8 12h2l1.5-3 2 6 1.5-3H17" />
      </svg>
    );
  }

  if (name === "alert") {
    return (
      <svg {...commonProps}>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }

  if (name === "recovery") {
    return (
      <svg {...commonProps}>
        <path d="M3 12a9 9 0 0 1 15.36-6.36L21 8" />
        <polyline points="21 3 21 8 16 8" />
        <path d="M21 12a9 9 0 0 1-15.36 6.36L3 16" />
        <polyline points="3 21 3 16 8 16" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="8 12 11 15 16 9" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg {...commonProps}>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="13 6 19 12 13 18" />
      </svg>
    );
  }

  return null;
}

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [chaosLoading, setChaosLoading] = useState("");
  const [chaosMessage, setChaosMessage] = useState("");
  const [bookingId, setBookingId] = useState("");

  const [selectedFailure, setSelectedFailure] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("resilientTicketUser");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (parsedUser.role !== "ADMIN") {
        navigate("/");
        return;
      }

      setUser(parsedUser);
    } catch {
      localStorage.removeItem("resilientTicketUser");
      navigate("/login");
    }
  }, [navigate]);

    useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadDashboard = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API_BASE_URL}/admin/dashboard`);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load admin dashboard"
        );
      }

      setDashboard(data);
      setLastUpdated(new Date(data.updated_at || Date.now()));
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load dashboard");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    loadDashboard(true);

    const interval = setInterval(() => {
      loadDashboard(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const triggerChaos = async (type) => {
    try {
      setChaosLoading(type);
      setChaosMessage("");
      setError("");

      let endpoint = "";

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (type === "stale-seat-lock") {
        endpoint = "/recovery/chaos/stale-seat-lock";
      }

      if (type === "ticket-generation") {
        if (!bookingId.trim()) {
          setError(
            "Enter a booking ID before testing ticket generation failure."
          );

          setChaosLoading("");
          return;
        }

        endpoint = "/recovery/chaos/ticket-generation";

        options.body = JSON.stringify({
          bookingId: Number(bookingId),
        });
      }

      if (type === "train-search") {
        endpoint = "/recovery/chaos/train-search";
      }

      if (type === "booking") {
        endpoint = "/recovery/chaos/booking";
      }

      const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        options
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Chaos test failed");
      }

      setChaosMessage(
        data.message ||
          "Failure injected successfully. Automatic recovery will be attempted by the scheduler."
      );

      await loadDashboard(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Chaos test failed");
    } finally {
      setChaosLoading("");
    }
  };

  const handleFailureClick = (failureType) => {
    setSelectedFailure(failureType);

    setTimeout(() => {
      document
        .getElementById("incident-log")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  if (!user || !dashboard) {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#F0ECDD] text-[#23354D]">
          <Navbar />

          <main className="flex min-h-[70vh] items-center justify-center px-6">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#495B7D]">
                ResilientTicket
              </p>

              <p className="mt-3 text-lg font-semibold">
                Loading control center...
              </p>
            </div>
          </main>

          <Footer />
        </div>
      );
    }

    return null;
  }

  const {
    system,
    incidents,
    recovery,
    services,
    failure_distribution,
    recent_incidents,
  } = dashboard;

  const isHealthy = system?.status === "HEALTHY";

  const recoveryPercentage =
    recovery?.success_rate_under_30_seconds || 0;

  const recoveryAverage =
    recovery?.average_recovery_time_ms || 0;

  const detectionAverage =
    recovery?.average_detection_time_ms || 0;

  const maxRecoveryTime =
    recovery?.maximum_recovery_time_ms || 0;

  const chartMax = Math.max(
    detectionAverage,
    recoveryAverage,
    maxRecoveryTime,
    30000
  );

  const getServiceStatus = (service) => {
    return service?.status === "HEALTHY";
  };

  const filteredIncidents = selectedFailure
    ? recent_incidents.filter(
        (incident) =>
          incident.failure_type === selectedFailure
      )
    : recent_incidents;

  return (
    <div className="min-h-screen bg-[#F0ECDD] text-[#23354D]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 lg:px-10 lg:py-12">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#23354D] px-7 py-8 text-[#F0ECDD] shadow-xl md:px-10 md:py-10">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#495B7D]/40 blur-3xl" />

          <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#8BA3C5]/20 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${
                    isHealthy
                      ? "bg-[#8BA3C5]"
                      : "bg-[#7A1F2B]"
                  }`}
                />

                <span className="text-xs font-bold uppercase tracking-[0.28em] text-[#8BA3C5]">
                  ResilientTicket Control Center
                </span>
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                System health.
                <br />

                <span className="text-[#8BA3C5]">
                  Always under control.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#DCE3EC] md:text-base">
                Monitor your railway booking system, inject controlled
                failures, and observe automatic recovery in real time.
              </p>
            </div>

            <div className="min-w-[240px] rounded-2xl border border-[#8BA3C5]/30 bg-[#F0ECDD]/10 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8BA3C5]">
                Administrator
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {user.name}
              </p>

              <p className="mt-1 text-xs text-[#C5D0DE]">
                {user.email}
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs text-[#DCE3EC]">
                <span className="h-2 w-2 rounded-full bg-[#8BA3C5]" />
                Admin access active
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="System Health"
            value={`${system.health_percentage}%`}
            description={
              isHealthy
                ? "All systems operational"
                : "Attention required"
            }
            icon="health"
            healthy={isHealthy}
          />

          <MetricCard
            title="Incidents"
            value={incidents.total}
            description={`${incidents.active} currently active`}
            icon="alert"
          />

          <MetricCard
            title="Recoveries"
            value={recovery.total}
            description={`${incidents.recovered} incidents recovered`}
            icon="recovery"
            healthy
          />

          <MetricCard
            title="Recovery Target"
            value={`${recoveryPercentage}%`}
            description={`${recovery.under_30_seconds} under 30 seconds`}
            icon="clock"
            accent
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-[#C7CED8] bg-[#F0ECDD] p-7 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#495B7D]">
                  Live Status
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-[#23354D]">
                  System health
                </h2>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isHealthy
                    ? "bg-[#8BA3C5]/30 text-[#23354D]"
                    : "bg-[#F8E8EA] text-[#7A1F2B]"
                }`}
              >
                {isHealthy ? "Healthy" : "Issue"}
              </span>
            </div>

            <div className="mt-8 flex justify-center">
              <div
                className="flex h-48 w-48 items-center justify-center rounded-full"
                style={{
                  background: isHealthy
                    ? "conic-gradient(#8BA3C5 0deg 360deg, #C7CED8 360deg)"
                    : "conic-gradient(#7A1F2B 0deg 110deg, #D9A3AA 110deg 360deg)",
                }}
              >
                <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-[#F0ECDD]">
                  <span className="text-4xl font-semibold text-[#23354D]">
                    {system.health_percentage}
                  </span>

                  <span className="mt-1 text-xs uppercase tracking-[0.18em] text-[#495B7D]">
                    Health
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#495B7D]">
                Database response
              </p>

              <p className="mt-1 text-xl font-semibold text-[#23354D]">
                {system.database_response_time_ms} ms
              </p>
            </div>

            <div className="mt-5 border-t border-[#C7CED8] pt-4 text-center">
              <p className="text-xs text-[#495B7D]">
                Last 24 hours
              </p>

              <p className="mt-1 text-lg font-semibold text-[#23354D]">
                {incidents.last_24_hours} incidents
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#C7CED8] bg-[#F0ECDD] p-7 shadow-sm lg:col-span-2">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#495B7D]">
                  Service Monitor
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-[#23354D]">
                  Current services
                </h2>
              </div>

              <button
                onClick={() => loadDashboard(true)}
                disabled={loading}
                className="rounded-xl border border-[#495B7D] px-4 py-2 text-sm font-semibold text-[#23354D] transition hover:border-[#02122F] hover:bg-[#8BA3C5]/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Checking..." : "Refresh"}
              </button>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <ServiceCard
                name="Database"
                status={services.database.status}
                healthy={getServiceStatus(services.database)}
                detail={`${services.database.response_time_ms} ms response`}
              />

              <ServiceCard
                name="API Server"
                status={services.api.status}
                healthy={getServiceStatus(services.api)}
                detail="Port 5000"
              />

              <ServiceCard
                name="Booking Service"
                status={services.booking.status}
                healthy={getServiceStatus(services.booking)}
                detail="Self-healing enabled"
              />

              <ServiceCard
                name="Train Search"
                status={services.trainSearch.status}
                healthy={getServiceStatus(services.trainSearch)}
                detail="Self-healing enabled"
              />
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#C7CED8] pt-5">
              <p className="text-xs text-[#495B7D]">
                Automatic refresh every 5 seconds
              </p>

              <p className="text-xs text-[#495B7D]">
                Updated{" "}
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString()
                  : "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-[#C7CED8] bg-[#F0ECDD] p-7 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#495B7D]">
                  Performance
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-[#23354D]">
                  Recovery performance
                </h2>
              </div>

              <span className="rounded-full bg-[#8BA3C5]/20 px-3 py-1 text-xs text-[#495B7D]">
                Target &lt; 30s
              </span>
            </div>

            <div className="mt-8">
              <div className="flex h-48 items-end gap-4 border-b border-[#C7CED8] px-2">
                <ChartBar
                  label="Detect"
                  height={`${Math.max(
                    (detectionAverage / chartMax) * 100,
                    8
                  )}%`}
                  value={`${Math.round(
                    detectionAverage
                  )} ms`}
                />

                <ChartBar
                  label="Recover"
                  height={`${Math.max(
                    (recoveryAverage / chartMax) * 100,
                    8
                  )}%`}
                  value={`${Math.round(
                    recoveryAverage
                  )} ms`}
                  highlight
                />

                <ChartBar
                  label="Maximum"
                  height={`${Math.max(
                    (maxRecoveryTime / chartMax) * 100,
                    8
                  )}%`}
                  value={`${Math.round(
                    maxRecoveryTime
                  )} ms`}
                />

                <ChartBar
                  label="Target"
                  height="100%"
                  value="30,000 ms"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 text-xs text-[#495B7D] sm:grid-cols-4">
                <div>
                  <p>Avg detection</p>
                  <p className="mt-1 font-semibold text-[#23354D]">
                    {Math.round(detectionAverage)} ms
                  </p>
                </div>

                <div>
                  <p>Avg recovery</p>
                  <p className="mt-1 font-semibold text-[#23354D]">
                    {Math.round(recoveryAverage)} ms
                  </p>
                </div>

                <div>
                  <p>Maximum</p>
                  <p className="mt-1 font-semibold text-[#23354D]">
                    {Math.round(maxRecoveryTime)} ms
                  </p>
                </div>

                <div>
                  <p>Under 30s</p>
                  <p className="mt-1 font-semibold text-[#23354D]">
                    {recoveryPercentage}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#C7CED8] bg-[#F0ECDD] p-7 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#495B7D]">
                Failure Analysis
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-[#23354D]">
                Failure distribution
              </h2>

              <p className="mt-2 text-xs text-[#495B7D]">
                Click an arrow to view related incidents.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-5">
              {failure_distribution.length === 0 ? (
                <p className="text-sm text-[#495B7D]">
                  No failures recorded yet.
                </p>
              ) : (
                failure_distribution.map((failure, index) => (
                  <FailureRow
                    key={`${failure.failure_type}-${index}`}
                    number={String(index + 1).padStart(2, "0")}
                    name={formatFailureName(
                      failure.failure_type
                    )}
                    description={`${failure.service} · ${failure.count} incident${
                      failure.count === 1 ? "" : "s"
                    }`}
                    onClick={() =>
                      handleFailureClick(
                        failure.failure_type
                      )
                    }
                    selected={
                      selectedFailure ===
                      failure.failure_type
                    }
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-[#C7CED8] bg-[#F0ECDD] p-7 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#495B7D]">
                Controlled Failure Testing
              </p>

              <h2 className="mt-2 text-3xl font-semibold text-[#23354D]">
                Chaos Testing
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#495B7D]">
                Intentionally inject each supported failure and observe how
                ResilientTicket detects and automatically recovers from it.
              </p>
            </div>

            <span className="rounded-full bg-[#8BA3C5]/20 px-4 py-2 text-xs font-semibold text-[#495B7D]">
              4 failure scenarios
            </span>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <ChaosCard
              number="01"
              title="Orphaned Seat Lock"
              description="Creates a stale locked seat with no active booking so the self-healing system can restore it."
              loading={chaosLoading === "stale-seat-lock"}
              onClick={() =>
                triggerChaos("stale-seat-lock")
              }
            />

            <div className="group flex h-full flex-col rounded-[2rem] border border-[#C7CED8] bg-[#F0ECDD] p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#495B7D] hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8BA3C5]/15 font-semibold text-[#02122F]">
                  02
                </div>

                <span className="rounded-full bg-[#8BA3C5]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#495B7D]">
                  Chaos Test
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-semibold text-[#23354D]">
                Ticket Generation Failure
              </h3>

              <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#495B7D]">
                Marks a generated ticket as failed so the automatic ticket
                recovery process can restore it.
              </p>

              <div className="mt-auto flex items-end gap-3 pt-5">
                <div className="min-w-0 flex-1">
                  <label className="text-xs font-semibold text-[#495B7D]">
                    Booking ID
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={bookingId}
                    onChange={(event) =>
                      setBookingId(event.target.value)
                    }
                    placeholder="Enter booking ID"
                    className="mt-2 w-full rounded-xl border border-[#C7CED8] bg-[#F0ECDD] px-4 py-3 text-sm text-[#23354D] outline-none transition placeholder:text-[#495B7D]/60 focus:border-[#495B7D] focus:ring-2 focus:ring-[#8BA3C5]/30"
                  />
                </div>

                <button
                  onClick={() =>
                    triggerChaos("ticket-generation")
                  }
                  disabled={
                    chaosLoading === "ticket-generation"
                  }
                  className="shrink-0 rounded-xl bg-[#02122F] px-5 py-3 text-sm font-semibold text-[#F0ECDD] transition hover:bg-[#23354D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chaosLoading === "ticket-generation"
                    ? "Injecting..."
                    : "Inject Failure"}
                </button>
              </div>
            </div>

            <ChaosCard
              number="03"
              title="Train Search Service Failure"
              description="Marks the train search service as failed and allows the automatic recovery system to restore availability."
              loading={chaosLoading === "train-search"}
              onClick={() =>
                triggerChaos("train-search")
              }
            />

            <ChaosCard
              number="04"
              title="Booking Service Failure"
              description="Marks the booking service as failed and allows the automatic recovery system to restore booking availability."
              loading={chaosLoading === "booking"}
              onClick={() =>
                triggerChaos("booking")
              }
            />
          </div>

          <div className="mt-6 border-t border-[#C7CED8] pt-5">
            <p className="text-xs leading-5 text-[#495B7D]">
              Chaos tests are controlled demonstrations. They create a
              specific failure condition so the self-healing workflow can
              be observed and measured without relying on unpredictable
              real-world failures.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div
            id="incident-log"
            className="scroll-mt-24 mb-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#495B7D]">
                  Incident Log
                </p>

                <h2 className="mt-2 text-3xl font-semibold text-[#23354D]">
                  Recent incidents
                </h2>

                <p className="mt-2 text-sm text-[#495B7D]">
                  Latest failures detected and handled by the self-healing
                  system.
                </p>
              </div>

              {selectedFailure && (
                <button
                  onClick={() => setSelectedFailure("")}
                  className="rounded-xl border border-[#495B7D] px-4 py-2 text-xs font-semibold text-[#23354D] transition hover:border-[#02122F] hover:bg-[#8BA3C5]/15"
                >
                  Show all incidents
                </button>
              )}
            </div>

            {selectedFailure && (
              <div className="mt-4 rounded-xl border border-[#8BA3C5] bg-[#8BA3C5]/15 px-4 py-3 text-xs text-[#23354D]">
                Showing incidents for{" "}
                <span className="font-semibold">
                  {formatFailureName(selectedFailure)}
                </span>
                .
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#C7CED8] bg-[#F0ECDD]">
            {filteredIncidents.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-[#495B7D]">
                No incidents found for this failure type.
              </div>
            ) : (
              <div className="divide-y divide-[#C7CED8]">
                {filteredIncidents.map((incident) => (
                  <IncidentRow
                    key={incident.id}
                    incident={incident}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {chaosMessage && (
          <div className="mt-6 rounded-2xl border border-[#8BA3C5] bg-[#8BA3C5]/20 px-5 py-4 text-sm text-[#23354D]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#8BA3C5] text-[#02122F]">
                <Icon name="check" size={14} strokeWidth={2.2} />
              </span>

              <div>
                <p className="font-semibold">
                  Recovery test completed
                </p>

                <p className="mt-1 text-[#495B7D]">
                  {chaosMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-[#D9A3AA] bg-[#F8E8EA] px-5 py-4 text-sm text-[#7A1F2B]">
            <p className="font-semibold">
              Dashboard error
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        )}

        <section className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/book-tickets"
            className="inline-flex items-center justify-center rounded-xl bg-[#02122F] px-6 py-3 text-sm font-semibold text-[#F0ECDD] transition hover:bg-[#23354D]"
          >
            Open Booking System
          </Link>

          <button
            onClick={() => loadDashboard(true)}
            disabled={loading}
            className="rounded-xl border border-[#495B7D] bg-[#F0ECDD] px-6 py-3 text-sm font-semibold text-[#23354D] transition hover:border-[#02122F] hover:bg-[#8BA3C5]/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Checking system..." : "Refresh System"}
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
  healthy,
  accent,
}) {
  return (
    <div className="group rounded-[1.5rem] border border-[#C7CED8] bg-[#F0ECDD] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#495B7D]">
          {title}
        </p>

        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            healthy
              ? "bg-[#8BA3C5]/30 text-[#02122F]"
              : accent
              ? "bg-[#495B7D]/20 text-[#02122F]"
              : "bg-[#F8E8EA] text-[#7A1F2B]"
          }`}
        >
          <Icon name={icon} size={18} />
        </span>
      </div>

      <p
        className={`mt-5 text-3xl font-semibold ${
          healthy === false
            ? "text-[#7A1F2B]"
            : "text-[#23354D]"
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-1 text-xs ${
          healthy === false
            ? "text-[#7A1F2B]"
            : "text-[#495B7D]"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function ServiceCard({
  name,
  status,
  healthy,
  detail,
}) {
  return (
    <div
      className={`rounded-2xl border p-5 transition hover:shadow-md ${
        healthy
          ? "border-[#C7CED8] bg-[#8BA3C5]/10 hover:border-[#495B7D]"
          : "border-[#D9A3AA] bg-[#F8E8EA] hover:border-[#7A1F2B]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              healthy
                ? "bg-[#8BA3C5]"
                : "bg-[#7A1F2B]"
            }`}
          />

          <p className="font-semibold text-[#23354D]">
            {name}
          </p>
        </div>

        <span
          className={`text-xs font-semibold ${
            healthy
              ? "text-[#02122F]"
              : "text-[#7A1F2B]"
          }`}
        >
          {status}
        </span>
      </div>

      <p
        className={`mt-3 pl-5 text-xs ${
          healthy
            ? "text-[#495B7D]"
            : "text-[#7A1F2B]"
        }`}
      >
        {detail}
      </p>
    </div>
  );
}

function ChartBar({
  label,
  height,
  value,
  highlight,
}) {
  return (
    <div className="flex h-full flex-1 flex-col justify-end">
      <div className="mb-2 text-center text-xs font-semibold text-[#495B7D]">
        {value}
      </div>

      <div
        className={`w-full rounded-t-xl transition-all duration-500 ${
          highlight
            ? "bg-[#02122F]"
            : "bg-[#495B7D]/45"
        }`}
        style={{
          height,
          minHeight: "18px",
        }}
      />

      <div className="mt-3 text-center text-[10px] text-[#495B7D]">
        {label}
      </div>
    </div>
  );
}

function FailureRow({
  number,
  name,
  description,
  onClick,
  selected,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition ${
        selected
          ? "border-[#495B7D] bg-[#8BA3C5]/15"
          : "border-transparent hover:border-[#C7CED8] hover:bg-[#8BA3C5]/10"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8BA3C5]/15 text-xs font-bold text-[#02122F]">
        {number}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#23354D]">
          {name}
        </p>

        <p className="mt-1 text-xs text-[#495B7D]">
          {description}
        </p>
      </div>

      <span
        className={`text-[#495B7D] transition ${
          selected
            ? "translate-x-1 text-[#02122F]"
            : "group-hover:translate-x-1 group-hover:text-[#02122F]"
        }`}
      >
        <Icon name="arrow" size={18} />
      </span>
    </button>
  );
}

function ChaosCard({
  number,
  title,
  description,
  loading,
  onClick,
}) {
  return (
    <div className="group flex h-full flex-col rounded-[2rem] border border-[#C7CED8] bg-[#F0ECDD] p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#495B7D] hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8BA3C5]/15 font-semibold text-[#02122F] transition group-hover:bg-[#8BA3C5]/30">
          {number}
        </div>

        <span className="rounded-full bg-[#8BA3C5]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#495B7D]">
          Chaos Test
        </span>
      </div>

      <h3 className="mt-6 text-2xl font-semibold text-[#23354D]">
        {title}
      </h3>

      <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#495B7D]">
        {description}
      </p>

      <div className="mt-auto pt-5">
        <button
          onClick={onClick}
          disabled={loading}
          className="w-full rounded-xl bg-[#02122F] px-5 py-3 text-sm font-semibold text-[#F0ECDD] transition hover:bg-[#23354D] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Injecting..."
            : "Inject Failure"}
        </button>
      </div>
    </div>
  );
}

function IncidentRow({ incident }) {
  const recovered = incident.status === "RECOVERED";

  return (
    <div className="px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              recovered
                ? "bg-[#8BA3C5]/25 text-[#02122F]"
                : "bg-[#F8E8EA] text-[#7A1F2B]"
            }`}
          >
            <Icon
              name={recovered ? "check" : "alert"}
              size={16}
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-semibold text-[#23354D]">
                {formatFailureName(incident.failure_type)}
              </p>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                  recovered
                    ? "bg-[#8BA3C5]/25 text-[#02122F]"
                    : "bg-[#F8E8EA] text-[#7A1F2B]"
                }`}
              >
                {incident.status}
              </span>
            </div>

            <p className="mt-1 text-xs text-[#495B7D]">
              Incident #{incident.id} · {incident.service}
            </p>

            <p
              className={`mt-2 max-w-3xl text-xs leading-5 ${
                recovered
                  ? "text-[#495B7D]"
                  : "text-[#7A1F2B]"
              }`}
            >
              {incident.error_message}
            </p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 text-xs lg:min-w-[300px]">
          <div>
            <p className="text-[#495B7D]">
              Detection
            </p>

            <p className="mt-1 font-semibold text-[#23354D]">
              {formatMilliseconds(
                incident.detection_time_ms
              )}
            </p>
          </div>

          <div>
            <p className="text-[#495B7D]">
              Recovery
            </p>

            <p className="mt-1 font-semibold text-[#23354D]">
              {formatMilliseconds(
                incident.recovery_time_ms
              )}
            </p>
          </div>

          <div>
            <p className="text-[#495B7D]">
              Detected
            </p>

            <p className="mt-1 font-semibold text-[#23354D]">
              {formatDateTime(incident.detected_at)}
            </p>
          </div>

          <div>
            <p className="text-[#495B7D]">
              Recovered
            </p>

            <p className="mt-1 font-semibold text-[#23354D]">
              {formatDateTime(incident.recovered_at)}
            </p>
          </div>
        </div>
      </div>

      {incident.recovery_action && (
        <div
          className={`mt-4 ml-0 border-l-2 pl-4 lg:ml-[52px] ${
            recovered
              ? "border-[#8BA3C5]"
              : "border-[#7A1F2B]"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#495B7D]">
            Recovery action
          </p>

          <p className="mt-1 text-xs text-[#23354D]">
            {incident.recovery_action}
          </p>
        </div>
      )}
    </div>
  );
}

function formatFailureName(value) {
  if (!value) {
    return "Unknown failure";
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatMilliseconds(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }

  return `${(value / 1000).toFixed(2)} s`;
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export default AdminDashboard;
