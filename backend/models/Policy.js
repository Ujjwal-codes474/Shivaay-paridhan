const mongoose = require("mongoose");

const policySchema = new mongoose.Schema({
  shippingPolicy: { type: String, default: 'Standard shipping takes 3-5 business days.' },
  returnPolicy: { type: String, default: 'Easy 7-day returns on all products.' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Policy", policySchema);
