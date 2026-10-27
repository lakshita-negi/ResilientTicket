# ResilientTicket

## Self-Healing Railway Ticket Booking System

ResilientTicket is a full-stack railway ticket booking system designed with **self-healing capabilities**.

The system provides normal railway ticket booking functionality while also monitoring application health, detecting failures, recording incidents, and automatically performing recovery actions.

The main objective of ResilientTicket is to demonstrate how a software system can **detect failures, diagnose the affected component, recover automatically, and continue providing its services without requiring manual intervention**.

The entire application is also **Dockerized**, allowing the frontend, backend, and PostgreSQL database to run as separate containers through Docker Compose.

---

# Project Overview

Traditional applications often require a developer or administrator to manually identify and fix failures.

ResilientTicket follows a different approach.

When a supported failure occurs, the system attempts to:

```text
Failure
   ↓
Detection
   ↓
Diagnosis
   ↓
Recovery Action
   ↓
Verification
   ↓
Recovered
```

This makes the application more resilient to common failures that can occur in a railway ticket booking system.

---

# Features

## Railway Ticket Booking

The passenger-facing application provides core railway booking functionality, including:

- Search trains between stations
- Select source and destination stations
- Select journey date
- View available trains
- View train details
- Select available seats
- Create bookings
- Confirm bookings
- Generate tickets
- View booking details
- View ticket information

---

## Self-Healing

ResilientTicket contains recovery mechanisms designed to automatically respond to different application failures.

The system is designed around the following incident lifecycle:

```text
┌──────────────┐
│   Detected   │
└──────┬───────┘
       ↓
┌──────────────┐
│  Diagnosed   │
└──────┬───────┘
       ↓
┌──────────────┐
│ Action Taken │
└──────┬───────┘
       ↓
┌──────────────┐
│   Recovered  │
└──────────────┘
```

Recovery activity can be recorded with timestamps and incident information.

---

## Health Monitoring

The system monitors important application services and resources to identify unhealthy states.

The health system can be used to determine whether a service is:

- Healthy
- Degraded
- Failed

This health information forms an important part of the self-healing process.

---

## Incident Logging

The system maintains incident information related to failures and recovery operations.

An incident can contain information such as:

- Failure type
- Affected service
- Incident status
- Recovery action
- Recovery result
- Detection time
- Recovery time
- Additional notes

This makes it possible to understand what happened during a failure and how the system recovered.

---

# Failure Scenarios

ResilientTicket focuses on four major failure scenarios.

These failures are intentionally designed around different parts of the railway ticket booking workflow.

---

## Failure 1 — Automatic Stale Seat Lock Recovery

### Problem

A seat can remain in the `LOCKED` state even though there is no pending or confirmed booking associated with it.

This creates an **orphaned seat lock**.

The seat appears unavailable to other passengers even though it is not actually being used.

### Failure Flow

```text
Seat → LOCKED
       ↓
No Pending Booking
       ↓
No Confirmed Booking
       ↓
Seat Remains Unavailable
```

### Self-Healing Action

The recovery service searches for seats that are locked without a corresponding pending or confirmed booking.

When an orphaned seat lock is detected, the system automatically releases the seat.

```text
Orphaned Seat Detected
        ↓
Recovery Service
        ↓
Seat → AVAILABLE
        ↓
Seat Can Be Booked Again
```

### Result

The seat becomes available again without requiring an administrator to manually change its status.

**Status: Implemented**

---

## Failure 2 — Automatic Ticket Generation Recovery

### Problem

A booking can be successfully confirmed while the ticket generation process fails.

This can result in a confirmed booking without a generated ticket for the passenger.

### Failure Flow

```text
Booking Created
      ↓
Booking Confirmed
      ↓
Ticket Generation Fails
      ↓
Ticket Status → FAILED
```

### Self-Healing Action

The recovery mechanism identifies confirmed bookings where ticket generation has failed and attempts to recover the ticket generation process.

```text
Failed Ticket Detected
        ↓
Recovery Service
        ↓
Ticket Generation Retried
        ↓
Ticket Generated
        ↓
Booking Completed
```

### Result

The system attempts to restore the missing ticket without requiring the passenger or administrator to manually regenerate it.

**Status: Implemented / In Development**

---

## Failure 3 — Train Search Service Failure

### Problem

The train-search service can become unavailable.

When this happens, passengers may be unable to search for trains between their selected stations.

### Failure Flow

```text
Passenger Searches for Train
          ↓
Train Search Service Fails
          ↓
Search Becomes Unavailable
```

### Self-Healing Action

The health monitoring mechanism detects that the train-search service is unavailable.

The recovery mechanism then performs the required recovery action to restore train-search availability.

```text
Service Failure Detected
          ↓
Health Check
          ↓
Incident Created
          ↓
Recovery Action
          ↓
Train Search Restored
          ↓
Passenger Can Search Again
```

### Result

The goal is to restore train-search functionality automatically without requiring manual service intervention.

**Status: Implemented / In Development**

---

## Failure 4 — Booking Service Failure

