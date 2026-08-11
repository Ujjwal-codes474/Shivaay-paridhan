const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  resetOtp: { type: String, default: null },
otpExpiry: { type: Date, default: null },
otpAttempts: { type: Number, default: 0 },
otpVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
