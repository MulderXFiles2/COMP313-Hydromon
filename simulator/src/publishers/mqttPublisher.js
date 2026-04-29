/**
 * mqttPublisher.js
 *
 * MQTT publishing utility for the simulator.
 * Handles connecting to Mosquitto and exposing simple publish functions.
 *
 * Keeps MQTT connection details isolated from simulation logic so the
 * simulator can focus on generating data, not transport concerns.
 */
const mqtt = require("mqtt");

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const username = process.env.MQTT_USERNAME;
const password = process.env.MQTT_PASSWORD;

const client = mqtt.connect(brokerUrl, {
  clientId: "simulator-" + Math.random().toString(16).slice(2),
  username,
  password,
});

client.on("connect", () => {
  console.log("Simulator connected to MQTT broker");
});

client.on("error", (err) => {
  console.error("MQTT error", err.message);
});

function publish(topic, payload) {
  const message = JSON.stringify(payload);

  client.publish(topic, message, { qos: 1 }, (err) => {
    if (err) {
      console.error("Publish failed:", err.message);
    } else {
      console.log(`Published → ${topic}`);
    }
  });
}

module.exports = {
  publish,
};