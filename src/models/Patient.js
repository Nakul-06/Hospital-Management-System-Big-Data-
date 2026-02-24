const mongoose = require("mongoose");

const treatmentSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    cost: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    bloodGroup: { type: String, required: true, trim: true },
    isAdmitted: { type: Boolean, default: false },
    admissionDate: { type: Date, required: true },
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: Number, required: true },
    },
    doctor: {
      doctorId: { type: Number, required: true },
      name: { type: String, required: true, trim: true },
      specialization: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    diseases: [{ type: String, trim: true }],
    treatments: [treatmentSchema],
    medicines: [medicineSchema],
    bill: {
      roomCharges: { type: Number, required: true, min: 0, default: 0 },
      treatmentCharges: { type: Number, required: true, min: 0, default: 0 },
      medicineCharges: { type: Number, required: true, min: 0, default: 0 },
      totalAmount: { type: Number, required: true, min: 0, default: 0 },
      isPaid: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
