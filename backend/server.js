const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
require('dotenv').config();
const Product = require("./models/Product");
const Review = require("./models/Review");
const Policy = require("./models/Policy");
const User = require("./models/User");
const Order = require("./models/Order");
const Coupon = require("./models/Coupon");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const emailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});
emailTransporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const JWT_SECRET = process.env.JWT_SECRET || "";
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}

// Ensure uploads folder exists locally
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const requiredEnvVars = ["MONGO_URI"];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length) {
  console.error("Missing required environment variables:", missingEnvVars.join(", "));
  console.error("Create a backend/.env file or set the variables in your deployment environment.");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.warn("JWT_SECRET is not defined. Generate a strong secret for production token handling.");
}

if ((TWILIO_ACCOUNT_SID && !TWILIO_AUTH_TOKEN) || (!TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN)) {
  console.warn("Incomplete Twilio credentials. Both TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required for WhatsApp/order SMS features.");
}

const app = express();

// Middleware — CORS: allow requests from any origin in production and echo the origin for credentialed requests
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
// Serve frontend files from parent directory
app.use(express.static(path.join(__dirname, "..")));
// Serve uploaded images statically at /uploads URL path
app.use("/uploads", express.static(uploadsDir));

// ============ LOCAL MULTER DISK STORAGE ============
const localDiskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, png, gif, webp) are allowed"), false);
  }
};

// Upload middleware for product images (up to 5 files, 10MB each)
const upload = multer({
  storage: localDiskStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Upload middleware for review images (single file)
const reviewUpload = multer({
  storage: localDiskStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper: delete a local image file
function deleteLocalImage(imagePath) {
  if (!imagePath || !imagePath.startsWith('/uploads/')) return;
  const filename = imagePath.replace('/uploads/', '');
  const filePath = path.join(uploadsDir, filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.warn("Local image delete warning (non-fatal):", err.message);
    }
  });
}

// ============ HEALTH CHECK ============
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Shivaay Paridhan backend running 🚀" });
});

// ============ DASHBOARD STATS API ============
app.get(
  "/api/dashboard-stats",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
  try {
    const [productCount, orderCount, userCount, orders] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Order.find({}, 'total status').lean()
    ]);

    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      products: productCount,
      orders: orderCount,
      users: userCount,
      revenue: totalRevenue,
      recentOrders
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
});

// ============ USER MANAGEMENT API ============

app.get(
  "/api/users",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
  try {
    // Exclude password field for security — never expose hashes
    const users = await User.find({}, '-password -resetOtp -otpExpiry').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Update user profile
app.put(
  "/api/users/:id",
  authenticateToken,
  async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const userId = req.params.id;
    if (req.user.role !== "admin" && req.user.id !== userId) {
  return res.status(403).json({
    message: "You can only update your own profile"
  });
}

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) return res.status(409).json({ message: "Email already in use" });
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();
    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
});

// ============ POLICY APIS ============


app.get("/api/policies", async (req, res) => {
  try {
    let policy = await Policy.findOne();
    if (!policy) {
      policy = new Policy();
      await policy.save();
    }
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: "Error fetching policies" });
  }
});

app.post(
  "/api/policies",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
  try {
    const { shippingPolicy, returnPolicy } = req.body;
    let policy = await Policy.findOne();
    if (policy) {
      policy.shippingPolicy = shippingPolicy;
      policy.returnPolicy = returnPolicy;
      policy.updatedAt = Date.now();
    } else {
      policy = new Policy({ shippingPolicy, returnPolicy });
    }
    await policy.save();
    res.json({ message: "Policies updated", policy });
  } catch (error) {
    res.status(500).json({ message: "Error updating policies" });
  }
});

// ============ PRODUCT APIS ============

app.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product" });
  }
});

// Add product (up to 5 images)
app.post(
  "/api/products",
  authenticateToken,
  requireAdmin,
  upload.array("images", 5),
  async (req, res) => {
  try {
    const {
      name, price, originalPrice, category,
      type, material, discount, description, colors,
      stock, quantity, specifications, productCare, moreInfo,
      offerLabel, offerDiscount, offerStartDate, offerEndDate
    } = req.body;

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : req.body.images.split(',').map(s => s.trim());
    }

    const stockVal = parseInt(stock || quantity || 1);

    const newProduct = new Product({
      name,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice || price),
      images,
      category,
      material,
      type,
      discount: parseInt(discount || 0),
      description,
      colors: typeof colors === 'string' ? colors.split(',').map(c => c.trim()).filter(Boolean) : (colors || []),
      stock: stockVal,
      quantity: stockVal,
      specifications,
      productCare,
      moreInfo: moreInfo || '',
      offerLabel: offerLabel || '',
      offerDiscount: parseFloat(offerDiscount) || 0,
      offerStartDate: offerStartDate ? new Date(offerStartDate) : null,
      offerEndDate: offerEndDate ? new Date(offerEndDate) : null
    });

    await newProduct.save();
    res.status(201).json({ message: "Product added", product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Error adding product", error: error.message });
  }
});

