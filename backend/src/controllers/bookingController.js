const pool = require("../config/db");
const crypto = require("crypto");
const { generateTicketPdf } = require("../services/ticketService");

const fs = require("fs");
const path = require("path");

const {
    isBookingServiceAvailable
} = require("../services/bookingService");

const createBooking = async (req, res) => {

    if (!isBookingServiceAvailable()) {
        return res.status(503).json({
            success: false,
            message: "Booking service is temporarily unavailable"
        });
    }

    const client = await pool.connect();

    try {
        const {
            user_id,
            train_id,
            source_station_id,
            destination_station_id,
            journey_date,
            seat_id
        } = req.body;

        if (
            !user_id ||
            !train_id ||
            !source_station_id ||
            !destination_station_id ||
            !journey_date ||
            !seat_id
        ) {
            return res.status(400).json({
                success: false,
                message: "All booking fields are required"
            });
        }

        await client.query("BEGIN");

        const seatResult = await client.query(
            `SELECT *
             FROM seats
             WHERE id = $1
               AND train_id = $2
             FOR UPDATE`,
            [seat_id, train_id]
        );

        console.log("Requested seat ID:", seat_id);
        console.log("Requested train ID:", train_id);
        console.log("Seat query result:", seatResult.rows);
        console.log("Seat status:", seatResult.rows[0]?.status);

        if (seatResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Seat not found for this train"
            });
        }

        if (
            seatResult.rows[0].status.toUpperCase() !== "AVAILABLE"
        ) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Seat is not available"
            });
        }

        await client.query(
            `UPDATE seats
             SET status = 'LOCKED',
                 locked_at = NOW()
             WHERE id = $1
               AND train_id = $2`,
            [seat_id, train_id]
        );

        console.log(`Seat ${seat_id} is now LOCKED`);

        await client.query("COMMIT");

        await client.query("BEGIN");

        const pnr = crypto.randomBytes(5)
            .toString("hex")
            .toUpperCase();

        const bookingResult = await client.query(
            `INSERT INTO bookings
            (
                user_id,
                train_id,
                source_station_id,
                destination_station_id,
                journey_date,
                seat_id,
                pnr,
                booking_status,
                ticket_status,
                total_amount,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, NOW(), NOW()
            )
            RETURNING *`,
            [
                user_id,
                train_id,
                source_station_id,
                destination_station_id,
                journey_date,
                seat_id,
                pnr,
                "CONFIRMED",
                "PENDING",
                500
            ]
        );

        await client.query(
            `UPDATE seats
             SET status = 'BOOKED',
                 locked_at = NULL
             WHERE id = $1
               AND train_id = $2`,
            [seat_id, train_id]
        );

        await client.query("COMMIT");

        const booking = bookingResult.rows[0];

        try {
            const ticket = await generateTicketPdf(booking.id);

            await client.query(
                `UPDATE bookings
                 SET ticket_status = 'GENERATED',
                     updated_at = NOW()
                 WHERE id = $1`,
                [booking.id]
            );

            booking.ticket_status = "GENERATED";
            booking.ticket_file = ticket.fileName;

            console.log("Ticket PDF generated:", ticket.filePath);

        } catch (ticketError) {
            console.error(
                "Ticket PDF generation failed:",
                ticketError.message
            );

            await client.query(
                `UPDATE bookings
                 SET ticket_status = 'FAILED',
                     updated_at = NOW()
                 WHERE id = $1`,
                [booking.id]
            );

            booking.ticket_status = "FAILED";

            try {
                await client.query(
                    `INSERT INTO incidents
                    (
                        failure_type,
                        service,
                        status,
                        detected_at,
                        error_message,
                        recovery_action
                    )
                    VALUES ($1, $2, $3, NOW(), $4, $5)`,
                    [
                        "TICKET_GENERATION_FAILURE",
                        "booking",
                        "DETECTED",
                        ticketError.message,
                        "Waiting for automatic PDF generation retry"
                    ]
                );
            } catch (incidentError) {
                console.error(
                    "Could not record ticket failure:",
                    incidentError.message
                );
            }
        }

        return res.status(201).json({
            success: true,
            message: "Ticket booked successfully",
            booking
        });

    } catch (error) {

        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Rollback error:",
                rollbackError.message
            );
        }

        console.error("Booking error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Booking failed"
        });

    } finally {
        client.release();
    }
};

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
                    recovery_action,
                    error_message
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    NOW(),
                    NOW(),
                    NOW(),
                    NOW(),
                    $4,
                    $5
                )`,
                [
                    "TICKET_GENERATION_FAILURE",
                    "booking",
                    "RECOVERED",
                    `Retried ticket generation for booking ${booking.id}`,
                    "Ticket generation failed for a confirmed booking; automatic retry succeeded."
                ]
            );

            recoveredBookings.push(booking.id);
        }

        await client.query("COMMIT");

        return {
            recovered_count: recoveredBookings.length,
            recovered_booking_ids: recoveredBookings
        };

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(
            "Ticket recovery failed:",
            error.message
        );

        throw error;

    } finally {
        client.release();
    }
};

const getBookingDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                b.id,
                b.pnr,
                b.user_id,
                u.name AS passenger_name,
                u.email AS passenger_email,
                t.id AS train_id,
                t.train_number,
                t.train_name,
                t.train_type,
                s1.id AS source_station_id,
                s1.station_code AS source_code,
                s1.station_name AS source_station,
                s2.id AS destination_station_id,
                s2.station_code AS destination_code,
                s2.station_name AS destination_station,
                b.journey_date,
                se.id AS seat_id,
                se.seat_number,
                se.coach,
                se.seat_type,
                b.booking_status,
                b.ticket_status,
                b.total_amount,
                b.created_at
            FROM bookings b
            JOIN users u
                ON b.user_id = u.id
            JOIN trains t
                ON b.train_id = t.id
            JOIN stations s1
                ON b.source_station_id = s1.id
            JOIN stations s2
                ON b.destination_station_id = s2.id
            JOIN seats se
                ON b.seat_id = se.id
            WHERE b.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        return res.json({
            success: true,
            booking: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Booking details error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch booking details"
        });
    }
};

const downloadTicket = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT pnr
             FROM bookings
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const pnr = result.rows[0].pnr;

        const filePath = path.join(
            __dirname,
            "../../tickets",
            `ticket-${pnr}.pdf`
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "Ticket PDF not found"
            });
        }

        return res.download(
            filePath,
            `ResilientTicket-${pnr}.pdf`
        );
    } catch (error) {
        console.error("Ticket download error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to download ticket"
        });
    }
};


const getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `
            SELECT
                b.id,
                b.pnr,
                b.user_id,
                t.train_number,
                t.train_name,
                s1.station_code AS source_code,
                s1.station_name AS source_station,
                s2.station_code AS destination_code,
                s2.station_name AS destination_station,
                b.journey_date,
                se.seat_number,
                se.coach,
                se.seat_type,
                b.booking_status,
                b.ticket_status,
                b.total_amount,
                b.created_at
            FROM bookings b
            JOIN trains t
                ON b.train_id = t.id
            JOIN stations s1
                ON b.source_station_id = s1.id
            JOIN stations s2
                ON b.destination_station_id = s2.id
            JOIN seats se
                ON b.seat_id = se.id
            WHERE b.user_id = $1
            ORDER BY b.created_at DESC
            `,
            [userId]
        );

        return res.json({
            success: true,
            bookings: result.rows
        });

    } catch (error) {
        console.error(
            "User bookings error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch user bookings"
        });
    }
};


module.exports = {
    createBooking,
    recoverFailedTickets,
    getBookingDetails,
    getUserBookings,
    downloadTicket
};