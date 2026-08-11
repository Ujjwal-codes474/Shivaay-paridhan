const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
  },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    altPhone: { type: String, default: '' },
    address: { type: String, default: '' },
    flat: { type: String, default: '' },
    area: { type: String, default: '' },
    landmark: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    addressType: { type: String, default: 'home' }
  },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    color: String,
    image: String
  }],
  total: { type: Number, required: true },
  paymentMethod: { type: String, default: 'cod' },
  orderSource: { type: String, enum: ['website', 'whatsapp'], default: 'website' },
  status: {
    type: String,
    enum: ['pending', 'pending_whatsapp', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