// Edit product — new images replace old ones; old local images are deleted
app.put(
  "/api/products/:id",
  authenticateToken,
  requireAdmin,
  upload.array("images", 5),
  async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const {
      name, price, originalPrice, category,
      type, material, discount, description, colors,
      stock, quantity, specifications, productCare, moreInfo,
      offerLabel, offerDiscount, offerStartDate, offerEndDate
    } = req.body;

    // Handle new images if uploaded — delete old local images first
    let images = product.images;
    if (req.files && req.files.length > 0) {
      // Delete old local images
      product.images.forEach(img => deleteLocalImage(img));
      // Save new file paths
      images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const stockVal = parseInt(stock || quantity || product.stock);

    Object.assign(product, {
      name: name || product.name,
      price: price ? parseFloat(price) : product.price,
      originalPrice: originalPrice ? parseFloat(originalPrice) : product.originalPrice,
      images,
      category: category || product.category,
      material: material !== undefined ? material : product.material,
      type: type || product.type,
      discount: discount !== undefined ? parseInt(discount) : product.discount,
      description: description !== undefined ? description : product.description,
      colors: colors ? (typeof colors === 'string' ? colors.split(',').map(c => c.trim()).filter(Boolean) : colors) : product.colors,
      stock: stockVal,
      quantity: stockVal,
      specifications: specifications !== undefined ? specifications : product.specifications,
      productCare: productCare !== undefined ? productCare : product.productCare,
      moreInfo: moreInfo !== undefined ? moreInfo : product.moreInfo,
      offerLabel: offerLabel !== undefined ? offerLabel : product.offerLabel,
      offerStartDate: offerStartDate !== undefined ? (offerStartDate ? new Date(offerStartDate) : null) : product.offerStartDate,
      offerEndDate: offerEndDate !== undefined ? (offerEndDate ? new Date(offerEndDate) : null) : product.offerEndDate
    });

    await product.save();
    res.json({ message: "Product updated", product });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
});

app.delete(
  "/api/products/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product && product.images && product.images.length > 0) {
      // Delete local images
      product.images.forEach(img => deleteLocalImage(img));
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product" });
  }
});

// ============ ORDER APIS ============

app.post("/api/orders", async (req, res) => {
  try {
    const { customer, items, total, paymentMethod, source } = req.body;
   let authenticatedUserId = null;

const authHeader = req.headers.authorization;

if (authHeader && authHeader.startsWith("Bearer ")) {
  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    authenticatedUserId = decoded.id;
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}
    if (!customer || !items || !total) {
      return res.status(400).json({ message: "Missing required order fields" });
    }

    const orderId = 'SP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    const orderSource = source === 'whatsapp' || paymentMethod === 'whatsapp' ? 'whatsapp' : 'website';
    const orderStatus = orderSource === 'whatsapp' ? 'pending_whatsapp' : 'pending';

    const newOrder = new Order({
      orderId,
      userId: authenticatedUserId,
      customer,
      items,
      total: parseFloat(total),
      paymentMethod: paymentMethod || (orderSource === 'whatsapp' ? 'whatsapp' : 'cod'),
      orderSource,
      status: orderStatus
    });

    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Error placing order", error: error.message });
  }
});

app.get(
  "/api/orders",
  authenticateToken,
  async (req, res) => {
    try {
      let orders;

      if (req.user.role === "admin") {
        // Admin can see all orders
        orders = await Order.find().sort({ createdAt: -1 });
      } else {
        // Normal users can see only their own authenticated orders
        orders = await Order.find({
          userId: req.user.id
        }).sort({ createdAt: -1 });
      }

      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({
        message: "Error fetching orders"
      });
    }
  }
);

app.get(
  "/api/orders/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          message: "Order not found"
        });
      }

      // Admin can view any order
      if (req.user.role === "admin") {
        return res.json(order);
      }

      // Normal users can only view their own orders
      if (
        !order.userId ||
        String(order.userId) !== String(req.user.id)
      ) {
        return res.status(403).json({
          message: "You can only view your own orders"
        });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({
        message: "Error fetching order"
      });
    }
  }
);

