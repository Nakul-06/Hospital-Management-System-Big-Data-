const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Patient = require("./src/models/Patient");
const User = require("./src/models/User");
const Doctor = require("./src/models/Doctor");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-env";

if (!MONGO_URI) {
  console.error("Missing MONGO_URI in .env");
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

function validatePassword(password) {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

app.post("/api/auth/signup", async (req, res) => {
  const { fullName, email, role, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "Full name, email and password are required" });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({
      message:
        "Password must be 8+ chars with uppercase, lowercase, number and special character",
    });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(409).json({ message: "User already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    role: role || "Staff",
    passwordHash,
  });

  return res.status(201).json({
    message: "Signup successful",
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
  });
});

app.post("/api/auth/login", async (req,res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  return res.json({
    token,
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
  });
});

app.get("/api/auth/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json(user);
});

app.get("/api/patients", auth, async (_req, res) => {
  const patients = await Patient.find().sort({ createdAt: -1 });
  res.json(patients);
});

app.get("/api/doctors", auth, async (_req, res) => {
  const doctors = await Doctor.find().sort({ createdAt: -1 });
  res.json(doctors);
});

app.post("/api/doctors", auth, async (req, res) => {
  const doctor = await Doctor.create(req.body);
  res.status(201).json(doctor);
});

app.put("/api/doctors/:id", auth, async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }
  return res.json(doctor);
});

app.delete("/api/doctors/:id", auth, async (req, res) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }
  return res.json({ message: "Doctor deleted" });
});

app.post("/api/patients", auth, async (req, res) => {
  const patient = await Patient.create(req.body);
  res.status(201).json(patient);
});

app.put("/api/patients/:id", auth, async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  return res.json(patient);
});

app.delete("/api/patients/:id", auth, async (req, res) => {
  const patient = await Patient.findByIdAndDelete(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  return res.json({ message: "Patient deleted" });
});

app.patch("/api/patients/:id/address", auth, async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(
    req.params.id,
    { address: req.body },
    { new: true, runValidators: true }
  );
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  return res.json(patient);
});

app.patch("/api/patients/:id/doctor", auth, async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(
    req.params.id,
    { doctor: req.body },
    { new: true, runValidators: true }
  );
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  return res.json(patient);
});

app.patch("/api/patients/:id/bill", auth, async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(
    req.params.id,
    { bill: req.body },
    { new: true, runValidators: true }
  );
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  return res.json(patient);
});

app.post("/api/patients/:id/diseases", auth, async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ message: "Disease name is required" });
  }
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  patient.diseases.push(req.body.name.trim());
  await patient.save();
  return res.json(patient);
});

app.put("/api/patients/:id/diseases/:index", auth, async (req, res) => {
  const index = Number(req.params.index);
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  if (Number.isNaN(index) || index < 0 || index >= patient.diseases.length) {
    return res.status(400).json({ message: "Invalid disease index" });
  }
  patient.diseases[index] = req.body.name || patient.diseases[index];
  await patient.save();
  return res.json(patient);
});

app.delete("/api/patients/:id/diseases/:index", auth, async (req, res) => {
  const index = Number(req.params.index);
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  if (Number.isNaN(index) || index < 0 || index >= patient.diseases.length) {
    return res.status(400).json({ message: "Invalid disease index" });
  }
  patient.diseases.splice(index, 1);
  await patient.save();
  return res.json(patient);
});

app.post("/api/patients/:id/treatments", auth, async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  patient.treatments.push(req.body);
  await patient.save();
  return res.json(patient);
});

app.put("/api/patients/:id/treatments/:itemId", auth, async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  const item = patient.treatments.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({ message: "Treatment not found" });
  }
  item.set(req.body);
  await patient.save();
  return res.json(patient);
});

app.delete("/api/patients/:id/treatments/:itemId", auth, async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  const item = patient.treatments.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({ message: "Treatment not found" });
  }
  item.deleteOne();
  await patient.save();
  return res.json(patient);
});

app.post("/api/patients/:id/medicines", auth, async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  patient.medicines.push(req.body);
  await patient.save();
  return res.json(patient);
});

app.put("/api/patients/:id/medicines/:itemId", auth, async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  const item = patient.medicines.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({ message: "Medicine not found" });
  }
  item.set(req.body);
  await patient.save();
  return res.json(patient);
});

app.delete("/api/patients/:id/medicines/:itemId", auth, async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }
  const item = patient.medicines.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({ message: "Medicine not found" });
  }
  item.deleteOne();
  await patient.save();
  return res.json(patient);
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
