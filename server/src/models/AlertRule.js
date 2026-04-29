/**
 * AlertRule.js
 *
 * Mongoose model defining alert conditions.
 * Specifies thresholds or rules used to generate alerts
 * from incoming telemetry data.
 */
import mongoose from "mongoose";

const alertRuleSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },

    ruleType: {
      type: String,
      enum: ["threshold", "scheduled"],
      default: "threshold",
      required: true,
    },

    sensorType: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (this.ruleType === "threshold") {
            return value !== null && value !== undefined && value !== "";
          }
          return true;
        },
        message: "sensorType is required for threshold rules",
      },
    },

    operator: {
      type: String,
      enum: ["gt", "lt", "gte", "lte", "eq"],
      default: null,
      validate: {
        validator: function (value) {
          if (this.ruleType === "threshold") {
            return value !== null && value !== undefined && value !== "";
          }
          return true;
        },
        message: "operator is required for threshold rules",
      },
    },

    threshold: {
      type: Number,
      default: null,
      validate: {
        validator: function (value) {
          if (this.ruleType === "threshold") {
            return value !== null && value !== undefined;
          }
          return true;
        },
        message: "threshold is required for threshold rules",
      },
    },

    severity: {
      type: String,
      default: "warning",
      enum: ["info", "warning", "critical"],
    },

    scheduleType: {
      type: String,
      enum: ["daily", "weekly", "once"],
      default: null,
      validate: {
        validator: function (value) {
          if (this.ruleType === "scheduled") {
            return !!value;
          }
          return true;
        },
        message: "scheduleType is required for scheduled rules",
      },
    },

    timeZone: {
      type: String,
      default: "America/New_York",
    },
    
    time: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          if (
            this.ruleType === "scheduled" &&
            (this.scheduleType === "daily" || this.scheduleType === "weekly")
          ) {
            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
          }
          return true;
        },
        message: "time must be in HH:mm format for daily/weekly alerts",
      },
    }, 

    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: null,
      validate: {
        validator: function (value) {
          if (this.ruleType === "scheduled" && this.scheduleType === "weekly") {
            return value !== null && value !== undefined;
          }
          return true;
        },
        message: "dayOfWeek is required for weekly scheduled alerts",
      },
    },

    date: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          if (this.ruleType === "scheduled" && this.scheduleType === "once") {
            return value instanceof Date && !isNaN(value.getTime());
          }
          return true;
        },
        message: "date is required and must be valid for one-time scheduled alerts",
      },
    },

    message: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    emailEnabled: {
      type: Boolean,
      default: true,
    },

    emailRecipients: {
      type: [String],
      default: [],
      validate: {
        validator: function (value) {
          if (!this.emailEnabled) {
            return true;
          }

          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one email recipient is required when email delivery is enabled",
      },
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdByEmail: {
      type: String,
      default: "",
    },

    active: {
      type: Boolean,
      default: true,
    },

    lastTriggeredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

alertRuleSchema.index({ deviceId: 1, ruleType: 1 });
alertRuleSchema.index({ deviceId: 1, sensorType: 1, ruleType: 1 });
alertRuleSchema.index({ emailEnabled: 1, active: 1 });

export default mongoose.model("AlertRule", alertRuleSchema);