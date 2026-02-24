const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    doctorId: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    feePerVisit: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