### Problem

The booking service can become unavailable while passengers are trying to book a ticket.

This prevents users from completing the final stage of the ticket booking process.

### Failure Flow

```text
Passenger Selects Train
          ↓
Passenger Selects Seat
          ↓
Booking Request
          ↓
Booking Service Fails
          ↓
Booking Becomes Unavailable
```

### Self-Healing Action

The system detects the booking service failure and performs an automatic recovery action to restore booking functionality.

```text
Booking Service Failure
          ↓
Failure Detected
          ↓
Incident Created
          ↓
Recovery Action
          ↓
Booking Service Restored
          ↓
Booking Available Again
```

### Result

The booking functionality can be restored without requiring a developer or administrator to manually restart or repair the application.

**Status: Implemented / In Development**

---

# Failure Overview

| Failure                             | Problem                                                    | Self-Healing Action                             |
| ----------------------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| **1. Stale Seat Lock**              | Seat remains locked without a pending or confirmed booking | Automatically release the seat                  |
| **2. Ticket Generation Failure**    | Booking is confirmed but ticket generation fails           | Automatically retry/recover ticket generation   |
| **3. Train Search Service Failure** | Train-search functionality becomes unavailable             | Automatically restore train-search availability |
| **4. Booking Service Failure**      | Booking functionality becomes unavailable                  | Automatically restore booking functionality     |

---

# Self-Healing Architecture

With Docker, the application is divided into three main containers.

```text
                         ┌──────────────────────┐
                         │      React UI        │
                         │   Frontend Container │
                         │      Port 5173       │
                         └──────────┬───────────┘
                                    │
                                    │ REST API
                                    ▼
                         ┌──────────────────────┐
                         │   Node.js + Express  │
                         │   Backend Container  │
                         │      Port 5000       │
                         └──────────┬───────────┘
                                    │
                                    │ PostgreSQL
                                    ▼
                         ┌──────────────────────┐
                         │      PostgreSQL      │
                         │    Database Container│
                         │      Port 5432       │
                         └──────────────────────┘
```

Docker Compose manages all three containers.

```text
Docker Compose
      │
      ├── Frontend
      │     └── React + Vite
      │
      ├── Backend
      │     └── Node.js + Express
      │
      └── PostgreSQL
            └── resilient_ticket database
```

---

# Dockerized Architecture

The application can be accessed through the following ports:

| Component | Technology        |   Port |
| --------- | ----------------- | -----: |
| Frontend  | React + Vite      | `5173` |
| Backend   | Node.js + Express | `5000` |
| Database  | PostgreSQL 17     | `5432` |

The browser communicates with the frontend, the frontend communicates with the backend REST APIs, and the backend communicates with PostgreSQL.

```text
Browser
   │
   ▼
localhost:5173
   │
   ▼
Frontend Container
   │
   │ REST API
   ▼
localhost:5000
   │
   ▼
Backend Container
   │
   │ PostgreSQL
   ▼
postgres:5432
   │
   ▼
PostgreSQL Container
```

Inside the Docker network, the backend connects to PostgreSQL using the Compose service name:

```text
DB_HOST=postgres
```

rather than `localhost`.

---

# Self-Healing Workflow

The overall recovery process follows:

```text
                 ┌──────────────────┐
                 │ Failure Injected │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Failure Detected │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │     Diagnose     │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Recovery Action  │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Verify Recovery  │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │     Recovered    │
                 └──────────────────┘
```

The system is designed to perform these recovery steps automatically for supported failures.

---

# Chaos Testing

ResilientTicket uses controlled failure injection to demonstrate the self-healing mechanisms.

Each supported failure can be intentionally triggered so that the recovery process can be observed and measured.

The purpose of chaos testing is to demonstrate:

1. A failure can be intentionally introduced.
2. The system can detect the failure.
3. The affected component can be identified.
4. An appropriate recovery action can be performed.
5. The system can return to a healthy state.

This makes it possible to demonstrate self-healing behavior reliably rather than waiting for unpredictable failures.

---

# Docker Setup

## Prerequisites

To run the Dockerized version of ResilientTicket, install:

- Docker Desktop
- Git

Docker Desktop provides:

- Docker Engine
- Docker Compose
- Linux container support

The project has been configured to run using Docker Compose.

---

# Run ResilientTicket with Docker

## 1. Clone the Repository

```bash
git clone https://github.com/lakshita-negi/ResilientTicket.git
cd ResilientTicket
```

---

## 2. Configure PostgreSQL Credentials

The Docker Compose configuration requires PostgreSQL credentials.

The same PostgreSQL password must be supplied to both the PostgreSQL and backend services.

Do not commit real passwords or secrets to GitHub.

For a local demonstration environment, configure the credentials in your Docker Compose/environment configuration.

---

## 3. Build and Start the Application

From the project root:

```bash
docker compose up -d --build
```

This builds and starts:

```text
resilientticket-frontend
resilientticket-backend
resilientticket-postgres
```

---

## 4. Verify Running Containers

Run:

```bash
docker ps
```

