const pool = require("../config/db");
const express = require("express");
const router = express.Router();

const { recoverSeats } = require("../controllers/recoveryController");

const {
    recoverFailedTickets,
    recoverFailedTrainSearch,
    recoverFailedBookingService
} = require("../services/recoveryService");

const { markTrainSearchFailed } = require("../services/trainSearchService");
const { markBookingServiceFailed } = require("../services/bookingService");

const RECOVERY_DELAY_MS = 30000;

router.post("/seats", recoverSeats);


/*
    FAILURE 1
    STALE / ORPHANED SEAT LOCK
*/
router.post("/chaos/stale-seat-lock", async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(`
            SELECT s.id
            FROM seats s
            WHERE UPPER(TRIM(s.status)) = 'AVAILABLE'
              AND NOT EXISTS (
                  SELECT 1
                  FROM bookings b
                  WHERE b.seat_id = s.id
                    AND UPPER(TRIM(b.booking_status))
                        IN ('PENDING', 'CONFIRMED')
              )
            LIMIT 1
            FOR UPDATE
        `);

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "No eligible test seat is available for chaos injection"
            });
        }

        const seatId = result.rows[0].id;
        const detectedAt = new Date();

        await client.query(`
            UPDATE seats
            SET
                status = 'LOCKED',
                locked_at = NOW()
            WHERE id = $1
              AND UPPER(TRIM(status)) = 'AVAILABLE'
        `, [seatId]);

        const incidentResult = await client.query(`
            INSERT INTO incidents
            (
                failure_type,
                service,
                status,
                detected_at,
                detection_time_ms,
                error_message
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            RETURNING id
        `, [
            "ORPHANED_SEAT_LOCK",
            "booking",
            "DETECTED",
            detectedAt,
            0,
            "Chaos injection created an orphaned seat lock"
        ]);

        const incidentId = incidentResult.rows[0].id;

        await client.query("COMMIT");

        setTimeout(async () => {
            try {
                const diagnosedAt = new Date();

                await pool.query(`
                    UPDATE incidents
                    SET
                        status = 'DIAGNOSED',
                        diagnosed_at = $1
                    WHERE id = $2
                `, [
                    diagnosedAt,
                    incidentId
                ]);

                const recoveringAt = new Date();

                await pool.query(`
                    UPDATE incidents
                    SET
                        status = 'RECOVERING',
                        action_at = $1
                    WHERE id = $2
                `, [
                    recoveringAt,
                    incidentId
                ]);

                const recoveryResult = await pool.query(`
                    UPDATE seats
                    SET
                        status = 'AVAILABLE',
                        locked_at = NULL
                    WHERE id = $1
                      AND UPPER(TRIM(status)) = 'LOCKED'
                      AND NOT EXISTS (
                          SELECT 1
                          FROM bookings b
                          WHERE b.seat_id = $1
                            AND UPPER(TRIM(b.booking_status))
                                IN ('PENDING', 'CONFIRMED')
                      )
                    RETURNING id
                `, [seatId]);

                if (recoveryResult.rowCount === 0) {
                    await pool.query(`
                        UPDATE incidents
                        SET status = 'FAILED'
                        WHERE id = $1
                    `, [incidentId]);

                    console.log(
                        `Failure 1 recovery skipped for seat ${seatId}`
                    );

                    return;
                }

                const recoveredAt = new Date();

                await pool.query(`
                    UPDATE incidents
                    SET
                        status = 'RECOVERED',
                        recovered_at = $1,
                        recovery_time_ms = $2,
                        recovery_action = $3
                    WHERE id = $4
                `, [
                    recoveredAt,
                    recoveredAt.getTime() - detectedAt.getTime(),
                    `Released orphaned seat lock ${seatId}`,
                    incidentId
                ]);

                console.log(
                    `Failure 1 recovered automatically: seat ${seatId}`
                );

            } catch (error) {
                console.error(
                    "Failure 1 recovery error:",
                    error.message
                );
            }
        }, RECOVERY_DELAY_MS);

        return res.status(200).json({
            success: true,
            message: "Chaos injected: stale seat lock created",
            seatId,
            incidentId,
            recovery: "Automatic recovery will occur in 30 seconds"
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Failure 1 chaos error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to inject stale seat lock chaos",
            error: error.message
        });

    } finally {
        client.release();
    }
});


