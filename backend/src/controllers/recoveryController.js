const {
    recoverStaleSeats
} = require("../services/recoveryService");



const recoverSeats = async (req, res) => {

    try {

        const result = await recoverStaleSeats();

        return res.status(200).json({
            success: true,
            message: result.recovered_count
                ? "Recovery completed"
                : "No stale orphaned seat locks found",
            recovered_count: result.recovered_count,
            recovered_seat_ids: result.recovered_seat_ids
        });

    } catch (error) {

        console.error("Recovery controller error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Recovery failed"
        });
    }
};

module.exports = {
    recoverSeats
};