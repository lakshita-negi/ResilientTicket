-- 1. USERS

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2. STATIONS


CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    station_code VARCHAR(10) UNIQUE NOT NULL,
    station_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL
);


-- 3. TRAINS


CREATE TABLE IF NOT EXISTS trains (
    id SERIAL PRIMARY KEY,
    train_number VARCHAR(20) UNIQUE NOT NULL,
    train_name VARCHAR(150) NOT NULL,
    train_type VARCHAR(50),
    total_seats INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- 4. TRAIN STOPS


CREATE TABLE IF NOT EXISTS train_stops (
    id SERIAL PRIMARY KEY,
    train_id INTEGER NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    UNIQUE(train_id, station_id),
    UNIQUE(train_id, stop_order)
);



-- 5. SEATS

CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    train_id INTEGER NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    coach VARCHAR(10) NOT NULL,
    seat_type VARCHAR(30) DEFAULT 'SEATER',
    status VARCHAR(20) DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'LOCKED', 'BOOKED')),
    UNIQUE(train_id, seat_number)
);



-- 6. PASSENGERS


CREATE TABLE IF NOT EXISTS passengers (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(20),
    seat_preference VARCHAR(30)
);



-- 7. BOOKINGS


CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    train_id INTEGER NOT NULL
        REFERENCES trains(id),

    source_station_id INTEGER NOT NULL
        REFERENCES stations(id),

    destination_station_id INTEGER NOT NULL
        REFERENCES stations(id),

    journey_date DATE NOT NULL,

    seat_id INTEGER
        REFERENCES seats(id),

    pnr VARCHAR(20) UNIQUE,

    booking_status VARCHAR(30) DEFAULT 'PENDING'
        CHECK (
            booking_status IN (
                'PENDING',
                'CONFIRMED',
                'CANCELLED',
                'FAILED'
            )
        ),

    ticket_status VARCHAR(30) DEFAULT 'PENDING'
        CHECK (
            ticket_status IN (
                'PENDING',
                'GENERATED',
                'FAILED'
            )
        ),

    total_amount DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 8. ADD BOOKING REFERENCE TO PASSENGERS


ALTER TABLE passengers
ADD CONSTRAINT fk_passenger_booking
FOREIGN KEY (booking_id)
REFERENCES bookings(id)
ON DELETE CASCADE;



-- 9. PAYMENTS


CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,

    booking_id INTEGER NOT NULL
        REFERENCES bookings(id) ON DELETE CASCADE,

    transaction_id VARCHAR(100) UNIQUE,

    amount DECIMAL(10,2) NOT NULL,

    payment_status VARCHAR(30) DEFAULT 'PENDING'
        CHECK (
            payment_status IN (
                'PENDING',
                'SUCCESS',
                'FAILED',
                'REFUNDED'
            )
        ),

    payment_method VARCHAR(30),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 10. SELF-HEALING INCIDENTS



CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,

    failure_type VARCHAR(100) NOT NULL,

    service VARCHAR(100) NOT NULL,

    status VARCHAR(30) DEFAULT 'DETECTED'
        CHECK (
            status IN (
                'DETECTED',
                'DIAGNOSED',
                'RECOVERING',
                'RECOVERED',
                'FAILED'
            )
        ),

    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    diagnosed_at TIMESTAMP,

    action_at TIMESTAMP,

    recovered_at TIMESTAMP,

    detection_time_ms INTEGER,

    recovery_time_ms INTEGER,

    recovery_action TEXT,

    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- 11. HEALTH LOGS



CREATE TABLE IF NOT EXISTS health_logs (
    id SERIAL PRIMARY KEY,

    service_name VARCHAR(100) NOT NULL,

    status VARCHAR(20) NOT NULL
        CHECK (
            status IN (
                'HEALTHY',
                'DEGRADED',
                'DOWN'
            )
        ),

    response_time_ms INTEGER,

    error_rate DECIMAL(5,2) DEFAULT 0,

    request_count INTEGER DEFAULT 0,

    cpu_usage DECIMAL(5,2),

    memory_usage DECIMAL(5,2),

    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- 12. INDEXES



CREATE INDEX IF NOT EXISTS idx_trains_number
ON trains(train_number);

CREATE INDEX IF NOT EXISTS idx_stations_code
ON stations(station_code);

CREATE INDEX IF NOT EXISTS idx_train_stops_train
ON train_stops(train_id);

CREATE INDEX IF NOT EXISTS idx_train_stops_station
ON train_stops(station_id);

CREATE INDEX IF NOT EXISTS idx_seats_train
ON seats(train_id);

CREATE INDEX IF NOT EXISTS idx_bookings_user
ON bookings(user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_train
ON bookings(train_id);

CREATE INDEX IF NOT EXISTS idx_bookings_pnr
ON bookings(pnr);

CREATE INDEX IF NOT EXISTS idx_payments_booking
ON payments(booking_id);

CREATE INDEX IF NOT EXISTS idx_incidents_status
ON incidents(status);

CREATE INDEX IF NOT EXISTS idx_incidents_service
ON incidents(service);

CREATE INDEX IF NOT EXISTS idx_health_logs_service
ON health_logs(service_name);




-- DATABASE SETUP COMPLETE



SELECT 'ResilientTicket database schema created successfully!' AS message;