/*
    FAILURE 2
    TICKET GENERATION FAILURE
*/
router.post("/chaos/ticket-generation", async (req, res) => {
    const bookingId = Number(req.body?.bookingId);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({
            success: false,
            message: "A valid bookingId is required"
        });
    }

    try {
        const updateResult = await pool.query(`
            UPDATE bookings
            SET
                ticket_status = 'FAILED',
                updated_at = NOW()
            WHERE id = $1
              AND booking_status = 'CONFIRMED'
              AND ticket_status = 'GENERATED'
            RETURNING id
        `, [bookingId]);

        if (updateResult.rowCount === 0) {
            return res.status(409).json({
                success: false,
                message: "Booking must be CONFIRMED with a GENERATED ticket"
            });
        }

        const detectedAt = new Date();

        const incidentResult = await pool.query(`
            INSERT INTO incidents
            (
                failure_type,
                service,
                status,
                detected_at,
                detection_time_ms,
                error_message
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            RETURNING id
        `, [
            "TICKET_GENERATION_FAILURE",
            "ticket",
            "DETECTED",
            detectedAt,
            0,
            `Chaos injection: ticket generation failed for booking ${bookingId}`
        ]);

        const incidentId = incidentResult.rows[0].id;

        setTimeout(async () => {
            try {
                const diagnosedAt = new Date();

                await pool.query(`
                    UPDATE incidents
                    SET
                        status = 'DIAGNOSED',
                        diagnosed_at = $1
                    WHERE id = $2
                `, [
                    diagnosedAt,
                    incidentId
                ]);

                const recoveringAt = new Date();

                await pool.query(`
                    UPDATE incidents
                    SET
                        status = 'RECOVERING',
                        action_at = $1
                    WHERE id = $2
                `, [
                    recoveringAt,
                    incidentId
                ]);

                await recoverFailedTickets();

                const check = await pool.query(`
                    SELECT ticket_status
                    FROM bookings
                    WHERE id = $1
                `, [bookingId]);

                if (
                    check.rows.length === 0 ||
                    check.rows[0].ticket_status !== "GENERATED"
                ) {
                    await pool.query(`
                        UPDATE incidents
                        SET status = 'FAILED'
                        WHERE id = $1
                    `, [incidentId]);

                    console.log(
                        `Failure 2 recovery did not complete for booking ${bookingId}`
                    );

                    return;
                }

                const recoveredAt = new Date();

                await pool.query(`
                    UPDATE incidents
                    SET
                        status = 'RECOVERED',
                        recovered_at = $1,
                        recovery_time_ms = $2,
                        recovery_action = $3
                    WHERE id = $4
                `, [
                    recoveredAt,
                    recoveredAt.getTime() - detectedAt.getTime(),
                    `Regenerated ticket for booking ${bookingId}`,
                    incidentId
                ]);

                console.log(
                    `Failure 2 recovered automatically: booking ${bookingId}`
                );

            } catch (error) {
                console.error(
                    "Failure 2 recovery error:",
                    error.message
                );
            }
        }, RECOVERY_DELAY_MS);

        return res.status(200).json({
            success: true,
            message: "Chaos injected: ticket generation failure",
            bookingId,
            incidentId,
            recovery: "Automatic recovery will occur in 30 seconds"
        });

    } catch (error) {
        console.error("Failure 2 chaos error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to inject ticket generation failure",
            error: error.message
        });
    }
});


