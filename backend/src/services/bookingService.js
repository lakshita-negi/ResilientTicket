const pool = require("../config/db");

let serviceAvailable = true;
let failureDetectedAt = null;
let failureMessage = null;

const checkBookingServiceHealth = async () => {
    try {
        await pool.query("SELECT 1");

        return {
            healthy: true,
            message: "Booking service is healthy"
        };
    } catch (error) {
        return {
            healthy: false,
            message: "Booking service database check failed",
            error: error.message
        };
    }
};

const markBookingServiceFailed = (
    message = "Booking service failed"
) => {
    if (serviceAvailable) {
        failureDetectedAt = new Date();
        failureMessage = message;

        console.log("Booking service marked as FAILED");
    }

    serviceAvailable = false;
};

const recoverBookingService = async () => {
    try {
        await pool.query("SELECT 1");

        const previousFailure = {
            detectedAt: failureDetectedAt,
            errorMessage: failureMessage
        };

        serviceAvailable = true;
        failureDetectedAt = null;
        failureMessage = null;

        console.log("Booking service recovered successfully");

        return {
            recovered: true,
            message: "Booking service recovered",
            previousFailure
        };
    } catch (error) {
        serviceAvailable = false;

        console.error(
            "Booking service recovery failed:",
            error.message
        );

        return {
            recovered: false,
            message: "Booking service is still unavailable"
        };
    }
};

const isBookingServiceAvailable = () => {
    return serviceAvailable;
};

const getBookingServiceFailureDetails = () => {
    return {
        detectedAt: failureDetectedAt,
        errorMessage: failureMessage
    };
};

module.exports = {
    checkBookingServiceHealth,
    markBookingServiceFailed,
    recoverBookingService,
    isBookingServiceAvailable,
    getBookingServiceFailureDetails
};
