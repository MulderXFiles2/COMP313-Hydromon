/**
 * AlertRule.js (ingestor)
 *
 * Must stay in sync with server/src/models/AlertRule.js.
 */

const mongoose = require('mongoose');

if (mongoose.models.AlertRule) {
  module.exports = mongoose.models.AlertRule;
} else {
  const alertRuleSchema = new mongoose.Schema(
    {
      deviceId: {
        type: String,
        required: true,
        index: true,
      },

      ruleType: {
        type: String,
        enum: ['threshold', 'scheduled'],
        default: 'threshold',
        required: true,
      },

      sensorType: {
        type: String,
        default: null,
      },

      operator: {
        type: String,
        enum: ['gt', 'lt', 'gte', 'lte', 'eq'],
        default: null,
      },

      threshold: {
        type: Number,
        default: null,
      },

      severity: {
        type: String,
        default: 'warning',
        enum: ['info', 'warning', 'critical'],
      },

      scheduleType: {
        type: String,
        enum: ['daily', 'weekly', 'once'],
        default: null,
      },

      time: {
        type: String,
        default: null,
      },

      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
        default: null,
      },

      date: {
        type: Date,
        default: null,
      },

      message: {
        type: String,
        default: '',
      },

      description: {
        type: String,
        default: '',
      },

      emailEnabled: {
        type: Boolean,
        default: true,
      },

      emailRecipients: {
        type: [String],
        default: [],
      },

      createdByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },

      createdByEmail: {
        type: String,
        default: '',
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

  module.exports = mongoose.model('AlertRule', alertRuleSchema);
}