app.put(
  "/api/orders/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      const validStatuses = [
        "pending",
        "pending_whatsapp",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled"
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status"
        });
      }

      const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
          status,
          updatedAt: Date.now()
        },
        {
          new: true,
          runValidators: true
        }
      );

      if (!order) {
        return res.status(404).json({
          message: "Order not found"
        });
      }

      res.json({
        message: "Order status updated",
        order
      });
    } catch (error) {
      console.error("Error updating order status:", error);

      res.status(500).json({
        message: "Error updating order status",
        error: error.message
      });
    }
  }
);
// ============ REVIEW APIS ============

app.post("/api/reviews", reviewUpload.single("image"), async (req, res) => {
  try {
    const { productId, userName, rating, comment } = req.body;
    // Multer: req.file.filename contains the local filename
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newReview = new Review({
      productId,
      userName,
      rating,
      comment,
      image: imagePath
    });

    await newReview.save();
    res.status(201).json({ message: "Review added", review: newReview });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Error adding review" });
  }
});

app.get("/api/reviews/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB per image.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Too many files. Maximum 5 images allowed.' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// ============ AUTHENTICATION APIS ============

// Simple password validation — minimum 4 characters, no complex rules
function validatePassword(password) {
  const errors = [];

  if (!password) {
    errors.push("Password is required");
    return errors;
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return errors;
}

// POST /register
app.post("/register", registerHandler);

// POST /login
app.post("/login", loginHandler);

// POST /forgot-password
app.post("/forgot-password", async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: "Please enter your email or mobile number" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email/mobile" });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.resetOtp = await bcrypt.hash(otp, 12);
user.otpAttempts = 0;
user.otpVerified = false;
    user.otpExpiry = otpExpiry;
    await user.save();


    res.json({
      message: "OTP sent successfully",
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    });
} catch (error) {
  console.error("Forgot password error:", {
    message: error.message,
    code: error.code,
    command: error.command,
    response: error.response,
    responseCode: error.responseCode
  });

  res.status(500).json({
    message: "Unable to send OTP. Please try again."
  });
}
});

// POST /verify-otp
app.post("/verify-otp", async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({
        message: "Email/mobile and OTP are required"
      });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!user.resetOtp) {
      return res.status(400).json({
        message: "No OTP requested. Please request a new one."
      });
    }

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      user.resetOtp = null;
      user.otpExpiry = null;
      user.otpAttempts = 0;
      user.otpVerified = false;
      await user.save();

      return res.status(400).json({
        message: "OTP has expired. Please request a new one."
      });
    }

    if (user.otpAttempts >= 5) {
      user.resetOtp = null;
      user.otpExpiry = null;
      user.otpAttempts = 0;
      user.otpVerified = false;
      await user.save();

      return res.status(429).json({
        message: "Too many incorrect OTP attempts. Please request a new OTP."
      });
    }

    const otpMatches = await bcrypt.compare(otp, user.resetOtp);

    if (!otpMatches) {
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({
        message: "Invalid OTP. Please try again."
      });
    }

    user.otpVerified = true;
    await user.save();

    return res.json({
      message: "OTP verified successfully",
      verified: true
    });

  } catch (error) {
    console.error("OTP verification error:", error);

    res.status(500).json({
      message: "Server error during OTP verification"
    });
  }
});
// POST /reset-password
app.post("/reset-password", async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ message: "Weak password", errors: passwordErrors });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

if (
  !user.resetOtp ||
  !user.otpVerified ||
  new Date() > user.otpExpiry
) {
  return res.status(400).json({
    message: "OTP is invalid or expired. Please request a new one."
  });
}

const otpMatches = await bcrypt.compare(otp, user.resetOtp);

if (!otpMatches) {
  return res.status(400).json({
    message: "OTP is invalid or expired. Please request a new one."
  });
}

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

user.password = hashedPassword;
user.resetOtp = null;
user.otpExpiry = null;
user.otpAttempts = 0;
user.otpVerified = false;
await user.save();

    console.log(`Password reset successful for: ${user.email}`);
    res.json({ message: "Password reset successful! You can now login with your new password." });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
});

// ============ /api/auth/* ALIASES (future-proof) ============
// These call the same handler functions — works in both Express 4 and 5
async function registerHandler(req, res) {
  console.log(`Register request received for: ${req.body.email}`);
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      console.log("Registration failed: Missing fields");
      return res.status(400).json({ message: "All fields are required" });
    }
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ message: passwordErrors[0], errors: passwordErrors });
    }
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      name, email: email.toLowerCase(), phone, password: hashedPassword,
      role: "user"
    });
    await newUser.save();
    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    res.status(500).json({ message: "Server error during registration. Please try again." });
  }
}

