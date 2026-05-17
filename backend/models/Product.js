const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  images: [{ type: String }],
  category: { type: String, default: 'saree' },
  material: { type: String, default: '' },
  type: { type: String, default: 'silk' },
  discount: { type: Number, default: 0 },
  description: { type: String, default: '' },
  colors: [{ type: String }],
  stock: { type: Number, default: 1 },
  quantity: { type: Number, default: 1 },
  specifications: { type: String, default: '' },
  productCare: { type: String, default: '' },
  moreInfo: { type: String, default: '' },
  // Offer / Countdown Timer Fields
  offerLabel: { type: String, default: '' },
  offerStartDate: { type: Date, default: null },
  offerEndDate: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
