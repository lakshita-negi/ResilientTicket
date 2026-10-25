import { useEffect, useState } from "react";
import {
  getStations,
  searchTrains,
  getTrainDetails,
  createBooking,
  getBookingDetails,
  downloadTicket,
} from "../services/api";

function SearchPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trains, setTrains] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [stations, setStations] = useState([]);
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [journeyDate, setJourneyDate] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const handleDownloadTicket = async () => {
    if (!booking) {
      return;
    }

    try {
      setDownloadLoading(true);
      setError("");

      await downloadTicket(booking.id);
    } catch (error) {
      console.error("Ticket download error:", error);
      setError(error.message || "Unable to download ticket");
    } finally {
      setDownloadLoading(false);
    }
  };

  useEffect(() => {
    const loadStations = async () => {
      try {
        const data = await getStations();
        setStations(data.stations || data);
      } catch (error) {
        console.error("Failed to load stations:", error);
        setError(error.message);
      }
    };

    loadStations();
  }, []);

  const handleSearch = async () => {
    setHasSearched(false);
    setError("");
    setSelectedTrain(null);
    setSelectedSeat(null);
    setBooking(null);

    if (!fromStation || !toStation) {
      setError("Please select both source and destination.");
      return;
    }

    if (fromStation === toStation) {
      setError("Source and destination cannot be the same.");
      return;
    }

    if (!journeyDate) {
      setError("Please select a travel date.");
      return;
    }

    try {
      setLoading(true);

      const data = await searchTrains(fromStation, toStation);

      setTrains(data.trains || []);
      setHasSearched(true);
    } catch (error) {
      console.error("Train search failed:", error);
      setError(error.message);
      setTrains([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrain = async (trainId) => {
    try {
      setError("");
      setBooking(null);
      setSelectedSeat(null);

      const data = await getTrainDetails(trainId);

      setSelectedTrain(data);
    } catch (error) {
      console.error("Failed to load train details:", error);
      setError(error.message);
    }
  };

  const handleSelectSeat = (seat) => {
    if (seat.status.toLowerCase() !== "available") {
      return;
    }

    setSelectedSeat(seat);
    setError("");
  };

  const handleBooking = async () => {
    setError("");

    if (!journeyDate) {
      setError("Please select a travel date.");
      return;
    }

    if (!selectedTrain) {
      setError("Please select a train.");
      return;
    }

    if (!selectedSeat) {
      setError("Please select a seat.");
      return;
    }

    const sourceStation = stations.find(
      (station) => station.station_code === fromStation
    );

    const destinationStation = stations.find(
      (station) => station.station_code === toStation
    );

    if (!sourceStation || !destinationStation) {
      setError("Unable to identify selected stations.");
      return;
    }

    const bookingData = {
      user_id: 1,
      train_id: selectedTrain.train.id,
      source_station_id: sourceStation.id,
      destination_station_id: destinationStation.id,
      journey_date: journeyDate,
      seat_id: selectedSeat.id,
    };

    try {
      setBookingLoading(true);

      const data = await createBooking(bookingData);

      const bookingDetails = await getBookingDetails(data.booking.id);

      setBooking(bookingDetails.booking);
    } catch (error) {
      console.error("BOOKING ERROR:", error);
      setError(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-16 max-w-6xl">
      <div className="rounded-3xl border border-[#495B7D]/20 bg-[#F0ECDD] p-6 shadow-sm md:p-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#02122F]">
            FIND YOUR JOURNEY
          </p>

          <h2 className="mt-2 font-serif text-3xl font-semibold text-[#02122F]">
            Search trains
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#495B7D]">
            Choose your stations and find available trains for your journey.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="from"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#23354D]"
            >
              From
            </label>

            <select
              id="from"
              value={fromStation}
              onChange={(e) => setFromStation(e.target.value)}
              className="w-full rounded-xl border border-[#495B7D]/30 bg-[#FFFCF6] px-4 py-3 text-sm text-[#23354D] outline-none transition focus:border-[#02122F] focus:ring-1 focus:ring-[#8BA3C5]"
            >
              <option value="">Select source</option>

              {stations.map((station) => (
                <option key={station.id} value={station.station_code}>
                  {station.station_name} ({station.station_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="to"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#23354D]"
            >
              To
            </label>

            <select
              id="to"
              value={toStation}
              onChange={(e) => setToStation(e.target.value)}
              className="w-full rounded-xl border border-[#495B7D]/30 bg-[#FFFCF6] px-4 py-3 text-sm text-[#23354D] outline-none transition focus:border-[#02122F] focus:ring-1 focus:ring-[#8BA3C5]"
            >
              <option value="">Select destination</option>

              {stations.map((station) => (
                <option key={station.id} value={station.station_code}>
                  {station.station_name} ({station.station_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="date"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#23354D]"
            >
              Travel Date
            </label>

            <input
              id="date"
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full rounded-xl border border-[#495B7D]/30 bg-[#FFFCF6] px-4 py-3 text-sm text-[#23354D] outline-none transition focus:border-[#02122F] focus:ring-1 focus:ring-[#8BA3C5]"
            />
          </div>

          <div>
            <label
              htmlFor="class"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#23354D]"
            >
              Class
            </label>

            <select
              id="class"
              className="w-full rounded-xl border border-[#495B7D]/30 bg-[#FFFCF6] px-4 py-3 text-sm text-[#23354D] outline-none transition focus:border-[#02122F] focus:ring-1 focus:ring-[#8BA3C5]"
            >
              <option value="SL">Sleeper</option>
              <option value="3A">AC 3 Tier</option>
              <option value="2A">AC 2 Tier</option>
              <option value="1A">First AC</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="rounded-xl bg-[#02122F] px-7 py-3 text-sm font-semibold text-[#F0ECDD] transition hover:bg-[#23354D] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search Trains"}
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-[#495B7D]/40 bg-[#8BA3C5]/15 px-4 py-3 text-sm text-[#23354D]">
            {error}
          </div>
        )}
      </div>

      {trains.length > 0 && (
        <div className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#02122F]">
              AVAILABLE JOURNEYS
            </p>

            <h2 className="mt-2 font-serif text-3xl font-semibold text-[#02122F]">
              Choose your train
            </h2>
          </div>

          <div className="space-y-5">
            {trains.map((train) => (
              <div
                key={train.id}
                className="rounded-2xl border border-[#495B7D]/20 bg-[#F0ECDD] p-6 shadow-sm transition hover:border-[#8BA3C5]"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-serif text-2xl font-semibold text-[#02122F]">
                        {train.train_name}
                      </h3>

                      <span className="rounded-full bg-[#8BA3C5]/25 px-3 py-1 text-xs font-semibold text-[#23354D]">
                        {train.train_type}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-[#495B7D]">
                      Train No. {train.train_number}
                    </p>
                  </div>

                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-2xl font-semibold text-[#02122F]">
                        {train.departure_time}
                      </p>

                      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[#495B7D]">
                        {train.source_code}
                      </p>
                    </div>

                    <div className="h-px w-12 bg-[#8BA3C5]" />

                    <div>
                      <p className="text-2xl font-semibold text-[#02122F]">
                        {train.arrival_time}
                      </p>

                      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[#495B7D]">
                        {train.destination_code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 lg:justify-end">
                    <div>
                      <p className="text-sm font-semibold text-[#23354D]">
                        {train.total_seats} seats
                      </p>

                      <p className="mt-1 text-xs text-[#495B7D]">
                        Available capacity
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectTrain(train.id)}
                      className="rounded-xl border border-[#02122F] px-5 py-2.5 text-sm font-semibold text-[#02122F] transition hover:bg-[#02122F] hover:text-[#F0ECDD]"
                    >
                      Select Train
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasSearched && trains.length === 0 && !error && (
        <div className="mt-10 rounded-3xl border border-[#495B7D]/20 bg-[#F0ECDD] px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#8BA3C5]/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-7 w-7 text-[#02122F]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 17h14M6 17V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9M4 17h16M8 20h.01M16 20h.01"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h8"
              />
            </svg>
          </div>

          <h2 className="mt-5 font-serif text-3xl font-semibold text-[#02122F]">
            No trains found
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#495B7D]">
            We couldn't find a direct train for this route. Try another
            station pair to continue your journey.
          </p>
        </div>
      )}

      {selectedTrain && (
        <div className="mt-10 rounded-3xl border border-[#495B7D]/20 bg-[#F0ECDD] p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#02122F]">
              TRAIN SELECTED
            </p>

            <h2 className="mt-2 font-serif text-3xl font-semibold text-[#02122F]">
              {selectedTrain.train?.train_name}
            </h2>

            <p className="mt-2 text-sm text-[#495B7D]">
              Train No. {selectedTrain.train?.train_number}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-[#8BA3C5]/15 p-4">
              <p className="text-xs uppercase tracking-wider text-[#495B7D]">
                Type
              </p>

              <p className="mt-1 font-semibold text-[#23354D]">
                {selectedTrain.train?.train_type}
              </p>
            </div>

            <div className="rounded-xl bg-[#8BA3C5]/15 p-4">
              <p className="text-xs uppercase tracking-wider text-[#495B7D]">
                Total Seats
              </p>

              <p className="mt-1 font-semibold text-[#23354D]">
                {selectedTrain.train?.total_seats}
              </p>
            </div>

            <div className="rounded-xl bg-[#8BA3C5]/35 p-4">
              <p className="text-xs uppercase tracking-wider text-[#23354D]">
                Available
              </p>

              <p className="mt-1 font-semibold text-[#02122F]">
                {
                  selectedTrain.seats?.filter(
                    (seat) =>
                      seat.status.toLowerCase() === "available"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-xl bg-[#8BA3C5]/15 p-4">
              <p className="text-xs uppercase tracking-wider text-[#495B7D]">
                Seats Loaded
              </p>

              <p className="mt-1 font-semibold text-[#23354D]">
                {selectedTrain.seats?.length || 0}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4">
              <h3 className="font-serif text-xl font-semibold text-[#02122F]">
                Seat availability
              </h3>

              <p className="mt-1 text-sm text-[#495B7D]">
                Select an available seat for your journey.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {selectedTrain.seats?.map((seat) => {
                const isAvailable =
                  seat.status.toLowerCase() === "available";

                const isSelected = selectedSeat?.id === seat.id;

                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleSelectSeat(seat)}
                    className={`rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-[#02122F] bg-[#02122F] text-[#F0ECDD]"
                        : isAvailable
                        ? "border-[#8BA3C5] bg-[#8BA3C5]/20 hover:border-[#02122F] hover:bg-[#8BA3C5]/35"
                        : "cursor-not-allowed border-[#495B7D]/20 bg-[#495B7D]/10 opacity-60"
                    }`}
                  >
                    <p className="font-semibold">{seat.seat_number}</p>

                    <p
                      className={`mt-1 text-xs ${
                        isSelected
                          ? "text-[#F0ECDD]/80"
                          : "text-[#495B7D]"
                      }`}
                    >
                      {seat.coach} · {seat.seat_type}
                    </p>

                    <p
                      className={`mt-2 text-xs font-semibold ${
                        isSelected
                          ? "text-[#F0ECDD]"
                          : isAvailable
                          ? "text-[#02122F]"
                          : "text-[#495B7D]"
                      }`}
                    >
                      {isSelected ? "Selected" : seat.status}
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedSeat && (
              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#02122F]/20 bg-[#8BA3C5]/15 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#495B7D]">
                    Selected Seat
                  </p>

                  <p className="mt-1 font-serif text-2xl font-semibold text-[#02122F]">
                    {selectedSeat.seat_number}
                  </p>

                  <p className="mt-1 text-sm text-[#495B7D]">
                    {selectedSeat.coach} · {selectedSeat.seat_type}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleBooking}
                  disabled={bookingLoading}
                  className="rounded-xl bg-[#02122F] px-6 py-3 text-sm font-semibold text-[#F0ECDD] transition hover:bg-[#23354D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bookingLoading ? "Booking..." : "Continue"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {booking && (
        <div className="mt-10 overflow-hidden rounded-3xl border border-[#495B7D]/20 bg-[#F0ECDD] shadow-sm">
          <div className="border-b border-[#02122F]/30 bg-[#23354D] px-6 py-6 text-[#F0ECDD] md:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8BA3C5]">
                  RESILIENTTICKET
                </p>

                <h2 className="mt-2 font-serif text-3xl font-semibold">
                  Your journey is confirmed
                </h2>

                <p className="mt-2 text-sm text-[#C5D0DE]">
                  Your booking has been successfully created.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-full bg-[#8BA3C5] px-4 py-2 text-sm font-semibold text-[#02122F]">
                <span className="h-2 w-2 rounded-full bg-[#02122F]" />
                Confirmed
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#495B7D]">
                  From
                </p>

                <p className="mt-2 font-serif text-3xl font-semibold text-[#02122F]">
                  {booking.source_code}
                </p>

                <p className="mt-1 text-sm text-[#495B7D]">
                  {booking.source_station}
                </p>
              </div>

              <div className="hidden lg:block">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#02122F]" />
                  <div className="h-px w-20 bg-[#8BA3C5]" />
                  <span className="h-2 w-2 rounded-full bg-[#02122F]" />
                </div>
              </div>

              <div className="lg:text-right">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#495B7D]">
                  To
                </p>

                <p className="mt-2 font-serif text-3xl font-semibold text-[#02122F]">
                  {booking.destination_code}
                </p>

                <p className="mt-1 text-sm text-[#495B7D]">
                  {booking.destination_station}
                </p>
              </div>
            </div>

            <div className="my-8 border-t border-dashed border-[#495B7D]/25" />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#495B7D]">
                  Train
                </p>

                <p className="mt-2 font-semibold text-[#23354D]">
                  {booking.train_name}
                </p>

                <p className="mt-1 text-sm text-[#495B7D]">
                  {booking.train_number} · {booking.train_type}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#495B7D]">
                  Journey Date
                </p>

                <p className="mt-2 font-semibold text-[#23354D]">
                  {new Date(booking.journey_date).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#495B7D]">
                  Seat
                </p>

                <p className="mt-2 font-semibold text-[#23354D]">
                  {booking.coach} / {booking.seat_number}
                </p>

                <p className="mt-1 text-sm text-[#495B7D]">
                  {booking.seat_type}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#495B7D]">
                  Amount
                </p>

                <p className="mt-2 font-semibold text-[#23354D]">
                  ₹{booking.total_amount}
                </p>
              </div>
            </div>

            <div className="my-8 border-t border-dashed border-[#495B7D]/25" />

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-[#8BA3C5]/15 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#495B7D]">
                  PNR
                </p>

                <p className="mt-2 font-serif text-2xl font-semibold tracking-wider text-[#02122F]">
                  {booking.pnr}
                </p>
              </div>

              <div className="rounded-2xl bg-[#8BA3C5]/30 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#23354D]">
                  Booking Status
                </p>

                <p className="mt-2 font-semibold text-[#02122F]">
                  {booking.booking_status}
                </p>
              </div>

              <div className="rounded-2xl bg-[#8BA3C5]/30 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#23354D]">
                  Ticket Status
                </p>

                <p className="mt-2 font-semibold text-[#02122F]">
                  {booking.ticket_status}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  })
                }
                className="rounded-xl border border-[#495B7D] px-6 py-3 text-sm font-semibold text-[#23354D] transition hover:border-[#02122F] hover:text-[#02122F]"
              >
                Book Another Journey
              </button>

              <button
                type="button"
                onClick={handleDownloadTicket}
                disabled={downloadLoading}
                className="rounded-xl bg-[#02122F] px-6 py-3 text-sm font-semibold text-[#F0ECDD] transition hover:bg-[#23354D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadLoading ? "Downloading..." : "Download Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default SearchPanel;
