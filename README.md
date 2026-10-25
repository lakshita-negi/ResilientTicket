# ResilientTicket

## Self-Healing Railway Ticket Booking System

ResilientTicket is a full-stack railway ticket booking system designed with **self-healing capabilities**.

The system provides normal railway ticket booking functionality while also monitoring application health, detecting failures, recording incidents, and automatically performing recovery actions.

The main objective of ResilientTicket is to demonstrate how a software system can **detect failures, diagnose the affected component, recover automatically, and continue providing its services without requiring manual intervention**.

---

## Project Overview

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

# Failure 2 — Automatic Ticket Generation Recovery

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

# Failure 3 — Train Search Service Failure

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

# Failure 4 — Booking Service Failure

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

```text
                         ┌──────────────────────┐
                         │      React UI        │
                         │      Frontend        │
                         └──────────┬───────────┘
                                    │
                                    │ REST API
                                    ▼
                         ┌──────────────────────┐
                         │   Node.js + Express  │
                         │       Backend        │
                         └──────────┬───────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
      │   Booking   │       │    Train    │       │   Health    │
      │   Service   │       │   Search    │       │  Monitoring │
      └──────┬──────┘       └──────┬──────┘       └──────┬──────┘
             │                     │                       │
             └─────────────────────┼───────────────────────┘
                                   │
                                   ▼
                         ┌──────────────────────┐
                         │   Recovery Service   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      PostgreSQL      │
                         │       Database       │
                         └──────────────────────┘
```

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

# Database

ResilientTicket uses **PostgreSQL** as its database.

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

- PostgreSQL

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
│   │   └── seed.js
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
│   └── package.json
│
├── .gitignore
├── package.json
└── package-lock.json
```

---

# Getting Started

## Prerequisites

Make sure the following are installed:

- Node.js
- PostgreSQL
- Git
- npm

---

## 1. Clone the Repository

```bash
git clone https://github.com/lakshita-negi/ResilientTicket.git
cd ResilientTicket
```

---

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

Do **not** commit `.env` to GitHub.

The repository's `.gitignore` is configured to keep environment variables and other sensitive local files out of the repository.

---

## 4. Set Up PostgreSQL

Create a PostgreSQL database.

Then execute the database schema located at:

```text
backend/database/schema.sql
```

After creating the database, run the seed script:

```bash
node database/seed.js
```

The seed script populates the database with initial application data such as stations, trains, seats, and users.

---

## 5. Start the Backend

From the `backend` directory:

```bash
node server.js
```

The backend runs on:

```text
http://localhost:5000
```

---

## 6. Install Frontend Dependencies

Open another terminal and run:

```bash
cd frontend
npm install
```

---

## 7. Start the Frontend

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

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

# Project Goals

The primary goals of ResilientTicket are:

1. Build a functional railway ticket booking application.
2. Detect application failures automatically.
3. Diagnose the affected service or resource.
4. Automatically perform recovery actions.
5. Record incidents and recovery events.
6. Monitor system health.
7. Provide controlled chaos testing.
8. Measure Time-to-Detect.
9. Measure Time-to-Recover.
10. Demonstrate recovery without human intervention.
11. Compare application behavior with and without self-healing.

---

# License

This project is currently intended for **educational and demonstration purposes**.
