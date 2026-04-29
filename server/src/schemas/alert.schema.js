/**
 * alerts.schema.js
 *
 * Validation schemas for alert-related requests.
 * Ensures alert queries and rule definitions
 * conform to expected formats.
 */

import Joi from "joi";

const emailEnabled = Joi.boolean().default(true);

const emailRecipients = Joi.array()
	.items(Joi.string().trim().email().messages({
		"string.email": "Email recipient must be valid",
	}))
	.default([]);

const sharedAlertFields = {
	deviceId: Joi.string().trim().min(1).required().messages({
		"string.empty": "Device ID is required",
		"any.required": "Device ID is required",
	}),
	severity: Joi.string().valid("info", "warning", "critical").default("warning"),
	message: Joi.string().trim().allow("").default(""),
	description: Joi.string().trim().allow("").default(""),
	active: Joi.boolean().default(true),
	emailEnabled,
	emailRecipients,
};

const thresholdAlertSchema = Joi.object({
	...sharedAlertFields,
	ruleType: Joi.string().valid("threshold").required(),
	sensorType: Joi.string().trim().required().messages({
		"string.empty": "Sensor type is required",
		"any.required": "Sensor type is required",
	}),
	operator: Joi.string().valid("gt", "lt", "gte", "lte", "eq").required(),
	threshold: Joi.number().required().messages({
		"number.base": "Threshold must be a number",
		"any.required": "Threshold is required",
	}),
}).custom((value, helpers) => {
	if (value.emailEnabled && (!value.emailRecipients || value.emailRecipients.length === 0)) {
		return helpers.message("At least one email recipient is required when email delivery is enabled");
	}

	return value;
});

const scheduledAlertSchema = Joi.object({
	...sharedAlertFields,
	ruleType: Joi.string().valid("scheduled").required(),
	scheduleType: Joi.string().valid("daily", "weekly", "once").required(),
	time: Joi.string().allow(null, "").pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).messages({
		"string.pattern.base": "Time must be in HH:mm format",
	}),
	dayOfWeek: Joi.number().integer().min(0).max(6).allow(null),
	date: Joi.date().iso().allow(null),
}).custom((value, helpers) => {
	if ((value.scheduleType === "daily" || value.scheduleType === "weekly") && !value.time) {
		return helpers.message("Time is required for daily and weekly alerts");
	}

	if (value.scheduleType === "weekly" && (value.dayOfWeek === null || value.dayOfWeek === undefined)) {
		return helpers.message("Day of week is required for weekly alerts");
	}

	if (value.scheduleType === "once" && !value.date) {
		return helpers.message("Date is required for one-time alerts");
	}

	if (value.emailEnabled && (!value.emailRecipients || value.emailRecipients.length === 0)) {
		return helpers.message("At least one email recipient is required when email delivery is enabled");
	}

	return value;
});

export const createAlertSchema = Joi.alternatives().try(
	thresholdAlertSchema,
	scheduledAlertSchema
);

export const updateAlertSchema = Joi.alternatives().try(
	thresholdAlertSchema,
	scheduledAlertSchema
);

