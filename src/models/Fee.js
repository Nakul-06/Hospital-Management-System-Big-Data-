const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, trim: true },
    patientName: { type: String, required: true, trim: true },
    doctorName: { type: String, required: true, trim: true },
    consultationFee: { type: Number, required: true, min: 0 },
    medicineFee: { type: Number, required: true, min: 0, default: 0 },
    roomFee: { type: Number, required: true, min: 0, default: 0 },
    totalFee: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["Pending", "Paid", "Partial"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fee", feeSchema);
