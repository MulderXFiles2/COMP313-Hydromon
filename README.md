# COMP-313 Hydroponic Monitoring System

A distributed hydroponic monitoring system that collects sensor telemetry, processes it through an MQTT ingestion pipeline, stores readings in MongoDB Atlas, and displays environmental data through a web dashboard.

This project demonstrates a microservice-style architecture using MQTT messaging, Node.js services, and a React-based client dashboard.

---

## System Architecture

The telemetry pipeline processes data through the following components:

```
Simulator
   ↓
MQTT Broker (Mosquitto)
   ↓
Ingestor
   ↓
MongoDB Atlas
   ↓
Server API
   ↓
Client Dashboard
```

Each component runs independently and communicates via MQTT or HTTP.

---

## System Components

### Simulator
Generates simulated hydroponic sensor telemetry including:

- pH
- Electrical Conductivity (EC)
- Water Temperature
- Humidity

The simulator publishes telemetry messages to the MQTT broker.

---

### MQTT Broker (Mosquitto)
Acts as the messaging layer of the system.  
The simulator publishes telemetry while the ingestor subscribes to those topics.

---

### Ingestor
Subscribes to MQTT topics, validates incoming telemetry payloads, and writes readings to MongoDB Atlas.

---

### Server API
Provides REST endpoints used by the dashboard to retrieve device telemetry and system information.

The server also evaluates scheduled alerts and can deliver alert notifications by email when SMTP is configured.

---

### Client Dashboard
Displays telemetry data through a web interface for monitoring hydroponic system conditions.

---

## Prerequisites

Ensure the following are installed before running the system:

- Node.js
- npm
- Docker (optional, for running Mosquitto)
- Access to the MongoDB Atlas cluster used by the project

---

## Running the System

Start the system components in the following order.

---

### 1. Start the MQTT Broker

The broker must be available at:

```
mqtt://localhost:1883
```

If using Docker:

```bash
docker run -it -p 1883:1883 eclipse-mosquitto
```

---

### 2. Start the Ingestor

From the project root:

```bash
cd ingestor
npm install
npm run dev
```

Expected output:

```
Connected to MongoDB
Connected to MQTT broker
Subscribed to topics
```

---

### 3. Start the Server API

From the project root:

```bash
cd server
npm install
npm run dev
```

The API server should start on:

```
http://localhost:4000
```

---

### 4. Start the Simulator

From the project root:

```bash
cd simulator
npm install
node src/index.js
```

The simulator will begin publishing telemetry messages.

---

### 5. Start the Client Dashboard

From the project root:

```bash
cd client
npm install
npm run dev
```

Open the dashboard in your browser:

```
http://localhost:5173
```

---

## Verifying the System

When all components are running:

1. The **simulator** publishes telemetry.
2. The **ingestor** receives MQTT messages and stores telemetry in MongoDB.
3. The **server API** exposes telemetry endpoints.
4. The **client dashboard** displays sensor readings.

---

## Email Alerts

Alert rules can now send email notifications to one or more recipients. This applies to:

- Scheduled alerts evaluated by the server
- Threshold alerts triggered from live MQTT telemetry in the ingestor

To enable real email delivery, configure these environment variables for the services that evaluate alerts:

- `EMAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`

If SMTP is not configured, the system still records the delivery attempt and marks it as skipped instead of failing alert creation.

---

## Project Structure

```
client/       React dashboard
server/       API service
ingestor/     MQTT ingestion service
simulator/    Telemetry generator
```

---

## Future Improvements

Potential enhancements include:

- Real sensor hardware integration
- Alerting and threshold monitoring
- Historical telemetry visualization
- Multi-device simulation support
- Docker-based deployment
- Automated testing pipeline

---

## Authors

COMP-313 Course Project  
Hydroponic Monitoring System