require("dotenv").config();

const scenario = require("./scenarios/tent-1.json");

const generatePh = require("./generators/ph");
const generateEc = require("./generators/ec");
const generateTemp = require("./generators/temp");
const generateHumidity = require("./generators/humidity");

const { publish } = require("./publishers/mqttPublisher");
const { applySensorFaults, shouldDropTelemetry } = require("./utils/faultInjection");

let state = { ...scenario.sensors };

const topicPrefix = process.env.MQTT_TOPIC_PREFIX || "hydro";

const faultConfig = {
  dropTelemetry: false,
  stuckSensors: {},
  spikeSensors: {
    ph: { chance: 0.02, amount: 0.5 },
    ec: { chance: 0.02, amount: 0.4 }
  }
};

function generateTelemetry() {
  const nextPh = generatePh(state.ph);
  const nextEc = generateEc(state.ec);
  const nextWaterTemp = generateTemp(state.waterTempC);
  const nextHumidity = generateHumidity(state.humidityPct);

  state.ph = applySensorFaults("ph", state.ph, nextPh, faultConfig);
  state.ec = applySensorFaults("ec", state.ec, nextEc, faultConfig);
  state.waterTempC = applySensorFaults(
    "waterTempC",
    state.waterTempC,
    nextWaterTemp,
    faultConfig
  );
  state.humidityPct = applySensorFaults(
    "humidityPct",
    state.humidityPct,
    nextHumidity,
    faultConfig
  );

  return {
    timestamp: new Date().toISOString(),
    readings: {
      ph: state.ph,
      ec: state.ec,
      waterTempC: state.waterTempC,
      humidityPct: state.humidityPct,
    },
  };
}

function startSimulator() {
  const deviceId = scenario.deviceId;
  const interval = scenario.publishIntervalMs;

  console.log(`Starting simulator for ${deviceId}`);

  setInterval(() => {

    // Fault injection: drop entire telemetry message
    if (shouldDropTelemetry(faultConfig)) {
      console.log("Telemetry intentionally dropped (fault simulation)");
      return;
    }

    const payload = generateTelemetry();
    const topic = `${topicPrefix}/${deviceId}/telemetry`;

    publish(topic, payload);

  }, interval);
}

startSimulator();