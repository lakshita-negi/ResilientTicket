
const express = require("express");

const router = express.Router();

const {
    createBooking,
    getBookingDetails,
    getUserBookings,
    downloadTicket
} = require("../controllers/bookingController");

router.post("/", createBooking);
router.get("/user/:userId", getUserBookings);
router.get("/:id", getBookingDetails);
router.get("/:id/ticket", downloadTicket);

module.exports = router;
