import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1800&q=90";

const PASSENGER_IMAGE =
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85";

function Home() {
  return (
    <div className="min-h-screen bg-[#F0ECDD] text-[#23354D]">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="border-b border-[#C7CED8]">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <div className="grid gap-10 py-12 md:grid-cols-[1.25fr_0.75fr] md:items-end lg:gap-16 lg:py-16">
              <div>
                <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-[#495B7D]">
                  Resilient Railway Systems
                </p>

                <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-[#02122F] sm:text-6xl lg:text-8xl">
                  GO FURTHER.
                  <br />
                  <span className="italic font-normal">
                    WE'LL HANDLE THE REST.
                  </span>
                </h1>
              </div>

              <div className="max-w-lg pb-1 md:pb-2">
                <p className="text-base leading-7 text-[#495B7D] lg:text-lg lg:leading-8">
                  Search trains, choose your seat, and travel with a booking
                  system designed to keep moving when system failures occur.
                </p>

                <a
                  href="/book"
                  className="mt-7 inline-flex items-center bg-[#02122F] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-[#F0ECDD] transition hover:bg-[#23354D]"
                >
                  Book Your Journey
                </a>
              </div>
            </div>

            <div className="pb-3">
              <div className="overflow-hidden">
                <img
                  src={HERO_IMAGE}
                  alt="Modern passenger train travelling through a mountain landscape"
                  className="h-[300px] w-full object-cover sm:h-[430px] lg:h-[570px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 text-[9px] uppercase tracking-[0.14em] text-[#495B7D] sm:grid-cols-4">
                <span>Trainset · RT-VEL0X 09</span>
                <span>Corridor · Trans-Alpin 1X</span>
                <span>Altitude · 1,842 M</span>
                <span className="text-right">15W Catenary</span>
              </div>
            </div>
          </div>
        </section>

        {/* Destinations */}
        <section className="border-b border-[#C7CED8]">
          <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
            <div className="mb-8 grid gap-5 md:grid-cols-[0.3fr_0.7fr]">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#495B7D]">
                  Selected Corridors
                </p>

                <p className="mt-2 font-serif text-lg text-[#02122F]">
                  Active Transits
                </p>
              </div>

              <p className="max-w-xl text-sm leading-6 text-[#495B7D]">
                Direct railway services maintained under continuous monitoring
                and automatic system recovery.
              </p>
            </div>

            <div className="border-t border-[#C7CED8]">
              <RouteRow
                number="01 / 031"
                from="JAIPUR"
                to="NEW DELHI"
                code="JP / NDLS"
                time="4h 20m"
                type="Express"
              />

              <RouteRow
                number="02 / 420"
                from="AJMER"
                to="JAIPUR"
                code="AII / JP"
                time="2h 35m"
                type="Superfast"
              />

              <RouteRow
                number="03 / 072"
                from="BHOPAL"
                to="AGRA"
                code="BPL / AGC"
                time="6h 10m"
                type="Express"
              />

            </div>
          </div>
        </section>

        {/* Booking Experience */}
        <section className="border-b border-[#C7CED8]">
          <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="mb-8">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#495B7D]">
                Booking Experience
              </p>

              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em] text-[#02122F] sm:text-4xl">
                The Journey, In Motion.
              </h2>

              <p className="mt-2 text-sm text-[#495B7D]">
                A simple booking experience from search to departure.
              </p>
            </div>

            <div className="grid gap-8 border-t border-[#C7CED8] pt-8 lg:grid-cols-3">
              <BookingStep
                number="01"
                title="SEARCH"
                text="Find your train across connected routes with real-time availability and route information."
                footer="Status · Ready"
              />

              <BookingStep
                number="02"
                title="CHOOSE"
                text="Select your preferred train and available seat before continuing to your reservation."
                footer="Seats · Available"
              />

              <div className="relative">
                <p className="font-serif text-2xl text-[#495B7D]">03</p>

                <h3 className="mt-1 font-serif text-lg text-[#02122F]">
                  BOOK
                </h3>

                <p className="mt-2 max-w-sm text-xs leading-5 text-[#495B7D]">
                  Complete your journey with a secure reservation and automatic
                  seat allocation.
                </p>

                {/* Single ticket visual */}
                <div className="mt-5 border border-[#C7CED8] bg-[#E7E3D7] p-4">
                  <div className="flex items-start justify-between border-b border-[#C7CED8] pb-3">
                    <div>
                      <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-[#495B7D]">
                        ResilientTicket
                      </p>

                      <p className="mt-1 font-serif text-base text-[#02122F]">
                        BOOKING PASS
                      </p>
                    </div>

                    <p className="text-[8px] uppercase tracking-[0.12em] text-[#495B7D]">
                      Confirmed
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 py-4">
                    <TicketData label="From" value="JP" />
                    <TicketData label="To" value="NDLS" />
                    <TicketData label="Seat" value="14A" />
                  </div>

                  <div className="flex justify-between text-[7px] uppercase tracking-[0.12em] text-[#495B7D]">
                    <span>PNR · RT-7A62</span>
                    <span>Reservation Secure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Self Healing */}
        <section className="border-b border-[#C7CED8]">
          <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="grid gap-8 md:grid-cols-[0.7fr_0.3fr]">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#495B7D]">
                  Self-Healing Technology
                </p>

                <h2 className="mt-2 max-w-2xl font-serif text-3xl font-semibold leading-[0.98] tracking-[-0.03em] text-[#02122F] sm:text-4xl lg:text-5xl">
                  THE JOURNEY DOESN'T STOP WHEN
                  <br />
                  SOMETHING GOES WRONG.
                </h2>
              </div>

              <p className="max-w-sm text-sm leading-6 text-[#495B7D]">
                ResilientTicket continuously monitors supported services,
                detects failures, diagnoses the problem, and automatically
                recovers the system.
              </p>
            </div>

            <div className="mt-10 border border-[#C7CED8] bg-[#F7F4EA] px-5 py-8 sm:px-10">
              <div className="relative h-[150px]">
                <div className="absolute left-0 right-0 top-[72px] border-t border-[#23354D]" />

                <svg
                  viewBox="0 0 1000 150"
                  className="absolute inset-0 h-full w-full"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M40 72 C220 72 240 72 330 35 C430 -5 470 115 570 72 C670 30 690 72 780 72 C850 72 900 72 960 72"
                    fill="none"
                    stroke="#23354D"
                    strokeWidth="1.5"
                  />
                </svg>

                <FlowPoint
                  position="left-[3%]"
                  label="01 / DETECTED"
                  sub="Failure detected"
                />

                <FlowPoint
                  position="left-[31%]"
                  label="02 / DIAGNOSED"
                  sub="Root cause identified"
                />

                <FlowPoint
                  position="left-[59%]"
                  label="03 / ACTION TAKEN"
                  sub="Recovery initiated"
                />

                <FlowPoint
                  position="left-[88%]"
                  label="04 / RECOVERED"
                  sub="Service restored"
                />
              </div>

              <div className="grid grid-cols-3 border-t border-[#C7CED8] pt-4 text-[8px] uppercase tracking-[0.12em] text-[#495B7D]">
                <span>Automatic Detection</span>
                <span className="text-center">No Manual Intervention</span>
                <span className="text-right">Service Recovered</span>
              </div>
            </div>
          </div>
        </section>

        {/* System Philosophy */}
        <section className="border-b border-[#C7CED8]">
          <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#495B7D]">
              System Philosophy
            </p>

            <h2 className="mt-2 font-serif text-4xl font-semibold tracking-[-0.04em] text-[#02122F] sm:text-5xl">
              BUILT TO KEEP MOVING.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#495B7D]">
              Railway systems need to remain dependable even when individual
              services fail. ResilientTicket is designed around monitoring,
              detection, and automatic recovery.
            </p>

            <div className="mt-8 grid border-t border-[#C7CED8] md:grid-cols-3">
              <Capability
                number="01"
                title="SERVICE HEALTH"
                text="Continuous monitoring checks the health of important railway booking services and database operations."
              />

              <Capability
                number="02"
                title="INCIDENT DETECTION"
                text="Supported failures are detected and diagnosed so the system can respond before they become prolonged disruptions."
              />

              <Capability
                number="03"
                title="AUTOMATIC RECOVERY"
                text="Recovery actions restore supported services automatically without requiring manual intervention."
              />
            </div>
          </div>
        </section>

        {/* Passenger Experience */}
        <section className="border-b border-[#C7CED8]">
          <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.2fr_0.8fr] lg:px-12 lg:py-16">
            <div>
              <img
                src={PASSENGER_IMAGE}
                alt="Passenger looking through a train window"
                className="h-[350px] w-full object-cover sm:h-[450px] lg:h-[520px]"
              />

              <div className="flex justify-between py-2 text-[8px] uppercase tracking-[0.12em] text-[#495B7D]">
                <span>Passenger Experience</span>
                <span>Travel With Confidence</span>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#495B7D]">
                The Passenger Experience
              </p>

              <h2 className="mt-3 font-serif text-4xl font-semibold leading-[0.95] tracking-[-0.04em] text-[#02122F] sm:text-5xl">
                LESS TO WORRY ABOUT.
                <br />
                <span className="italic font-normal">
                  MORE TO LOOK FORWARD TO.
                </span>
              </h2>

              <p className="mt-5 max-w-md text-sm leading-6 text-[#495B7D]">
                Search for your train, choose your seat, and complete your
                booking while ResilientTicket handles supported system
                failures behind the scenes.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[#C7CED8] pt-4 text-[8px] uppercase tracking-[0.1em] text-[#495B7D]">
                <span>Simple Booking</span>
                <span>Reliable System</span>
                <span>Automatic Recovery</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#02122F] px-5 py-20 text-center text-[#F0ECDD] sm:px-8 lg:py-28">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#8BA3C5]">
            Your Next Journey
          </p>

          <h2 className="mx-auto mt-4 max-w-4xl font-serif text-4xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            WHERE ARE YOU GOING NEXT?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-[#C5D0DE]">
            Search your train, choose your seat, and start your journey with
            ResilientTicket.
          </p>

          <a
            href="/book"
            className="mt-7 inline-flex border border-[#F0ECDD] bg-[#F0ECDD] px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#02122F] transition hover:bg-transparent hover:text-[#F0ECDD]"
          >
            Book Your Journey
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function RouteRow({ number, from, to, code, time, type }) {
  return (
    <div className="grid grid-cols-[0.35fr_1fr_0.55fr] items-center gap-4 border-b border-[#C7CED8] py-5 md:grid-cols-[0.35fr_1fr_0.65fr]">
      <span className="text-[8px] font-medium uppercase tracking-[0.15em] text-[#495B7D]">
        Route // {number}
      </span>

      <div className="font-serif text-2xl tracking-[-0.02em] text-[#02122F] sm:text-3xl">
        {from}
        <span className="mx-2 text-[#8BA3C5]">——</span>
        {to}
      </div>

      <div className="text-right text-[8px] uppercase tracking-[0.1em] text-[#495B7D]">
        <span>{code}</span>
        <span className="mx-2">·</span>
        <span>{time}</span>
        <span className="mx-2 hidden sm:inline">·</span>
        <span className="hidden sm:inline">{type}</span>
      </div>
    </div>
  );
}

function BookingStep({ number, title, text, footer }) {
  return (
    <div className="border-t border-[#C7CED8] pt-4">
      <p className="font-serif text-2xl text-[#495B7D]">{number}</p>

      <h3 className="mt-1 font-serif text-lg text-[#02122F]">{title}</h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-[#495B7D]">
        {text}
      </p>

      <p className="mt-8 text-[8px] font-medium uppercase tracking-[0.14em] text-[#495B7D]">
        {footer}
      </p>
    </div>
  );
}

function TicketData({ label, value }) {
  return (
    <div>
      <p className="text-[7px] font-medium uppercase tracking-[0.1em] text-[#495B7D]">
        {label}
      </p>

      <p className="mt-1 font-serif text-sm text-[#02122F]">{value}</p>
    </div>
  );
}

function FlowPoint({ position, label, sub }) {
  return (
    <div
      className={`absolute top-[56px] ${position} -translate-x-1/2 text-center`}
    >
      <div className="mx-auto h-2 w-2 rounded-full bg-[#02122F]" />

      <p className="mt-3 whitespace-nowrap text-[7px] font-medium uppercase tracking-[0.08em] text-[#02122F]">
        {label}
      </p>

      <p className="mt-1 whitespace-nowrap text-[7px] text-[#495B7D]">
        {sub}
      </p>
    </div>
  );
}

function Capability({ number, title, text }) {
  return (
    <div className="border-b border-[#C7CED8] py-6 md:border-b-0 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0">
      <p className="text-[8px] font-medium uppercase tracking-[0.15em] text-[#495B7D]">
        Core Capability {number}
      </p>

      <h3 className="mt-2 font-serif text-lg text-[#02122F]">{title}</h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-[#495B7D]">
        {text}
      </p>
    </div>
  );
}

export default Home;
