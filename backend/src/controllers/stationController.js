const pool = require("../config/db");

const getStations = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                id,
                station_code,
                station_name
            FROM stations
            ORDER BY station_name
            `
        );

        res.json({
            success: true,
            count: result.rows.length,
            stations: result.rows
        });

    } catch (error) {
        console.error("Station fetch error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch stations"
        });
    }
};

module.exports = {
    getStations
};