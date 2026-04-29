/**
 * alerts.controller.js
 *
 * Request handlers for alert-related endpoints.
 * Supports CRUD for user-managed alerts, including
 * scheduled alerts and threshold alerts.
 */

import * as alertsService from "../services/alerts.service.js";

export async function listAlerts(req, res, next) {
  try {
    const alerts = await alertsService.getAlerts(req.query);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
}

export async function listLiveAlerts(req, res, next) {
  try {
    const alerts = await alertsService.getLiveAlerts(req.query);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
}

export async function getAlertById(req, res, next) {
  try {
    const alert = await alertsService.getAlertById(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json(alert);
  } catch (err) {
    next(err);
  }
}

export async function createAlert(req, res, next) {
  try {
    const alert = await alertsService.createAlert(req.body, req.user);
    res.status(201).json(alert);
  } catch (err) {
    next(err);
  }
}

export async function updateAlert(req, res, next) {
  try {
    const alert = await alertsService.updateAlert(req.params.id, req.body, req.user);

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json(alert);
  } catch (err) {
    next(err);
  }
}

export async function deleteAlert(req, res, next) {
  try {
    const alert = await alertsService.deleteAlert(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}