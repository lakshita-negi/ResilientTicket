require("dotenv").config({ path: "../.env" });
const pool = require("../src/config/db");

const stations = [
    ["AII", "Ajmer Junction", "Ajmer", "Rajasthan"],
    ["JP", "Jaipur Junction", "Jaipur", "Rajasthan"],
    ["NDLS", "New Delhi", "New Delhi", "Delhi"],
    ["AGC", "Agra Cantt", "Agra", "Uttar Pradesh"],
    ["BCT", "Mumbai Central", "Mumbai", "Maharashtra"],
    ["ADI", "Ahmedabad Junction", "Ahmedabad", "Gujarat"],
    ["JOD", "Jodhpur Junction", "Jodhpur", "Rajasthan"],
    ["JU", "Jodhpur", "Jodhpur", "Rajasthan"],
    ["BKN", "Bikaner Junction", "Bikaner", "Rajasthan"],
    ["UDZ", "Udaipur City", "Udaipur", "Rajasthan"],
    ["KOTA", "Kota Junction", "Kota", "Rajasthan"],
    ["LKO", "Lucknow", "Lucknow", "Uttar Pradesh"],
    ["CNB", "Kanpur Central", "Kanpur", "Uttar Pradesh"],
    ["BPL", "Bhopal Junction", "Bhopal", "Madhya Pradesh"],
    ["INDB", "Indore Junction", "Indore", "Madhya Pradesh"],
    ["RTM", "Ratlam Junction", "Ratlam", "Madhya Pradesh"],
    ["NDM", "Nashik Road", "Nashik", "Maharashtra"],
    ["PUNE", "Pune Junction", "Pune", "Maharashtra"],
    ["SUR", "Solapur", "Solapur", "Maharashtra"],
    ["JAM", "Jammu Tawi", "Jammu", "Jammu & Kashmir"]
];

const trains = [
    ["12957", "Swarna Jayanti Rajdhani", "Rajdhani", 72],
    ["12958", "Delhi Mumbai Express", "Express", 72],
    ["12423", "Dilli Ajmer Superfast", "Superfast", 72],
    ["12916", "Ashram Express", "Express", 72],
    ["12015", "Ajmer Shatabdi", "Shatabdi", 72],
    ["12414", "Jodhpur Intercity", "Intercity", 72],
    ["12989", "Golden City Express", "Express", 72],
    ["12181", "Bhopal Jaipur Express", "Express", 72],
    ["12940", "Pune Jaipur Superfast", "Superfast", 72],
    ["12979", "Jaipur Bandra Express", "Express", 72]
];

const trainRoutes = [
    ["12957", ["JP", "AGC", "NDLS"]],
    ["12958", ["NDLS", "AGC", "BPL", "RTM", "BCT"]],
    ["12423", ["NDLS", "JP", "AII"]],
    ["12916", ["BCT", "ADI", "JP", "NDLS"]],
    ["12015", ["AII", "JP", "NDLS"]],
    ["12414", ["JOD", "AII", "JP", "KOTA"]],
    ["12989", ["ADI", "RTM", "BPL", "AGC", "NDLS"]],
    ["12181", ["BPL", "KOTA", "JP"]],
    ["12940", ["PUNE", "SUR", "RTM", "KOTA", "JP"]],
    ["12979", ["JP", "AII", "ADI", "BCT"]]
];

