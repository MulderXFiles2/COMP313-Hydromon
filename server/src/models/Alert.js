import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },

    sensorType: {
      type: String,
      default: null,
    },

    value: {
      type: Number,
      default: null,
    },

    ruleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AlertRule",
    },

    category: {
      type: String,
      enum: ["threshold", "scheduled"],
      default: "threshold",
    },

    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "warning",
    },

    message: {
      type: String,
      required: true,
    },

    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

alertSchema.index({ deviceId: 1, createdAt: -1 });
alertSchema.index({ ruleId: 1 });

export default mongoose.model("Alert", alertSchema);