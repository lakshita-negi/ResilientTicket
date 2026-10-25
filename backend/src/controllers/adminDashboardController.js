const pool = require("../config/db");

const {
    isTrainSearchAvailable
} = require("../services/trainSearchService");

const {
    isBookingServiceAvailable
} = require("../services/bookingService");

const getDashboardData = async (req, res) => {
    try {
        const healthStart = Date.now();

        await pool.query("SELECT 1");

        const databaseResponseTime = Date.now() - healthStart;

        const [
            incidentSummaryResult,
            performanceResult,
            failureDistributionResult,
            recentIncidentsResult
        ] = await Promise.all([
            pool.query(`
                SELECT
                    COUNT(*)::int AS total_incidents,
                    COUNT(*) FILTER (
                        WHERE UPPER(TRIM(status)) = 'RECOVERED'
                    )::int AS recovered_incidents,
                    COUNT(*) FILTER (
                        WHERE UPPER(TRIM(status)) <> 'RECOVERED'
                    )::int AS active_incidents,
                    COUNT(*) FILTER (
                        WHERE detected_at >= NOW() - INTERVAL '24 hours'
                    )::int AS incidents_last_24h
                FROM incidents
            `),

            pool.query(`
                SELECT
                    COALESCE(AVG(detection_time_ms), 0)::numeric(10,2)
                        AS average_detection_time_ms,

                    COALESCE(AVG(recovery_time_ms), 0)::numeric(10,2)
                        AS average_recovery_time_ms,

                    COALESCE(MAX(recovery_time_ms), 0)::int
                        AS maximum_recovery_time_ms,

                    COUNT(*) FILTER (
                        WHERE recovery_time_ms <= 30000
                    )::int AS recoveries_under_30s,

                    COUNT(*) FILTER (
                        WHERE UPPER(TRIM(status)) = 'RECOVERED'
                    )::int AS total_recovered
                FROM incidents
            `),

            pool.query(`
                SELECT
                    failure_type,
                    service,
                    COUNT(*)::int AS count
                FROM incidents
                GROUP BY failure_type, service
                ORDER BY count DESC
            `),

            pool.query(`
                SELECT
                    id,
                    failure_type,
                    service,
                    status,
                    detected_at,
                    diagnosed_at,
                    action_at,
                    recovered_at,
                    detection_time_ms,
                    recovery_time_ms,
                    recovery_action,
                    error_message
                FROM incidents
                ORDER BY detected_at DESC
                LIMIT 10
            `)
        ]);

        const incidentSummary = incidentSummaryResult.rows[0];
        const performance = performanceResult.rows[0];

        const services = {
            database: {
                status: "HEALTHY",
                response_time_ms: databaseResponseTime
            },

            trainSearch: {
                status: isTrainSearchAvailable()
                    ? "HEALTHY"
                    : "FAILED"
            },

            booking: {
                status: isBookingServiceAvailable()
                    ? "HEALTHY"
                    : "FAILED"
            },

            api: {
                status: "HEALTHY"
            }
        };

        const totalRecovered = Number(performance.total_recovered);

        const recoveriesUnder30s = Number(
            performance.recoveries_under_30s
        );

        const recoverySuccessRate =
            totalRecovered > 0
                ? Number(
                      (
                          (recoveriesUnder30s / totalRecovered) *
                          100
                      ).toFixed(1)
                  )
                : 0;

        const allServicesHealthy =
            services.database.status === "HEALTHY" &&
            services.trainSearch.status === "HEALTHY" &&
            services.booking.status === "HEALTHY" &&
            services.api.status === "HEALTHY";

        res.json({
            success: true,

            system: {
                status: allServicesHealthy
                    ? "HEALTHY"
                    : "DEGRADED",

                health_percentage: allServicesHealthy ? 100 : 75,

                database_response_time_ms:
                    databaseResponseTime
            },

            incidents: {
                total: Number(incidentSummary.total_incidents),
                recovered: Number(
                    incidentSummary.recovered_incidents
                ),
                active: Number(
                    incidentSummary.active_incidents
                ),
                last_24_hours: Number(
                    incidentSummary.incidents_last_24h
                )
            },

            recovery: {
                total: totalRecovered,

                average_detection_time_ms: Number(
                    performance.average_detection_time_ms
                ),

                average_recovery_time_ms: Number(
                    performance.average_recovery_time_ms
                ),

                maximum_recovery_time_ms: Number(
                    performance.maximum_recovery_time_ms
                ),

                under_30_seconds: recoveriesUnder30s,

                success_rate_under_30_seconds:
                    recoverySuccessRate,

                target_ms: 30000
            },

            services,

            failure_distribution:
                failureDistributionResult.rows.map((item) => ({
                    failure_type: item.failure_type,
                    service: item.service,
                    count: Number(item.count)
                })),

            recent_incidents:
                recentIncidentsResult.rows.map((incident) => ({
                    id: incident.id,
                    failure_type: incident.failure_type,
                    service: incident.service,
                    status: incident.status,
                    detected_at: incident.detected_at,
                    diagnosed_at: incident.diagnosed_at,
                    action_at: incident.action_at,
                    recovered_at: incident.recovered_at,
                    detection_time_ms:
                        incident.detection_time_ms,
                    recovery_time_ms:
                        incident.recovery_time_ms,
                    recovery_action:
                        incident.recovery_action,
                    error_message:
                        incident.error_message
                })),

            updated_at: new Date().toISOString()
        });
    } catch (error) {
        console.error(
            "Admin dashboard data error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to load admin dashboard data",
            error: error.message
        });
    }
};

module.exports = {
    getDashboardData
};