/*
    FAILURE 3
    TRAIN SEARCH SERVICE FAILURE
*/
router.post("/chaos/train-search", async (req, res) => {
    try {
        const detectedAt = new Date();

        markTrainSearchFailed(
            "Chaos injection: Train search service failure"
        );

        const incidentResult = await pool.query(`
            INSERT INTO incidents
            (
                failure_type,
                service,
                status,
                detected_at,
                detection_time_ms,
                error_message
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            RETURNING id
        `, [
            "TRAIN_SEARCH_FAILURE",
            "train-search",
            "DETECTED",
            detectedAt,
            0,
            "Chaos injection: Train search service failure"
        ]);

        const incidentId = incidentResult.rows[0].id;

        setTimeout(async () => {
            try {
                const diagnosedAt = new Date();

                await pool.query(`
                    UPDATE incidents
                    SET
                        status = 'DIAGNOSED',
                        diagnosed_at = $1
                    WHERE id = $2
                `, [
                    diagnosedAt,
                    incidentId
                ]);

                const recoveringAt = new Date();

                await pool.query(`
                    UPDATE incidents
                    SET
                        status = 'RECOVERING',
                        action_at = $1
                    WHERE id = $2
                `, [
                    recoveringAt,
                    incidentId
                ]);

                await recoverFailedTrainSearch();

                const recoveredAt = new Date();

                await pool.query(`
                    UPDATE incidents
                    SET
                        status = 'RECOVERED',
                        recovered_at = $1,
                        recovery_time_ms = $2,
                        recovery_action = $3
                    WHERE id = $4
                `, [
                    recoveredAt,
                    recoveredAt.getTime() - detectedAt.getTime(),
                    "Restored train search service",
                    incidentId
                ]);

                console.log(
                    "Failure 3 recovered automatically"
                );

            } catch (error) {
                console.error(
                    "Failure 3 recovery error:",
                    error.message
                );
            }
        }, RECOVERY_DELAY_MS);

        return res.status(200).json({
            success: true,
            message: "Chaos injected: train search service failure",
            incidentId,
            recovery: "Automatic recovery will occur in 30 seconds"
        });

    } catch (error) {
        console.error("Failure 3 chaos error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to inject train search failure",
            error: error.message
        });
    }
});


/*
    FAILURE 4
    BOOKING SERVICE FAILURE
*/
router.post("/chaos/booking", async (req, res) => {
    try {
        const detectedAt = new Date();

        markBookingServiceFailed(
            "Chaos injection: Booking service failure"
        );

        const incidentResult = await pool.query(`
            INSERT INTO incidents
            (
                failure_type,
                service,
                status,
                detected_at,
                detection_time_ms,
                error_message
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            RETURNING id
        `, [
            "BOOKING_SERVICE_FAILURE",
            "booking",
            "DETECTED",
            detectedAt,
            0,
            "Chaos injection: Booking service failure"
        ]);

        const incidentId = incidentResult.rows[0].id;

        setTimeout(async () => {
            try {
                const diagnosedAt = new Date();

                await pool.query(`
                    UPDATE incidents
                    SET
                        status = 'DIAGNOSED',
                        diagnosed_at = $1
                    WHERE id = $2
                `, [
                    diagnosedAt,
                    incidentId
                ]);

                const recoveringAt = new Date();

                await pool.query(`
                    UPDATE incidents
                    SET
                        status = 'RECOVERING',
                        action_at = $1
                    WHERE id = $2
                `, [
                    recoveringAt,
                    incidentId
                ]);

                await recoverFailedBookingService();

                const recoveredAt = new Date();

                await pool.query(`
                    UPDATE incidents
                    SET
                        status = 'RECOVERED',
                        recovered_at = $1,
                        recovery_time_ms = $2,
                        recovery_action = $3
                    WHERE id = $4
                `, [
                    recoveredAt,
                    recoveredAt.getTime() - detectedAt.getTime(),
                    "Restored booking service",
                    incidentId
                ]);

                console.log(
                    "Failure 4 recovered automatically"
                );

            } catch (error) {
                console.error(
                    "Failure 4 recovery error:",
                    error.message
                );
            }
        }, RECOVERY_DELAY_MS);

        return res.status(200).json({
            success: true,
            message: "Chaos injected: booking service failure",
            incidentId,
            recovery: "Automatic recovery will occur in 30 seconds"
        });

    } catch (error) {
        console.error("Failure 4 chaos error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to inject booking service failure",
            error: error.message
        });
    }
});


module.exports = router;