All three containers should show a running status.

Expected services:

```text
resilientticket-frontend
resilientticket-backend
resilientticket-postgres
```

---

## 5. Open the Application

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

Backend health/test endpoint:

```text
http://localhost:5000/api/test-db
```

---

# Docker Commands

### Start the complete application

```bash
docker compose up -d
```

### Build and start after code changes

```bash
docker compose up -d --build
```

### Stop the containers

```bash
docker compose down
```

### View running containers

```bash
docker ps
```

### View backend logs

```bash
docker logs resilientticket-backend
```

### View frontend logs

```bash
docker logs resilientticket-frontend
```

### View PostgreSQL logs

```bash
docker logs resilientticket-postgres
```

### Follow backend logs

```bash
docker logs -f resilientticket-backend
```

---

# Database

ResilientTicket uses **PostgreSQL 17** as its database.

The system contains data entities including:

- Users
- Stations
- Trains
- Train Stops
- Seats
- Passengers
- Bookings
- Payments
- Health Logs
- Incidents

The database schema and seed data are located in:

```text
backend/database/
```

Important database files include:

```text
schema.sql
seed.js
```

---

# Database Persistence

The PostgreSQL container uses a Docker named volume:

```text
postgres_data
```

This volume allows PostgreSQL data to persist even when the PostgreSQL container is stopped or recreated.

The database service is configured in:

```text
docker-compose.yml
```

using:

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

---

# Database Backup and Restore

A PostgreSQL backup of the ResilientTicket database is maintained in:

```text
backend/database/resilient_ticket_backup.dump
```

The backup can be used to restore the existing application database into a PostgreSQL container.

For example:

```bash
docker exec -i resilientticket-postgres pg_restore \
  -U postgres \
  -d resilient_ticket \
  --clean \
  --if-exists \
  < backend/database/resilient_ticket_backup.dump
```

The backup contains the existing application data and allows the Dockerized environment to be restored without rebuilding the database from scratch.

---

# Database Verification

To verify that PostgreSQL is accepting connections:

```bash
docker exec resilientticket-postgres \
  pg_isready -U postgres -d resilient_ticket
```

Expected result:

```text
accepting connections
```

To view the database tables:

```bash
docker exec -it resilientticket-postgres \
  psql -U postgres -d resilient_ticket -c "\dt"
```

---

# Local Development Without Docker

The project can also be run without Docker for development.

## Backend

From the backend directory:

```bash
cd backend
npm install
node server.js
```

The backend runs on:

```text
http://localhost:5000
```

## Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will display its local URL in the terminal.

## PostgreSQL

For non-Docker development, PostgreSQL must be installed and running locally.

Create a `.env` file inside `backend`:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

Do not commit `.env` to GitHub.

---

# Technology Stack

## Frontend

- React
- Vite
- JavaScript
- CSS

## Backend

- Node.js
- Express.js
- REST APIs

## Database

- PostgreSQL 17

## Containerization

- Docker
- Docker Compose

## Development Tools

- Git
- GitHub
- Visual Studio Code

---

# Project Structure

```text
ResilientTicket/
│
├── backend/
│   │
│   ├── database/
│   │   ├── schema.sql
│   │   ├── seed.js
│   │   └── resilient_ticket_backup.dump
│   │
│   ├── src/
│   │   ├── config/
│   │   │
│   │   ├── controllers/
│   │   │   ├── adminDashboardController.js
│   │   │   ├── authController.js
│   │   │   ├── bookingController.js
│   │   │   ├── healthController.js
│   │   │   ├── recoveryController.js
│   │   │   ├── stationController.js
│   │   │   └── trainController.js
│   │   │
│   │   ├── routes/
│   │   │
│   │   └── services/
│   │       ├── bookingService.js
│   │       ├── recoveryService.js
│   │       ├── ticketService.js
│   │       └── trainSearchService.js
│   │
│   ├── tickets/
│   │
│   ├── .dockerignore
│   ├── .env
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
│
├── frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── SearchPanel.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── BookTickets.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   └── MyTickets.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── Dockerfile
│   └── package.json
│
├── .gitignore
├── docker-compose.yml
├── package.json
└── package-lock.json
```

---

# Environment Configuration

When running locally, the backend can use a `.env` file.

When running through Docker Compose, environment variables are provided to the containers through `docker-compose.yml`.

The Dockerized backend uses:

```text
DB_HOST=postgres
DB_PORT=5432
DB_NAME=resilient_ticket
DB_USER=postgres
```

The important difference is that the backend connects to PostgreSQL using the Docker Compose service name:

```text
postgres
```

rather than:

```text
localhost
```

This allows the containers to communicate over the Docker network.

---

# API

The backend exposes REST APIs for different application features.

Major API areas include:

```text
/api/trains
/api/bookings
/api/stations
/api/health
/api/recovery
```

These APIs allow the frontend to communicate with the backend and allow the health and recovery mechanisms to monitor and recover supported application failures.

---

# License

This project is currently intended for **educational and demonstration purposes**.
