/**
 * AlertEmailDelivery.js (ingestor)
 *
 * Must stay in sync with server/src/models/AlertEmailDelivery.js.
 */

const mongoose = require('mongoose');

if (mongoose.models.AlertEmailDelivery) {
  module.exports = mongoose.models.AlertEmailDelivery;
} else {
  const alertEmailDeliverySchema = new mongoose.Schema(
    {
      alertId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alert',
        required: true,
        index: true,
      },
      ruleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AlertRule',
        default: null,
        index: true,
      },
      deviceId: {
        type: String,
        required: true,
        index: true,
      },
      recipientEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      subject: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ['sent', 'failed', 'skipped'],
        required: true,
        index: true,
      },
      transport: {
        type: String,
        default: 'smtp',
      },
      messageId: {
        type: String,
        default: '',
      },
      errorMessage: {
        type: String,
        default: '',
      },
      deliveredAt: {
        type: Date,
        default: null,
      },
    },
    { timestamps: true }
  );

  alertEmailDeliverySchema.index({ recipientEmail: 1, createdAt: -1 });

  module.exports = mongoose.model('AlertEmailDelivery', alertEmailDeliverySchema);
}
