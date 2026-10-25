const pool = require("../config/db");
const express = require("express");

const router = express.Router();

const {
    recoverSeats
} = require("../controllers/recoveryController");

const {
    markTrainSearchFailed
} = require("../services/trainSearchService");

const {
    markBookingServiceFailed
} = require("../services/bookingService");

const {
    generateTicketPdf,
    setTicketFailureSimulation
} = require("../services/ticketService");

router.post("/seats", recoverSeats);

/*
   FAILURE 1
   Stale / orphaned seat lock

   This route ONLY creates the failure.
   The 30-second scheduler will recover it automatically.
*/
router.post("/chaos/stale-seat-lock", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.id
             FROM seats s
             WHERE UPPER(TRIM(s.status)) = 'AVAILABLE'
               AND NOT EXISTS (
                   SELECT 1
                   FROM bookings b
                   WHERE b.seat_id = s.id
                     AND UPPER(TRIM(b.booking_status))
                         IN ('PENDING', 'CONFIRMED')
               )
             LIMIT 1`
        );

        if (result.rows.length === 0) {
            return res.status(409).json({
                success: false,
                message: "No eligible test seat is available for chaos injection"
            });
        }

        const seatId = result.rows[0].id;

        await pool.query(
            `UPDATE seats
             SET status = 'LOCKED',
                 locked_at = NOW() - INTERVAL '6 minutes'
             WHERE id = $1
               AND UPPER(TRIM(status)) = 'AVAILABLE'`,
            [seatId]
        );

        return res.status(200).json({
            success: true,
            message: "Chaos injected: stale seat lock created",
            seatId,
            recovery:
                "Automatic recovery will be attempted by the 30-second scheduler"
        });
    } catch (error) {
        console.error(
            "Stale seat chaos injection failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Could not inject stale seat lock"
        });
    }
});


/*
   FAILURE 2
   Ticket generation failure

   This route marks the ticket as FAILED.
   The scheduler will later call recoverFailedTickets().
*/
router.post("/chaos/ticket-generation", async (req, res) => {
    const bookingId = Number(req.body?.bookingId);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Provide a valid test bookingId in the request body"
        });
    }

    try {
        const updateResult = await pool.query(
            `UPDATE bookings
             SET ticket_status = 'FAILED',
                 updated_at = NOW()
             WHERE id = $1
               AND UPPER(TRIM(booking_status)) = 'CONFIRMED'
               AND UPPER(TRIM(ticket_status)) = 'GENERATED'
             RETURNING id`,
            [bookingId]
        );

        if (updateResult.rowCount === 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Booking not found, not confirmed, or its ticket is not currently GENERATED. No failure injected."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Chaos injected: ticket generation failure created",
            bookingId,
            recovery:
                "Automatic recovery will be attempted by the 30-second scheduler"
        });
    } catch (error) {
        console.error(
            "Ticket generation chaos injection failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Could not inject ticket generation failure"
        });
    }
});


/*
   FAILURE 3
   Train search service failure

   This route ONLY marks the service as failed.
   The scheduler will recover it automatically.
*/
router.post("/chaos/train-search", (req, res) => {
    try {
        markTrainSearchFailed(
            "Chaos injection: Train search service failure"
        );

        return res.status(200).json({
            success: true,
            message:
                "Chaos injected: train search service marked as FAILED",
            recovery:
                "Automatic recovery will be attempted by the 30-second scheduler"
        });
    } catch (error) {
        console.error(
            "Train search chaos injection failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Could not inject train search failure"
        });
    }
});


/*
   FAILURE 4
   Booking service failure

   This route ONLY marks the service as failed.
   The scheduler will recover it automatically.
*/
router.post("/chaos/booking", (req, res) => {
    try {
        markBookingServiceFailed(
            "Chaos injection: Booking service failure"
        );

        return res.status(200).json({
            success: true,
            message:
                "Chaos injected: booking service marked as FAILED",
            recovery:
                "Automatic recovery will be attempted by the 30-second scheduler"
        });
    } catch (error) {
        console.error(
            "Booking service chaos injection failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Could not inject booking service failure"
        });
    }
});


module.exports = router;