
const pool = require("../config/db");

let serviceAvailable = true;
let failureDetectedAt = null;
let failureMessage = null;

const checkTrainSearchHealth = async () => {
    try {
        await pool.query("SELECT 1");

        return {
            healthy: true,
            message: "Train search service is healthy"
        };
    } catch (error) {
        return {
            healthy: false,
            message: "Train search database connection failed",
            error: error.message
        };
    }
};

// Mark a failure and preserve its original detection time.
const markTrainSearchFailed = (message = "Train search failed") => {
    if (serviceAvailable) {
        failureDetectedAt = new Date();
        failureMessage = message;

        console.log("Train search service marked as FAILED");
    }

    serviceAvailable = false;
};

const recoverTrainSearchService = async () => {
    try {
        await pool.query("SELECT 1");

        serviceAvailable = true;

        const previousFailure = {
            detectedAt: failureDetectedAt,
            errorMessage: failureMessage
        };

        failureDetectedAt = null;
        failureMessage = null;

        console.log("Train search service recovered successfully");

        return {
            recovered: true,
            message: "Train search service recovered",
            previousFailure
        };
    } catch (error) {
        serviceAvailable = false;

        console.error(
            "Train search recovery failed:",
            error.message
        );

        return {
            recovered: false,
            message: "Train search service is still unavailable"
        };
    }
};

const isTrainSearchAvailable = () => {
    return serviceAvailable;
};

const getTrainSearchFailureDetails = () => {
    return {
        detectedAt: failureDetectedAt,
        errorMessage: failureMessage
    };
};

module.exports = {
    checkTrainSearchHealth,
    recoverTrainSearchService,
    isTrainSearchAvailable,
    markTrainSearchFailed,
    getTrainSearchFailureDetails
};