async function loginHandler(req, res) {
  console.log(`Login request received for: ${req.body.email}`);

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      console.log("Login failed: Missing email or password");

      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      console.log(`Login failed: User not found (${email})`);

      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      if (user.password === password) {
        console.warn(
          `Legacy plain-text password detected for ${email}. Migrating to bcrypt hash.`
        );

        user.password = await bcrypt.hash(password, 12);
        await user.save();
      } else {
        console.log(`Login failed: Incorrect password for ${email}`);

        return res.status(401).json({
          message: "Invalid email or password"
        });
      }
    }

    console.log(`Login successful: ${email}`);

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error during login. Please try again."
    });
  }
}

app.post('/api/auth/register', registerHandler);
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        message: "Please enter your email or mobile number"
      });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email/mobile"
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Store only a bcrypt hash of the OTP
    user.resetOtp = await bcrypt.hash(otp, 12);
    user.otpAttempts = 0;
    user.otpVerified = false;
    user.otpExpiry = otpExpiry;

    await user.save();

    // Send OTP by email
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Shivaay Paridhan - Password Reset OTP",
      text: `Your password reset OTP is ${otp}. It will expire in 5 minutes. If you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Shivaay Paridhan</h2>
          <p>Your password reset OTP is:</p>
          <h1>${otp}</h1>
          <p>This OTP will expire in <strong>5 minutes</strong>.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
        </div>
      `
    });

    res.json({
      message: "OTP sent successfully",
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      message: "Unable to send OTP. Please try again."
    });
  }
});
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) return res.status(400).json({ message: "Email/mobile and OTP are required" });
    const user = await User.findOne({ $or: [{ email: identifier.toLowerCase() }, { phone: identifier }] });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.resetOtp) return res.status(400).json({ message: "No OTP requested. Please request a new one." });
    if (new Date() > user.otpExpiry) {
      user.resetOtp = null; user.otpExpiry = null; await user.save();
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }
 if (user.otpAttempts >= 5) {
  user.resetOtp = null;
  user.otpExpiry = null;
  user.otpAttempts = 0;
  user.otpVerified = false;
  await user.save();

  return res.status(429).json({
    message: "Too many incorrect OTP attempts. Please request a new OTP."
  });
}

const otpMatches = await bcrypt.compare(otp, user.resetOtp);

if (!otpMatches) {
  user.otpAttempts += 1;
  await user.save();

  return res.status(400).json({
    message: "Invalid OTP. Please try again."
  });
}

user.otpVerified = true;
await user.save();

res.json({
  message: "OTP verified successfully",
  verified: true
});

} catch (error) {
  console.error("OTP verification error:", error);
  res.status(500).json({
    message: "Server error during OTP verification"
  });
}
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) return res.status(400).json({ message: "All fields are required" });
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) return res.status(400).json({ message: passwordErrors[0], errors: passwordErrors });
    const user = await User.findOne({ $or: [{ email: identifier.toLowerCase() }, { phone: identifier }] });
    if (!user) return res.status(404).json({ message: "User not found" });
  if (
  !user.resetOtp ||
  !user.otpVerified ||
  !user.otpExpiry ||
  new Date() > user.otpExpiry
) {
  return res.status(400).json({
    message: "OTP is invalid or expired. Please request a new one."
  });
}

const otpMatches = await bcrypt.compare(otp, user.resetOtp);

if (!otpMatches) {
  return res.status(400).json({
    message: "OTP is invalid or expired. Please request a new one."
  });
}
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, 12);
user.resetOtp = null;
user.otpExpiry = null;
user.otpAttempts = 0;
user.otpVerified = false;
await user.save();
    res.json({ message: "Password reset successful! You can now login with your new password." });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
});




// ============ COUPON API ============

// Get all coupons (Admin)
app.get("/api/coupons", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Error fetching coupons" });
  }
});

// Create coupon (Admin)
app.post(
  "/api/coupons",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update coupon (Admin)
app.put(
  "/api/coupons/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete coupon (Admin)
app.delete(
  "/api/coupons/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting coupon" });
  }
});

// Validate coupon (Public)
app.post("/api/coupons/validate", async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code is required" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    // Check expiry
    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order amount of ₹${coupon.minOrderAmount} not met` });
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    res.json({
      message: "Coupon applied successfully",
      discountAmount,
      finalAmount: orderAmount - discountAmount,
      couponCode: coupon.code
    });
  } catch (error) {
    res.status(500).json({ message: "Error validating coupon" });
  }
});


// MongoDB connection
console.log("Connecting to MongoDB...");

mongoose.connect(MONGO_URI)
  .then(async () => {
    const db = mongoose.connection;

    console.log("Database connected ✅", db.host, db.name);

    try {
      const userCount = await User.countDocuments();
      console.log(`User count in database: ${userCount}`);
    } catch (countError) {
      console.warn("Could not determine user count:", countError);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
