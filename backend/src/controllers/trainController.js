const pool = require("../config/db");
const {
    isTrainSearchAvailable,
    markTrainSearchFailed
} = require("../services/trainSearchService");

const searchTrains = async (req, res) => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({
                message: "Source and destination are required"
            });
        }

        if (!isTrainSearchAvailable()) {
            return res.status(503).json({
                success: false,
                message: "Train search service is temporarily unavailable"
            });
        }

        const result = await pool.query(
            `SELECT
                t.id,
                t.train_number,
                t.train_name,
                t.train_type,
                t.total_seats,
                s1.station_code AS source_code,
                s1.station_name AS source_station,
                s2.station_code AS destination_code,
                s2.station_name AS destination_station,
                ts1.departure_time AS departure_time,
                ts2.arrival_time AS arrival_time
            FROM trains t
            JOIN train_stops ts1
                ON t.id = ts1.train_id
            JOIN train_stops ts2
                ON t.id = ts2.train_id
            JOIN stations s1
                ON ts1.station_id = s1.id
            JOIN stations s2
                ON ts2.station_id = s2.id
            WHERE s1.station_code = $1
              AND s2.station_code = $2
              AND ts1.stop_order < ts2.stop_order
            ORDER BY ts1.departure_time`,
            [from.toUpperCase(), to.toUpperCase()]
        );

        res.json({
            success: true,
            count: result.rows.length,
            trains: result.rows
        });

    } catch (error) {
        console.error("Train search error:", error);

        markTrainSearchFailed();

        res.status(503).json({
            success: false,
            message: "Train search service temporarily unavailable"
        });
    }
};

const getTrainDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const trainResult = await pool.query(
            `SELECT
                id,
                train_number,
                train_name,
                train_type,
                total_seats
            FROM trains
            WHERE id = $1`,
            [id]
        );

        if (trainResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Train not found"
            });
        }

        const seatResult = await pool.query(
            `SELECT
                id,
                seat_number,
                coach,
                seat_type,
                status
            FROM seats
            WHERE train_id = $1
            ORDER BY id`,
            [id]
        );

        res.json({
            success: true,
            train: trainResult.rows[0],
            seats: seatResult.rows
        });

    } catch (error) {
        console.error("Train details error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch train details"
        });
    }
};

module.exports = {
    searchTrains,
    getTrainDetails
};