async function seedDatabase() {
    const client = await pool.connect();

    try {
        console.log("Starting ResilientTicket database seed...");

        await client.query("BEGIN");

        const userResult = await client.query(
            `SELECT id FROM users LIMIT 1`
        );

        let userId;

        if (userResult.rows.length === 0) {
            const result = await client.query(
                `INSERT INTO users
                (name, email, phone, password_hash)
                VALUES
                ($1, $2, $3, $4)
                RETURNING id`,
                [
                    "Demo Passenger",
                    "demo@resilientticket.com",
                    "9876543210",
                    "demo_password_hash"
                ]
            );

            userId = result.rows[0].id;
            console.log("Demo user created");
        } else {
            userId = userResult.rows[0].id;
            console.log("User data already exists");
        }

        const stationIds = {};

        for (const station of stations) {
            const [code, name, city, state] = station;

            const result = await client.query(
                `INSERT INTO stations
                (station_code, station_name, city, state)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (station_code)
                DO UPDATE SET station_name = EXCLUDED.station_name
                RETURNING id`,
                [code, name, city, state]
            );

            stationIds[code] = result.rows[0].id;
        }

        console.log(`${stations.length} stations ready`);

        const trainIds = {};

        for (const train of trains) {
            const [number, name, type, totalSeats] = train;

            const result = await client.query(
                `INSERT INTO trains
                (train_number, train_name, train_type, total_seats)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (train_number)
                DO UPDATE SET train_name = EXCLUDED.train_name
                RETURNING id`,
                [number, name, type, totalSeats]
            );

            trainIds[number] = result.rows[0].id;
        }

        console.log(`${trains.length} trains ready`);

        for (const route of trainRoutes) {
            const [trainNumber, routeStations] = route;
            const trainId = trainIds[trainNumber];

            for (let i = 0; i < routeStations.length; i++) {
                const stationCode = routeStations[i];
                const stationId = stationIds[stationCode];

                const arrivalHour = 6 + i * 2;
                const arrivalTime =
                    `${String(arrivalHour).padStart(2, "0")}:00:00`;

                const departureTime =
                    `${String(arrivalHour).padStart(2, "0")}:10:00`;

                await client.query(
                    `INSERT INTO train_stops
                    (train_id, station_id, stop_order, arrival_time, departure_time)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (train_id, station_id)
                    DO NOTHING`,
                    [
                        trainId,
                        stationId,
                        i + 1,
                        arrivalTime,
                        departureTime
                    ]
                );
            }
        }

        console.log("Train routes created");

        let totalSeatsCreated = 0;

        for (const train of trains) {
            const trainNumber = train[0];
            const trainId = trainIds[trainNumber];

            const existingSeats = await client.query(
                `SELECT COUNT(*) FROM seats WHERE train_id = $1`,
                [trainId]
            );

            if (Number(existingSeats.rows[0].count) === 0) {
                for (let i = 1; i <= 72; i++) {
                    let coach;

                    if (i <= 18) {
                        coach = "A1";
                    } else if (i <= 36) {
                        coach = "A2";
                    } else if (i <= 54) {
                        coach = "B1";
                    } else {
                        coach = "B2";
                    }

                    await client.query(
                        `INSERT INTO seats
                        (train_id, seat_number, coach, seat_type, status)
                        VALUES ($1, $2, $3, $4, $5)`,
                        [
                            trainId,
                            String(i),
                            coach,
                            "SEATER",
                            "AVAILABLE"
                        ]
                    );

                    totalSeatsCreated++;
                }
            }
        }

        console.log(`${totalSeatsCreated} seats created`);

        const services = [
            "Booking Service",
            "Train Search Service",
            "PostgreSQL",
            "Redis",
            "Payment Service",
            "Ticket Generator"
        ];

        for (const service of services) {
            await client.query(
                `INSERT INTO health_logs
                (service_name, status, response_time_ms,
                error_rate, request_count, cpu_usage, memory_usage)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    service,
                    "HEALTHY",
                    Math.floor(Math.random() * 30) + 5,
                    0,
                    0,
                    Math.floor(Math.random() * 20) + 10,
                    Math.floor(Math.random() * 30) + 20
                ]
            );
        }

        console.log("Initial health logs created");

        await client.query("COMMIT");

        console.log("\n====================================");
        console.log("DATABASE SEED COMPLETED");
        console.log("====================================");
        console.log(`Users: 1`);
        console.log(`Stations: ${stations.length}`);
        console.log(`Trains: ${trains.length}`);
        console.log(`Seats: ${totalSeatsCreated}`);
        console.log(`Health services: ${services.length}`);
        console.log("====================================\n");

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Seed failed:");
        console.error(error);

    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase();