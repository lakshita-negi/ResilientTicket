
const pool = require("../config/db");

const RESPONSE_TIME_LIMIT = 1000; // 1 second

const checkHealth = async (req, res) => {
    const startTime = Date.now();

    try {
        // Check whether PostgreSQL responds
        await pool.query("SELECT 1");

        const responseTime = Date.now() - startTime;

        const isSlow = responseTime > RESPONSE_TIME_LIMIT;
        const status = isSlow ? "DEGRADED" : "HEALTHY";

        // Save the health check
        await pool.query(
            `INSERT INTO health_logs
            (service_name, status, response_time_ms,
             error_rate, request_count, checked_at)
            VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
                "database",
                status,
                responseTime,
                0,
                1
            ]
        );

        // Record an incident if the database is too slow
        if (isSlow) {
            await pool.query(
                `INSERT INTO incidents
                (failure_type, service, status,
                 detected_at, error_message)
                VALUES ($1, $2, $3, NOW(), $4)`,
                [
                    "HIGH_RESPONSE_TIME",
                    "database",
                    "DETECTED",
                    `Database response took ${responseTime} ms`
                ]
            );
        }

        return res.status(isSlow ? 503 : 200).json({
            success: !isSlow,
            service: "database",
            status,
            response_time_ms: responseTime,
            incident_detected: isSlow,
            message: isSlow
                ? "Slow database response detected and incident recorded"
                : "Database is responding normally"
        });

    } catch (error) {
        console.error("Health check error:", error.message);

        // If PostgreSQL is unavailable, writing to its tables
        // may also fail. Do not assume the incident was saved.
        return res.status(503).json({
            success: false,
            service: "database",
            status: "UNHEALTHY",
            incident_detected: false,
            incident_recorded: false,
            message: "Health check failed; incident could not be confirmed as recorded"
        });
    }
};

module.exports = { checkHealth };
