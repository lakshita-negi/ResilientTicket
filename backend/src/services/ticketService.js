const pool = require("../config/db");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

let simulateTicketFailure = false;

const setTicketFailureSimulation = (enabled) => {
    simulateTicketFailure = enabled;
};


const generateTicketPdf = async (bookingId) => {

    if (simulateTicketFailure) {
    throw new Error(
        "Chaos injection: simulated ticket PDF generation failure"
    );
}

    // STEP 1: Get complete booking information

    const result = await pool.query(
        `SELECT
            b.id,
            b.user_id,
            b.pnr,
            b.journey_date,
            b.booking_status,
            b.total_amount,

            t.train_number,
            t.train_name,
            t.train_type,

            source.station_code AS source_code,
            source.station_name AS source_name,
            source.city AS source_city,

            destination.station_code AS destination_code,
            destination.station_name AS destination_name,
            destination.city AS destination_city,

            s.seat_number,
            s.coach,
            s.seat_type

         FROM bookings b

         JOIN trains t
           ON b.train_id = t.id

         JOIN stations source
           ON b.source_station_id = source.id

         JOIN stations destination
           ON b.destination_station_id = destination.id

         JOIN seats s
           ON b.seat_id = s.id

         WHERE b.id = $1
           AND UPPER(TRIM(b.booking_status)) = 'CONFIRMED'`,
        [bookingId]
    );

    // No confirmed booking found.
    if (result.rows.length === 0) {
        throw new Error(
            `Confirmed booking ${bookingId} was not found`
        );
    }

    const booking = result.rows[0];

    // STEP 2: Create tickets folder if it doesn't exist.
    const ticketsDirectory = path.join(
        __dirname,
        "../../tickets"
    );

    await fs.promises.mkdir(ticketsDirectory, {
        recursive: true
    });

    // STEP 3: Decide the PDF filename.
    const filePath = path.join(
        ticketsDirectory,
        `ticket-${booking.pnr}.pdf`
    );

    // STEP 4: Create PDF document.
    const pdf = new PDFDocument({
        size: "A4",
        margin: 50
    });

    const output = fs.createWriteStream(filePath);

    // STEP 5: Wait until the PDF is completely written.
    await new Promise((resolve, reject) => {

        output.on("finish", resolve);
        output.on("error", reject);

        pdf.on("error", reject);

        pdf.pipe(output);


        // TICKET HEADER


        pdf
            .fontSize(24)
            .font("Helvetica-Bold")
            .text("RESILIENTTICKET", {
                align: "center"
            });

        pdf.moveDown(0.5);

        pdf
            .fontSize(16)
            .font("Helvetica")
            .text("RAILWAY E-TICKET", {
                align: "center"
            });

        pdf.moveDown(1.5);

        
        // PNR
        

        pdf
            .fontSize(14)
            .font("Helvetica-Bold")
            .text(`PNR: ${booking.pnr}`, {
                align: "center"
            });

        pdf.moveDown(1.5);

        
        pdf
            .moveTo(50, pdf.y)
            .lineTo(545, pdf.y)
            .stroke();

        pdf.moveDown(1);

        
        // TRAIN INFORMATION
        

        pdf
            .fontSize(13)
            .font("Helvetica-Bold")
            .text("TRAIN INFORMATION");

        pdf.moveDown(0.5);

        pdf
            .fontSize(11)
            .font("Helvetica")
            .text(
                `Train: ${booking.train_name}`
            )
            .text(
                `Train Number: ${booking.train_number}`
            )
            .text(
                `Train Type: ${booking.train_type}`
            );

        pdf.moveDown(1);

        
        // JOURNEY INFORMATION
        
        pdf
            .fontSize(13)
            .font("Helvetica-Bold")
            .text("JOURNEY DETAILS");

        pdf.moveDown(0.5);

        pdf
            .fontSize(11)
            .font("Helvetica")
            .text(
                `From: ${booking.source_name} (${booking.source_code})`
            )
            .text(
                `To: ${booking.destination_name} (${booking.destination_code})`
            )
            .text(
                `Journey Date: ${String(booking.journey_date).slice(0, 10)}`
            );

        pdf.moveDown(1);

        
        // PASSENGER / SEAT DETAILS
        

        pdf
            .fontSize(13)
            .font("Helvetica-Bold")
            .text("PASSENGER & SEAT DETAILS");

        pdf.moveDown(0.5);

        pdf
            .fontSize(11)
            .font("Helvetica")
            .text(
                `Passenger/User ID: ${booking.user_id}`
            )
            .text(
                `Coach: ${booking.coach}`
            )
            .text(
                `Seat Number: ${booking.seat_number}`
            )
            .text(
                `Seat Type: ${booking.seat_type}`
            );

        pdf.moveDown(1);

        
        // PAYMENT INFORMATION
        
        pdf
            .fontSize(13)
            .font("Helvetica-Bold")
            .text("PAYMENT DETAILS");

        pdf.moveDown(0.5);

        pdf
            .fontSize(11)
            .font("Helvetica")
            .text(
                `Total Fare: Rs. ${booking.total_amount}`
            )
            .text(
                `Booking Status: ${booking.booking_status}`
            );

        pdf.moveDown(2);

        
        // FOOTER
        

        pdf
            .moveTo(50, pdf.y)
            .lineTo(545, pdf.y)
            .stroke();

        pdf.moveDown(1);

        pdf
            .fontSize(10)
            .font("Helvetica")
            .text(
                "Thank you for booking with ResilientTicket.",
                {
                    align: "center"
                }
            );

        pdf
            .text(
                "Please carry a valid ID during your journey.",
                {
                    align: "center"
                }
            );

        pdf.moveDown(1);

        pdf
            .fontSize(9)
            .text(
                "This is a system-generated electronic ticket.",
                {
                    align: "center"
                }
            );

        // Finish PDF generation.
        pdf.end();
    });

    
    // VERIFY PDF
    
    const stats = await fs.promises.stat(filePath);

    if (stats.size === 0) {
        throw new Error(
            "Generated ticket PDF is empty"
        );
    }

    console.log(
        `Ticket PDF successfully generated: ${filePath}`
    );

    return {
        filePath,
        fileName: path.basename(filePath)
    };
};

module.exports = {
    generateTicketPdf,
    setTicketFailureSimulation
};