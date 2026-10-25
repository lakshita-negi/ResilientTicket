const pool = require("../config/db");

const { generateTicketPdf } = require("./ticketService");

const {
    isTrainSearchAvailable,
    recoverTrainSearchService
} = require("./trainSearchService");

const {
    isBookingServiceAvailable,
    recoverBookingService
} = require("./bookingService");

const STALE_LOCK_MINUTES = 5;

const getRecoveryMetrics = (failure) => {
    const detectedAt = failure?.detectedAt
        ? new Date(failure.detectedAt)
        : new Date();

    const failedAt = failure?.failedAt
        ? new Date(failure.failedAt)
        : null;

    const recoveredAt = new Date();

    const detectionTimeMs = failedAt
        ? Math.max(0, detectedAt.getTime() - failedAt.getTime())
        : 0;

    const recoveryTimeMs = Math.max(
        0,
        recoveredAt.getTime() - detectedAt.getTime()
    );

    return {
        detectedAt,
        recoveredAt,
        detectionTimeMs,
        recoveryTimeMs
    };
};

const recoverStaleSeats = async () => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `SELECT s.id, s.train_id, s.seat_number, s.coach
             FROM seats s
             WHERE UPPER(TRIM(s.status)) = 'LOCKED'
               AND s.locked_at IS NOT NULL
               AND s.locked_at <
                   NOW() - ($1 * INTERVAL '1 minute')
               AND NOT EXISTS (
                   SELECT 1
                   FROM bookings b
                   WHERE b.seat_id = s.id
                     AND UPPER(TRIM(b.booking_status))
                         IN ('PENDING', 'CONFIRMED')
               )
             FOR UPDATE OF s SKIP LOCKED`,
            [STALE_LOCK_MINUTES]
        );

        const recoveredSeats = [];

        for (const seat of result.rows) {
            const detectedAt = new Date();

            const updateResult = await client.query(
                `UPDATE seats
                 SET status = 'AVAILABLE',
                     locked_at = NULL
                 WHERE id = $1
                   AND train_id = $2
                   AND UPPER(TRIM(status)) = 'LOCKED'
                   AND locked_at <
                       NOW() - ($3 * INTERVAL '1 minute')
                 RETURNING id`,
                [seat.id, seat.train_id, STALE_LOCK_MINUTES]
            );

            if (updateResult.rowCount === 0) {
                continue;
            }

            const diagnosedAt = new Date();
            const actionAt = new Date();
            const recoveredAt = new Date();

            const recoveryTimeMs = Math.max(
                0,
                recoveredAt.getTime() - detectedAt.getTime()
            );

            await client.query(
                `INSERT INTO incidents
                 (
                     failure_type,
                     service,
                     status,
                     detected_at,
                     diagnosed_at,
                     action_at,
                     recovered_at,
                     detection_time_ms,
                     recovery_time_ms,
                     recovery_action,
                     error_message
                 )
                 VALUES (
                     $1, $2, $3, $4, $5, $6,
                     $7, $8, $9, $10, $11
                 )`,
                [
                    "ORPHANED_SEAT_LOCK",
                    "booking",
                    "RECOVERED",
                    detectedAt,
                    diagnosedAt,
                    actionAt,
                    recoveredAt,
                    0,
                    recoveryTimeMs,
                    `Released locked seat ${seat.id}`,
                    "Seat lock exceeded the timeout and had no pending or confirmed booking"
                ]
            );

            recoveredSeats.push(seat.id);
        }

        await client.query("COMMIT");

        return {
            recovered_count: recoveredSeats.length,
            recovered_seat_ids: recoveredSeats
        };
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Seat recovery failed:", error.message);
        throw error;
    } finally {
        client.release();
    }
};

/*
    FAILURE 2 RECOVERY
    TICKET GENERATION

    This function only performs the actual ticket recovery.

    The incident lifecycle is handled by recoveryRoutes.js.
*/
const recoverFailedTickets = async () => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `SELECT id, pnr
             FROM bookings
             WHERE UPPER(TRIM(booking_status)) = 'CONFIRMED'
               AND UPPER(TRIM(ticket_status)) = 'FAILED'
             FOR UPDATE SKIP LOCKED`
        );

        const recoveredBookings = [];

        for (const booking of result.rows) {
            try {
                const ticket = await generateTicketPdf(booking.id);

                const updateResult = await client.query(
                    `UPDATE bookings
                     SET ticket_status = 'GENERATED',
                         updated_at = NOW()
                     WHERE id = $1
                       AND UPPER(TRIM(booking_status)) = 'CONFIRMED'
                       AND UPPER(TRIM(ticket_status)) = 'FAILED'
                     RETURNING id`,
                    [booking.id]
                );

                if (updateResult.rowCount === 0) {
                    continue;
                }

                recoveredBookings.push(booking.id);

                console.log(
                    `Ticket recovery succeeded for booking ${booking.id}: ${ticket.fileName}`
                );
            } catch (ticketError) {
                console.error(
                    `PDF retry failed for booking ${booking.id}:`,
                    ticketError.message
                );
            }
        }

        await client.query("COMMIT");

        return {
            recovered_count: recoveredBookings.length,
            recovered_booking_ids: recoveredBookings
        };
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Ticket recovery failed:", error.message);
        throw error;
    } finally {
        client.release();
    }
};

/*
    FAILURE 3 RECOVERY
    TRAIN SEARCH SERVICE

    This function only restores the train search service.

    The incident lifecycle is handled by recoveryRoutes.js.
    This prevents duplicate TRAIN_SEARCH_FAILURE incidents.
*/
const recoverFailedTrainSearch = async () => {
    if (isTrainSearchAvailable()) {
        return {
            recovered: false,
            message: "Train search service is already available"
        };
    }

    const result = await recoverTrainSearchService();

    if (!result.recovered) {
        return result;
    }


    return {
        recovered: true,
        message: "Train search service recovered"
    };
};

/*
    FAILURE 4 RECOVERY
    BOOKING SERVICE

    This function keeps the existing Failure 4
    recovery and incident-recording behavior.
*/
const recoverFailedBookingService = async () => {
    if (isBookingServiceAvailable()) {
        return {
            recovered: false,
            message: "Booking service is already available"
        };
    }

    const result = await recoverBookingService();

    if (!result.recovered) {
        return result;
    }

    const failure = result.previousFailure || {};

    const {
        detectedAt,
        recoveredAt,
        detectionTimeMs,
        recoveryTimeMs
    } = getRecoveryMetrics(failure);

    const diagnosedAt = new Date();
    const actionAt = new Date();

    await pool.query(
        `INSERT INTO incidents (
            failure_type,
            service,
            status,
            detected_at,
            diagnosed_at,
            action_at,
            recovered_at,
            detection_time_ms,
            recovery_time_ms,
            recovery_action,
            error_message
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11
        )`,
        [
            "BOOKING_SERVICE_FAILURE",
            "booking",
            "RECOVERED",
            detectedAt,
            diagnosedAt,
            actionAt,
            recoveredAt,
            detectionTimeMs,
            recoveryTimeMs,
            "Automatically restored booking service after a successful database health check",
            failure.errorMessage ||
                "Booking service became unavailable"
        ]
    );

    console.log("Booking service recovery recorded in incidents");

    return {
        recovered: true,
        message: "Booking service recovered and incident logged",
        detectionTimeMs,
        recoveryTimeMs
    };
};

module.exports = {
    recoverStaleSeats,
    recoverFailedTickets,
    recoverFailedTrainSearch,
    recoverFailedBookingService
};
