const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const { Resend } = require("resend");

/* =========================================================
   MODELS
========================================================= */

const Product = require("./models/Product");
const Review = require("./models/Review");
const Policy = require("./models/Policy");
const User = require("./models/User");
const Order = require("./models/Order");
const Coupon = require("./models/Coupon");


/* =========================================================
   EMAIL
========================================================= */

const resend = new Resend(
  process.env.RESEND_API_KEY
);


/* =========================================================
   CONFIG
========================================================= */

const PORT =
  process.env.PORT || 5000;

const MONGO_URI =
  process.env.MONGO_URI;

const JWT_SECRET =
  process.env.JWT_SECRET || "";

const TWILIO_ACCOUNT_SID =
  process.env.TWILIO_ACCOUNT_SID || "";

const TWILIO_AUTH_TOKEN =
  process.env.TWILIO_AUTH_TOKEN || "";


/* =========================================================
   CLOUDINARY
========================================================= */

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env.CLOUDINARY_API_KEY,

  api_secret:
    process.env.CLOUDINARY_API_SECRET,
});


/* =========================================================
   TOKEN
========================================================= */

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}


/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

function authenticateToken(
  req,
  res,
  next
) {
  const authHeader =
    req.headers.authorization;

  const token =
    authHeader &&
    authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

  if (!token) {
    return res.status(401).json({
      message:
        "Authentication required",
    });
  }

  try {
    req.user =
      jwt.verify(
        token,
        JWT_SECRET
      );

    next();
  } catch (error) {
    return res.status(401).json({
      message:
        "Invalid or expired token",
    });
  }
}


function requireAdmin(
  req,
  res,
  next
) {
  if (
    req.user?.role !== "admin"
  ) {
    return res.status(403).json({
      message:
        "Admin access required",
    });
  }

  next();
}


/* =========================================================
   USER ADDRESS HELPER
========================================================= */

function normalizeAddress(
  address
) {
  return {
    line1:
      address?.line1 !== undefined
        ? String(
            address.line1
          ).trim()
        : "",

    line2:
      address?.line2 !== undefined
        ? String(
            address.line2
          ).trim()
        : "",

    city:
      address?.city !== undefined
        ? String(
            address.city
          ).trim()
        : "",

    state:
      address?.state !== undefined
        ? String(
            address.state
          ).trim()
        : "",

    pinCode:
      address?.pinCode !== undefined
        ? String(
            address.pinCode
          ).trim()
        : "",

    country:
      address?.country !== undefined
        ? String(
            address.country
          ).trim()
        : "India",
  };
}


function serializeUser(
  user
) {
  return {
    id:
      user._id,

    name:
      user.name,

    email:
      user.email,

    phone:
      user.phone,

    role:
      user.role,

    address:
      normalizeAddress(
        user.address
      ),

    createdAt:
      user.createdAt,
  };
}


/* =========================================================
   ENV CHECK
========================================================= */

const requiredEnvVars = [
  "MONGO_URI",
];

const missingEnvVars =
  requiredEnvVars.filter(
    (name) =>
      !process.env[name]
  );

if (
  missingEnvVars.length
) {
  console.error(
    "Missing required environment variables:",
    missingEnvVars.join(", ")
  );

  process.exit(1);
}

if (!JWT_SECRET) {
  console.warn(
    "JWT_SECRET is not defined. Generate a strong secret for production."
  );
}

if (
  (TWILIO_ACCOUNT_SID &&
    !TWILIO_AUTH_TOKEN) ||
  (!TWILIO_ACCOUNT_SID &&
    TWILIO_AUTH_TOKEN)
) {
  console.warn(
    "Incomplete Twilio credentials."
  );
}


/* =========================================================
   EXPRESS
========================================================= */

const app =
  express();


/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin: true,
    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);


/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.json({
    limit: "10mb",
  })
);


/* =========================================================
   STATIC FRONTEND
========================================================= */

app.use(
  express.static(
    path.join(
      __dirname,
      ".."
    )
  )
);


/* =========================================================
   UPLOADS
========================================================= */

const uploadsDir =
  path.join(
    __dirname,
    "uploads"
  );

if (
  !fs.existsSync(
    uploadsDir
  )
) {
  fs.mkdirSync(
    uploadsDir,
    {
      recursive: true,
    }
  );
}

app.use(
  "/uploads",
  express.static(
    uploadsDir
  )
);


/* =========================================================
   MULTER
========================================================= */

const memoryStorage =
  multer.memoryStorage();


const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (
    allowedMimes.includes(
      file.mimetype
    )
  ) {
    cb(
      null,
      true
    );
  } else {
    cb(
      new Error(
        "Only JPG, PNG, GIF or WebP images are allowed"
      ),
      false
    );
  }
};


const upload =
  multer({
    storage:
      memoryStorage,

    fileFilter,

    limits: {
      fileSize:
        10 * 1024 * 1024,

      files: 5,
    },
  });


const reviewUpload =
  multer({
    storage:
      memoryStorage,

    fileFilter,

    limits: {
      fileSize:
        10 * 1024 * 1024,

      files: 1,
    },
  });


/* =========================================================
   CLOUDINARY UPLOAD
========================================================= */

function uploadToCloudinary(
  file
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {

      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              "shivaay-paridhan/products",

            resource_type:
              "image",
          },

          (
            error,
            result
          ) => {

            if (error) {
              reject(
                error
              );
            } else {
              resolve(
                result
              );
            }

          }
        );

      uploadStream.end(
        file.buffer
      );

    }
  );
}


/* =========================================================
   DELETE PRODUCT IMAGE
========================================================= */

async function deleteProductImage(
  imageUrl
) {

  if (
    !imageUrl ||
    typeof imageUrl !== "string"
  ) {
    return;
  }

  try {

    if (
      imageUrl.startsWith(
        "/uploads/"
      )
    ) {

      const filename =
        imageUrl.replace(
          "/uploads/",
          ""
        );

      const filePath =
        path.join(
          uploadsDir,
          filename
        );

      await fs.promises
        .unlink(
          filePath
        )
        .catch(
          () => {}
        );

      return;
    }


    if (
      imageUrl.includes(
        "res.cloudinary.com"
      )
    ) {

      const url =
        new URL(
          imageUrl
        );

      const parts =
        url.pathname.split(
          "/"
        );

      const uploadIndex =
        parts.indexOf(
          "upload"
        );

      if (
        uploadIndex === -1
      ) {
        return;
      }

      let publicIdParts =
        parts.slice(
          uploadIndex + 1
        );


      if (
        publicIdParts[0] &&
        /^v\d+$/.test(
          publicIdParts[0]
        )
      ) {
        publicIdParts.shift();
      }


      const lastIndex =
        publicIdParts.length - 1;

      if (
        lastIndex >= 0
      ) {
        publicIdParts[
          lastIndex
        ] =
          publicIdParts[
            lastIndex
          ].replace(
            /\.[^/.]+$/,
            ""
          );
      }


      const publicId =
        publicIdParts.join(
          "/"
        );

      if (!publicId) {
        return;
      }


      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type:
            "image",
        }
      );

      console.log(
        `Cloudinary image deleted: ${publicId}`
      );
    }

  } catch (error) {

    console.warn(
      "Image delete warning:",
      error.message
    );

  }
}


/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      status:
        "ok",

      message:
        "Shivaay Paridhan backend running 🚀",
    });
  }
);


/* =========================================================
   PINCODE LOOKUP
========================================================= */

app.get(
  "/api/pincode/:pincode",
  async (
    req,
    res
  ) => {

    try {

      const pinCode =
        String(
          req.params.pincode || ""
        ).replace(
          /\D/g,
          ""
        );

      if (
        pinCode.length !== 6
      ) {
        return res.status(400).json({
          message:
            "Please provide a valid 6-digit PIN code.",
        });
      }


      const response =
        await fetch(
          `https://api.postalpincode.in/pincode/${pinCode}`,
          {
            method:
              "GET",

            headers: {
              Accept:
                "application/json",
            },
          }
        );


      if (
        !response.ok
      ) {
        return res.status(502).json({
          message:
            "Unable to check PIN code right now.",
        });
      }


      const data =
        await response.json();


      const result =
        Array.isArray(data)
          ? data[0]
          : null;


      if (
        !result ||
        result.Status !== "Success" ||
        !Array.isArray(
          result.PostOffice
        ) ||
        result.PostOffice.length === 0
      ) {
        return res.status(404).json({
          message:
            "PIN code not found.",
        });
      }


      const postOffice =
        result.PostOffice[0];


      res.json({
        valid:
          true,

        city:
          postOffice.District ||
          postOffice.Division ||
          postOffice.Name ||
          "",

        district:
          postOffice.District ||
          "",

        state:
          postOffice.State ||
          "",

        country:
          postOffice.Country ||
          "India",

        pinCode:
          pinCode,
      });

    } catch (error) {

      console.error(
        "PIN lookup error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to lookup PIN code.",
      });

    }

  }
);


/* =========================================================
   DASHBOARD STATS
========================================================= */

app.get(
  "/api/dashboard-stats",
  authenticateToken,
  requireAdmin,
  async (
    req,
    res
  ) => {

    try {

      const [
        productCount,
        orderCount,
        userCount,
        orders,
      ] =
        await Promise.all([
          Product.countDocuments(),

          Order.countDocuments(),

          User.countDocuments(),

          Order.find(
            {},
            "total status"
          ).lean(),
        ]);


      const totalRevenue =
        orders
          .filter(
            (order) =>
              order.status !==
              "cancelled"
          )
          .reduce(
            (
              sum,
              order
            ) =>
              sum +
              Number(
                order.total || 0
              ),

            0
          );


      const recentOrders =
        await Order.find()
          .sort({
            createdAt: -1,
          })
          .limit(5)
          .lean();


      res.json({
        products:
          productCount,

        orders:
          orderCount,

        users:
          userCount,

        revenue:
          totalRevenue,

        recentOrders,
      });

    } catch (error) {

      console.error(
        "Dashboard stats error:",
        error
      );

      res.status(500).json({
        message:
          "Error fetching dashboard stats",
      });

    }

  }
);


/* =========================================================
   USER MANAGEMENT - ADMIN
========================================================= */

app.get(
  "/api/users",
  authenticateToken,
  requireAdmin,
  async (
    req,
    res
  ) => {

    try {

      const users =
        await User.find(
          {},
          "-password -resetOtp -otpExpiry"
        ).sort({
          createdAt: -1,
        });

      res.json(
        users
      );

    } catch (error) {

      console.error(
        "Error fetching users:",
        error
      );

      res.status(500).json({
        message:
          "Error fetching users",
      });

    }

  }
);


/* =========================================================
   GET SINGLE USER PROFILE
========================================================= */

app.get(
  "/api/users/:id",
  authenticateToken,
  async (
    req,
    res
  ) => {

    try {

      const userId =
        req.params.id;


      if (
        req.user.role !== "admin" &&
        String(req.user.id) !==
          String(userId)
      ) {
        return res.status(403).json({
          message:
            "You can only view your own profile",
        });
      }


      const user =
        await User.findById(
          userId
        ).select(
          "-password -resetOtp"
        );


      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }


      return res.json({
        user:
          serializeUser(user),
      });

    } catch (error) {

      console.error(
        "Get user profile error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load profile",
      });

    }

  }
);


/* =========================================================
   UPDATE USER PROFILE + ADDRESS
========================================================= */

app.put(
  "/api/users/:id",
  authenticateToken,
  async (
    req,
    res
  ) => {

    try {

      const {
        name,
        phone,
        email,
        address,
      } =
        req.body;


      const userId =
        req.params.id;


      /* =========================================
         PERMISSION
      ========================================= */

      if (
        req.user.role !== "admin" &&
        String(req.user.id) !==
          String(userId)
      ) {

        return res.status(403).json({
          message:
            "You can only update your own profile",
        });

      }


      /* =========================================
         FIND USER
      ========================================= */

      const user =
        await User.findById(
          userId
        );


      if (!user) {

        return res.status(404).json({
          message:
            "User not found",
        });

      }


      /* =========================================
         EMAIL
      ========================================= */

      if (
        email &&
        email.toLowerCase().trim() !==
          user.email
      ) {

        const normalizedEmail =
          email
            .toLowerCase()
            .trim();


        const existingUser =
          await User.findOne({
            email:
              normalizedEmail,
          });


        if (
          existingUser &&
          String(existingUser._id) !==
            String(user._id)
        ) {

          return res.status(409).json({
            message:
              "Email already in use",
          });

        }


        user.email =
          normalizedEmail;

      }


      /* =========================================
         BASIC PROFILE
      ========================================= */

      if (
        name !== undefined
      ) {

        user.name =
          String(name).trim();

      }


      if (
        phone !== undefined
      ) {

        user.phone =
          String(phone).trim();

      }


      /* =========================================
         ADDRESS
      ========================================= */

      if (
        address &&
        typeof address === "object"
      ) {

        user.address =
          normalizeAddress(
            address
          );

      }


      /* =========================================
         SAVE
      ========================================= */

      console.log(
        "Saving user profile:",
        {
          userId,
          address:
            user.address,
        }
      );


      await user.save();


      /* =========================================
         VERIFY FROM DATABASE
      ========================================= */

      const savedUser =
        await User.findById(
          user._id
        );


      console.log(
        "Saved address from MongoDB:",
        savedUser?.address
      );


      /* =========================================
         RESPONSE
      ========================================= */

      return res.json({
        message:
          "Profile updated successfully",

        user:
          serializeUser(
            savedUser || user
          ),
      });

    } catch (error) {

      console.error(
        "Profile update error:",
        error
      );

      return res.status(500).json({
        message:
          "Server error during profile update",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

    }

  }
);


/* =========================================================
   POLICIES
========================================================= */

app.get(
  "/api/policies",
  async (
    req,
    res
  ) => {

    try {

      let policy =
        await Policy.findOne();


      if (!policy) {

        policy =
          new Policy();

        await policy.save();

      }


      res.json(
        policy
      );

    } catch (error) {

      res.status(500).json({
        message:
          "Error fetching policies",
      });

    }

  }
);


app.post(
  "/api/policies",
  authenticateToken,
  requireAdmin,
  async (
    req,
    res
  ) => {

    try {

      const {
        shippingPolicy,
        returnPolicy,
      } =
        req.body;


      let policy =
        await Policy.findOne();


      if (policy) {

        policy.shippingPolicy =
          shippingPolicy;

        policy.returnPolicy =
          returnPolicy;

        policy.updatedAt =
          Date.now();

      } else {

        policy =
          new Policy({
            shippingPolicy,
            returnPolicy,
          });

      }


      await policy.save();


      res.json({
        message:
          "Policies updated",

        policy,
      });

    } catch (error) {

      res.status(500).json({
        message:
          "Error updating policies",
      });

    }

  }
);


/* =========================================================
   PRODUCTS - GET ALL
========================================================= */

app.get(
  "/api/products",
  async (
    req,
    res
  ) => {

    try {

      const {
        category,
      } =
        req.query;


      const filter = {};


      if (
        category &&
        category !==
          "all"
      ) {

        filter.category =
          category;

      }


      const products =
        await Product.find(
          filter
        ).sort({
          createdAt: -1,
        });


      res.json(
        products
      );

    } catch (error) {

      console.error(
        "Error fetching products:",
        error
      );

      res.status(500).json({
        message:
          "Error fetching products",
      });

    }

  }
);


/* =========================================================
   PRODUCT - GET ONE
========================================================= */

app.get(
  "/api/products/:id",
  async (
    req,
    res
  ) => {

    try {

      const product =
        await Product.findById(
          req.params.id
        );


      if (!product) {

        return res.status(404).json({
          message:
            "Product not found",
        });

      }


      res.json(
        product
      );

    } catch (error) {

      console.error(
        "Error fetching product:",
        error
      );

      res.status(500).json({
        message:
          "Error fetching product",
      });

    }

  }
);


/* =========================================================
   PRODUCT - ADD
========================================================= */

app.post(
  "/api/products",
  authenticateToken,
  requireAdmin,
  upload.array(
    "images",
    5
  ),
  async (
    req,
    res
  ) => {

    try {

      const {
        name,
        price,
        originalPrice,
        category,
        type,
        material,
        discount,
        description,
        colors,
        stock,
        quantity,
        specifications,
        productCare,
        moreInfo,
        offerLabel,
        offerDiscount,
        offerStartDate,
        offerEndDate,
      } =
        req.body;


      if (
        !name ||
        !String(name).trim()
      ) {

        return res.status(400).json({
          message:
            "Product name is required",
        });

      }


      if (
        price === undefined ||
        price === null ||
        price === ""
      ) {

        return res.status(400).json({
          message:
            "Product price is required",
        });

      }


      let images = [];


      if (
        req.files &&
        req.files.length >
          0
      ) {

        const uploadedImages =
          await Promise.all(
            req.files.map(
              (
                file
              ) =>
                uploadToCloudinary(
                  file
                )
            )
          );


        images =
          uploadedImages
            .filter(Boolean)
            .map(
              (
                result
              ) =>
                result.secure_url
            );

      }


      const stockVal =
        Math.max(
          0,
          parseInt(
            stock ||
              quantity ||
              0,
            10
          ) || 0
        );


      let parsedColors = [];


      if (
        typeof colors === "string"
      ) {

        parsedColors =
          colors
            .split(",")
            .map(
              (
                color
              ) =>
                color.trim()
            )
            .filter(Boolean);

      } else if (
        Array.isArray(colors)
      ) {

        parsedColors =
          colors;

      }


      const newProduct =
        new Product({
          name:
            String(name).trim(),

          price:
            parseFloat(
              price
            ) || 0,

          originalPrice:
            parseFloat(
              originalPrice ||
                price
            ) || 0,

          images,

          category:
            category ||
            "clothing",

          material:
            material ||
            "",

          type:
            type ||
            "",

          discount:
            parseInt(
              discount ||
                0,
              10
            ) || 0,

          description:
            description ||
            "",

          colors:
            parsedColors,

          stock:
            stockVal,

          quantity:
            stockVal,

          specifications:
            specifications ||
            "",

          productCare:
            productCare ||
            "",

          moreInfo:
            moreInfo ||
            "",

          offerLabel:
            offerLabel ||
            "",

          offerDiscount:
            parseFloat(
              offerDiscount ||
                0
            ) || 0,

          offerStartDate:
            offerStartDate
              ? new Date(
                  offerStartDate
                )
              : null,

          offerEndDate:
            offerEndDate
              ? new Date(
                  offerEndDate
                )
              : null,
        });


      await newProduct.save();


      return res.status(201).json({
        message:
          "Product added successfully",

        product:
          newProduct,
      });

    } catch (error) {

      console.error(
        "Error adding product:",
        error
      );

      return res.status(500).json({
        message:
          "Error adding product",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

    }

  }
);


/* =========================================================
   PRODUCT - EDIT
========================================================= */

app.put(
  "/api/products/:id",
  authenticateToken,
  requireAdmin,
  upload.array(
    "images",
    5
  ),
  async (
    req,
    res
  ) => {

    try {

      const product =
        await Product.findById(
          req.params.id
        );


      if (!product) {

        return res.status(404).json({
          message:
            "Product not found",
        });

      }


      const {
        name,
        price,
        originalPrice,
        category,
        type,
        material,
        discount,
        description,
        colors,
        stock,
        quantity,
        specifications,
        productCare,
        moreInfo,
        offerLabel,
        offerDiscount,
        offerStartDate,
        offerEndDate,
      } =
        req.body;


      let images =
        Array.isArray(
          product.images
        )
          ? [
              ...product.images,
            ]
          : [];


      if (
        req.files &&
        req.files.length >
          0
      ) {

        await Promise.all(
          images.map(
            (
              image
            ) =>
              deleteProductImage(
                image
              )
          )
        );


        const uploadedImages =
          await Promise.all(
            req.files.map(
              (
                file
              ) =>
                uploadToCloudinary(
                  file
                )
            )
          );


        images =
          uploadedImages
            .filter(Boolean)
            .map(
              (
                result
              ) =>
                result.secure_url
            );

      }


      const stockVal =
        Math.max(
          0,
          parseInt(
            stock ??
              quantity ??
              product.stock ??
              0,
            10
          ) || 0
        );


      let parsedColors =
        product.colors ||
        [];


      if (
        typeof colors === "string"
      ) {

        parsedColors =
          colors
            .split(",")
            .map(
              (
                color
              ) =>
                color.trim()
            )
            .filter(Boolean);

      } else if (
        Array.isArray(colors)
      ) {

        parsedColors =
          colors;

      }


      Object.assign(
        product,
        {

          name:
            name !== undefined
              ? name
              : product.name,

          price:
            price !== undefined &&
            price !== ""
              ? parseFloat(
                  price
                )
              : product.price,

          originalPrice:
            originalPrice !==
              undefined &&
            originalPrice !== ""
              ? parseFloat(
                  originalPrice
                )
              : product.originalPrice,

          images,

          category:
            category !== undefined
              ? category
              : product.category,

          material:
            material !== undefined
              ? material
              : product.material,

          type:
            type !== undefined
              ? type
              : product.type,

          discount:
            discount !==
              undefined
              ? parseInt(
                  discount,
                  10
                )
              : product.discount,

          description:
            description !==
              undefined
              ? description
              : product.description,

          colors:
            parsedColors,

          stock:
            stockVal,

          quantity:
            stockVal,

          specifications:
            specifications !==
              undefined
              ? specifications
              : product.specifications,

          productCare:
            productCare !==
              undefined
              ? productCare
              : product.productCare,

          moreInfo:
            moreInfo !==
              undefined
              ? moreInfo
              : product.moreInfo,

          offerLabel:
            offerLabel !==
              undefined
              ? offerLabel
              : product.offerLabel,

          offerDiscount:
            offerDiscount !==
              undefined
              ? parseFloat(
                  offerDiscount
                ) || 0
              : product.offerDiscount,

          offerStartDate:
            offerStartDate !==
              undefined
              ? offerStartDate
                ? new Date(
                    offerStartDate
                  )
                : null
              : product.offerStartDate,

          offerEndDate:
            offerEndDate !==
              undefined
              ? offerEndDate
                ? new Date(
                    offerEndDate
                  )
                : null
              : product.offerEndDate,
        }
      );


      await product.save();


      res.json({
        message:
          "Product updated successfully",

        product,
      });

    } catch (error) {

      console.error(
        "Error updating product:",
        error
      );

      res.status(500).json({
        message:
          "Error updating product",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

    }

  }
);


/* =========================================================
   PRODUCT - DELETE
========================================================= */

app.delete(
  "/api/products/:id",
  authenticateToken,
  requireAdmin,
  async (
    req,
    res
  ) => {

    try {

      const product =
        await Product.findById(
          req.params.id
        );


      if (!product) {

        return res.status(404).json({
          message:
            "Product not found",
        });

      }


      if (
        Array.isArray(
          product.images
        ) &&
        product.images.length >
          0
      ) {

        await Promise.all(
          product.images.map(
            (
              image
            ) =>
              deleteProductImage(
                image
              )
          )
        );

      }


      await Product.findByIdAndDelete(
        req.params.id
      );


      res.json({
        message:
          "Product deleted successfully",
      });

    } catch (error) {

      console.error(
        "Error deleting product:",
        error
      );

      res.status(500).json({
        message:
          "Error deleting product",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

    }

  }
);


/* =========================================================
   ORDER CREATE
   - Server-side price validation
   - Server-side stock validation
   - Stock deduction
   - Coupon validation
   - Coupon usage increment
   - WhatsApp order support
========================================================= */

app.post(
  "/api/orders",
  async (
    req,
    res
  ) => {

    const session =
      await mongoose.startSession();

    try {

      /* =========================================
         REQUEST DATA
      ========================================= */

      const {
        customer,
        items,
        paymentMethod,
        source,
        couponCode,
      } = req.body;


      /* =========================================
         BASIC VALIDATION
      ========================================= */

      if (
        !customer ||
        !Array.isArray(items) ||
        items.length === 0
      ) {

        return res.status(400).json({
          message:
            "Customer and order items are required",
        });

      }


      /* =========================================
         AUTHENTICATED USER
      ========================================= */

      let authenticatedUserId =
        null;


      const authHeader =
        req.headers.authorization;


      if (
        authHeader &&
        authHeader.startsWith(
          "Bearer "
        )
      ) {

        const token =
          authHeader.slice(
            7
          );

        try {

          const decoded =
            jwt.verify(
              token,
              JWT_SECRET
            );

          authenticatedUserId =
            decoded.id;

        } catch (error) {

          return res.status(401).json({
            message:
              "Invalid or expired token",
          });

        }

      }


      /* =========================================
         ORDER SOURCE
      ========================================= */

      const orderSource =
        source === "whatsapp" ||
        paymentMethod === "whatsapp"
          ? "whatsapp"
          : "website";


      const normalizedPaymentMethod =
        orderSource === "whatsapp"
          ? "whatsapp"
          : (
              paymentMethod ||
              "cod"
            );


      const orderStatus =
        orderSource === "whatsapp"
          ? "pending_whatsapp"
          : "pending";


      /* =========================================
         START TRANSACTION
      ========================================= */

      session.startTransaction();


      /* =========================================
         LOAD PRODUCTS
      ========================================= */

      const productIds =
        items.map(
          (item) =>
            String(
              item.productId || ""
            )
        );


      const uniqueProductIds =
        [
          ...new Set(
            productIds
          ),
        ];


      const validObjectIds =
        uniqueProductIds.filter(
          (id) =>
            mongoose.Types.ObjectId.isValid(
              id
            )
        );


      if (
        validObjectIds.length !==
        uniqueProductIds.length
      ) {

        await session.abortTransaction();

        return res.status(400).json({
          message:
            "One or more products are invalid.",
        });

      }


      const products =
        await Product.find({
          _id: {
            $in:
              validObjectIds,
          },
        }).session(
          session
        );


      const productMap =
        new Map(
          products.map(
            (product) => [
              String(
                product._id
              ),
              product,
            ]
          )
        );


      /* =========================================
         SERVER-SIDE ORDER ITEMS
      ========================================= */

      const serverOrderItems = [];

      let subtotal = 0;


      for (
        const item of items
      ) {

        const productId =
          String(
            item.productId || ""
          );


        const product =
          productMap.get(
            productId
          );


        if (!product) {

          await session.abortTransaction();

          return res.status(404).json({
            message:
              `Product not found: ${item.name || productId}`,
          });

        }


        const quantity =
          Math.max(
            0,
            Math.floor(
              Number(
                item.quantity ??
                item.qty ??
                0
              )
            )
          );


        if (
          quantity <= 0
        ) {

          await session.abortTransaction();

          return res.status(400).json({
            message:
              `Invalid quantity for ${product.name}`,
          });

        }


        const currentStock =
          Math.max(
            0,
            Math.floor(
              Number(
                product.stock ??
                product.quantity ??
                0
              )
            )
          );


        /* =====================================
           STOCK CHECK
        ===================================== */

        if (
          currentStock <
          quantity
        ) {

          await session.abortTransaction();

          return res.status(409).json({
            message:
              `${product.name} has only ${currentStock} item(s) available.`,
          });

        }


        /* =====================================
           SERVER PRICE
        ===================================== */

        const serverPrice =
          Math.round(
            Number(
              product.price || 0
            )
          );


        subtotal +=
          serverPrice *
          quantity;


        const image =
          Array.isArray(
            product.images
          ) &&
          product.images.length >
            0
            ? product.images[0]
            : "";


        serverOrderItems.push({
          productId:
            product._id,

          name:
            product.name,

          price:
            serverPrice,

          quantity,

          qty:
            quantity,

          image,

          images:
            image
              ? [image]
              : [],
        });

      }


      /* =========================================
         SHIPPING
         Existing policy:
         Free above ₹999
      ========================================= */

      const shipping =
        subtotal >= 999 ||
        subtotal === 0
          ? 0
          : 99;


      /* =========================================
         COUPON
      ========================================= */

      let discountAmount =
        0;

      let coupon = null;


      const normalizedCouponCode =
        couponCode
          ? String(
              couponCode
            )
              .trim()
              .toUpperCase()
          : "";


      if (
        normalizedCouponCode
      ) {

        coupon =
          await Coupon.findOne({
            code:
              normalizedCouponCode,

            isActive:
              true,
          }).session(
            session
          );


        if (!coupon) {

          await session.abortTransaction();

          return res.status(400).json({
            message:
              "Invalid coupon code.",
          });

        }


        if (
          !coupon.expiryDate ||
          new Date(
            coupon.expiryDate
          ) <
            new Date()
        ) {

          await session.abortTransaction();

          return res.status(400).json({
            message:
              "Coupon has expired.",
          });

        }


        if (
          subtotal <
          Number(
            coupon.minOrderAmount ||
              0
          )
        ) {

          await session.abortTransaction();

          return res.status(400).json({
            message:
              `Minimum order amount of ₹${Number(
                coupon.minOrderAmount || 0
              ).toLocaleString("en-IN")} not met.`,
          });

        }


        if (
          coupon.usageLimit !== null &&
          coupon.usageLimit !== undefined &&
          Number(
            coupon.usedCount || 0
          ) >=
            Number(
              coupon.usageLimit
            )
        ) {

          await session.abortTransaction();

          return res.status(400).json({
            message:
              "Coupon usage limit reached.",
          });

        }


        if (
          coupon.discountType ===
          "percentage"
        ) {

          discountAmount =
            (
              subtotal *
              Number(
                coupon.discountValue ||
                  0
              )
            ) /
            100;

        } else {

          discountAmount =
            Number(
              coupon.discountValue ||
                0
            );

        }


        discountAmount =
          Math.min(
            Math.max(
              discountAmount,
              0
            ),
            subtotal
          );

      }


      /* =========================================
         SERVER FINAL TOTAL
      ========================================= */

      const finalTotal =
        Math.max(
          0,
          subtotal +
            shipping -
            discountAmount
        );


      /* =========================================
         ORDER ID
      ========================================= */

      const orderId =
        "SP" +
        Date.now()
          .toString(36)
          .toUpperCase() +
        Math.random()
          .toString(36)
          .substring(
            2,
            6
          )
          .toUpperCase();


      /* =========================================
         CREATE ORDER
      ========================================= */

      const newOrder =
        new Order({
          orderId,

          userId:
            authenticatedUserId,

          customer,

          items:
            serverOrderItems,

          total:
            Math.round(
              finalTotal
            ),

          paymentMethod:
            normalizedPaymentMethod,

          orderSource,

          status:
            orderStatus,
        });


      await newOrder.save({
        session,
      });


      /* =========================================
         DEDUCT STOCK
         
         Important:
         Use conditional update so two
         simultaneous orders cannot oversell.
      ========================================= */

      for (
        const item of serverOrderItems
      ) {

        const quantity =
          Number(
            item.quantity || 0
          );


        const updatedProduct =
          await Product.findOneAndUpdate(
            {
              _id:
                item.productId,

              $or: [
                {
                  stock: {
                    $gte:
                      quantity,
                  },
                },

                {
                  stock: {
                    $exists:
                      false,
                  },

                  quantity: {
                    $gte:
                      quantity,
                  },
                },
              ],
            },
            [
              {
                $set: {
                  stock: {
                    $subtract: [
                      {
                        $ifNull: [
                          "$stock",
                          "$quantity",
                        ],
                      },
                      quantity,
                    ],
                  },

                  quantity: {
                    $subtract: [
                      {
                        $ifNull: [
                          "$stock",
                          "$quantity",
                        ],
                      },
                      quantity,
                    ],
                  },
                },
              },
            ],
            {
              new:
                true,

              session,

              updatePipeline:
                true,
            }
          );


        if (
          !updatedProduct
        ) {

          throw new Error(
            `${item.name} became unavailable while placing your order. Please try again.`
          );

        }

      }


      /* =========================================
         COUPON USAGE
      ========================================= */

      if (
        coupon
      ) {

        const couponUpdate =
          await Coupon.findOneAndUpdate(
            {
              _id:
                coupon._id,

              isActive:
                true,

              $or: [
                {
                  usageLimit:
                    null,
                },

                {
                  usageLimit:
                    {
                      $exists:
                        false,
                    },
                },

                {
                  $expr: {
                    $lt: [
                      "$usedCount",
                      "$usageLimit",
                    ],
                  },
                },
              ],
            },
            {
              $inc: {
                usedCount:
                  1,
              },
            },
            {
              new:
                true,

              session,
            }
          );


        if (
          !couponUpdate
        ) {

          throw new Error(
            "Coupon is no longer available."
          );

        }

      }


      /* =========================================
         COMMIT
      ========================================= */

      await session.commitTransaction();


      /* =========================================
         RESPONSE
      ========================================= */

      return res.status(201).json({
        message:
          orderSource ===
          "whatsapp"
            ? "WhatsApp order created successfully"
            : "Order placed successfully",

        order:
          newOrder,

        pricing: {
          subtotal:
            Math.round(
              subtotal
            ),

          shipping:
            Math.round(
              shipping
            ),

          discount:
            Math.round(
              discountAmount
            ),

          total:
            Math.round(
              finalTotal
            ),

          couponCode:
            coupon?.code ||
            null,
        },
      });

    } catch (error) {

      /* =========================================
         ROLLBACK
      ========================================= */

      try {

        await session.abortTransaction();

      } catch (
        rollbackError
      ) {

        console.error(
          "Order transaction rollback error:",
          rollbackError
        );

      }


      console.error(
        "Error placing order:",
        error
      );


      const message =
        error instanceof Error
          ? error.message
          : "Error placing order";


      /* =========================================
         FRIENDLY RESPONSE
      ========================================= */

      if (
        message.includes(
          "became unavailable"
        )
      ) {

        return res.status(409).json({
          message,
        });

      }


      if (
        message ===
        "Coupon is no longer available."
      ) {

        return res.status(409).json({
          message,
        });

      }


      return res.status(500).json({
        message:
          "Error placing order",

        error:
          message,
      });

    } finally {

      await session.endSession();

    }

  }
);


/* =========================================================
   GET ORDERS
========================================================= */

app.get(
  "/api/orders",
  authenticateToken,
  async (
    req,
    res
  ) => {

    try {

      let orders;


      if (
        req.user.role === "admin"
      ) {

        orders =
          await Order.find()
            .sort({
              createdAt: -1,
            });

      } else {

        orders =
          await Order.find({
            userId:
              req.user.id,
          }).sort({
            createdAt: -1,
          });

      }


      res.json(
        orders
      );

    } catch (error) {

      console.error(
        "Error fetching orders:",
        error
      );

      res.status(500).json({
        message:
          "Error fetching orders",
      });

    }

  }
);


/* =========================================================
   GET SINGLE ORDER
========================================================= */

app.get(
  "/api/orders/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const identifier = String(
        req.params.id || ""
      ).trim();

      let order = null;

      if (
        mongoose.Types.ObjectId.isValid(
          identifier
        )
      ) {
        order =
          await Order.findById(
            identifier
          );
      }

      if (!order) {
        order =
          await Order.findOne({
            orderId:
              identifier,
          });
      }

      if (!order) {
        return res.status(404).json({
          message:
            "Order not found",
        });
      }

      if (
        req.user.role === "admin"
      ) {
        return res.json(order);
      }

      if (
        !order.userId ||
        String(order.userId) !==
          String(req.user.id)
      ) {
        return res.status(403).json({
          message:
            "You can only view your own orders",
        });
      }

      return res.json(order);

    } catch (error) {
      console.error(
        "Error fetching order:",
        error
      );

      return res.status(500).json({
        message:
          "Error fetching order",
      });
    }
  }
);

/* =========================================================
   ORDER STATUS
========================================================= */

app.put(
  "/api/orders/:id/status",
  authenticateToken,
  requireAdmin,
  async (
    req,
    res
  ) => {

    try {

      const {
        status,
      } =
        req.body;


      const validStatuses = [
        "pending",
        "pending_whatsapp",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ];


      if (
        !validStatuses.includes(
          status
        )
      ) {

        return res.status(400).json({
          message:
            "Invalid status",
        });

      }


      const order =
        await Order.findByIdAndUpdate(
          req.params.id,
          {
            status,

            updatedAt:
              Date.now(),
          },
          {
            new:
              true,

            runValidators:
              true,
          }
        );


      if (!order) {

        return res.status(404).json({
          message:
            "Order not found",
        });

      }


      res.json({
        message:
          "Order status updated",

        order,
      });

    } catch (error) {

      console.error(
        "Error updating order status:",
        error
      );

      res.status(500).json({
        message:
          "Error updating order status",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

    }

  }
);


/* =========================================================
   REVIEWS - CREATE
========================================================= */

app.post(
  "/api/reviews",
  authenticateToken,
  reviewUpload.single(
    "image"
  ),
  async (
    req,
    res
  ) => {

    try {

      const {
        productId,
        rating,
        comment,
      } =
        req.body;


      const reviewUser =
        await User.findById(
          req.user.id
        ).select(
          "name email phone"
        );


      if (!reviewUser) {

        return res.status(401).json({
          message:
            "User account not found.",
        });

      }


      const userName =
        reviewUser.name ||
        reviewUser.email ||
        reviewUser.phone ||
        "Customer";


      let imagePath =
        null;


      if (
        req.file
      ) {

        const filename =
          `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path.extname(
            req.file.originalname
          )}`;


        const filePath =
          path.join(
            uploadsDir,
            filename
          );


        await fs.promises.writeFile(
          filePath,
          req.file.buffer
        );


        imagePath =
          `/uploads/${filename}`;

      }


      const newReview =
        new Review({
          productId,

          userName,

          rating,

          comment,

          image:
            imagePath,
        });


      await newReview.save();


      res.status(201).json({
        message:
          "Review added",

        review:
          newReview,
      });

    } catch (error) {

      console.error(
        "Error adding review:",
        error
      );

      res.status(500).json({
        message:
          "Error adding review",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      });

    }

  }
);


/* =========================================================
   REVIEWS - GET
========================================================= */

app.get(
  "/api/reviews/:productId",
  async (
    req,
    res
  ) => {

    try {

      const reviews =
        await Review.find({
          productId:
            req.params.productId,
        }).sort({
          createdAt: -1,
        });


      res.json(
        reviews
      );

    } catch (error) {

      console.error(
        "Error fetching reviews:",
        error
      );

      res.status(500).json({
        message:
          "Error fetching reviews",
      });

    }

  }
);


/* =========================================================
   PASSWORD VALIDATION
========================================================= */

function validatePassword(
  password
) {

  const errors = [];


  if (!password) {
    errors.push(
      "Password is required"
    );

    return errors;
  }


  if (
    password.length <
    8
  ) {

    errors.push(
      "Password must be at least 8 characters long"
    );

  }


  if (
    !/[A-Z]/.test(
      password
    )
  ) {

    errors.push(
      "Password must contain at least one uppercase letter"
    );

  }


  if (
    !/[a-z]/.test(
      password
    )
  ) {

    errors.push(
      "Password must contain at least one lowercase letter"
    );

  }


  if (
    !/[0-9]/.test(
      password
    )
  ) {

    errors.push(
      "Password must contain at least one number"
    );

  }


  return errors;
}


/* =========================================================
   REGISTER HANDLER
========================================================= */

async function registerHandler(
  req,
  res
) {

  console.log(
    `Register request received for: ${
      req.body?.email || ""
    }`
  );


  try {

    const {
      name,
      email,
      phone,
      password,
    } =
      req.body || {};


    if (
      !name ||
      !email ||
      !phone ||
      !password
    ) {

      return res.status(400).json({
        message:
          "All fields are required",
      });

    }


    const passwordErrors =
      validatePassword(
        password
      );


    if (
      passwordErrors.length >
      0
    ) {

      return res.status(400).json({
        message:
          passwordErrors[0],

        errors:
          passwordErrors,
      });

    }


    const normalizedEmail =
      email
        .toLowerCase()
        .trim();


    const existingUser =
      await User.findOne({
        email:
          normalizedEmail,
      });


    if (
      existingUser
    ) {

      return res.status(409).json({
        message:
          "An account with this email already exists",
      });

    }


    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );


    const newUser =
      new User({
        name:
          String(name).trim(),

        email:
          normalizedEmail,

        phone:
          String(phone).trim(),

        password:
          hashedPassword,

        role:
          "user",

        address:
          normalizeAddress({}),
      });


    await newUser.save();


    res.status(201).json({
      message:
        "Registration successful",

      user:
        serializeUser(
          newUser
        ),
    });

  } catch (error) {

    console.error(
      "Registration error:",
      error
    );


    if (
      error.code === 11000
    ) {

      return res.status(409).json({
        message:
          "An account with this email already exists",
      });

    }


    res.status(500).json({
      message:
        "Server error during registration. Please try again.",
    });

  }

}


/* =========================================================
   LOGIN HANDLER
========================================================= */

async function loginHandler(
  req,
  res
) {

  console.log(
    `Login request received for: ${
      req.body?.email || ""
    }`
  );


  try {

    const {
      email,
      password,
    } =
      req.body || {};


    if (
      !email ||
      !password
    ) {

      return res.status(400).json({
        message:
          "Email and password are required",
      });

    }


    const user =
      await User.findOne({
        email:
          email
            .toLowerCase()
            .trim(),
      });


    if (!user) {

      return res.status(401).json({
        message:
          "Invalid email or password",
      });

    }


    let isMatch =
      false;


    try {

      isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

    } catch {
      isMatch =
        false;
    }


    if (!isMatch) {

      if (
        user.password ===
        password
      ) {

        user.password =
          await bcrypt.hash(
            password,
            12
          );

        await user.save();

      } else {

        return res.status(401).json({
          message:
            "Invalid email or password",
        });

      }

    }


    const token =
      generateToken(
        user
      );


    res.json({
      message:
        "Login successful",

      token,

      user:
        serializeUser(
          user
        ),
    });

  } catch (error) {

    console.error(
      "Login error:",
      error
    );


    res.status(500).json({
      message:
        "Server error during login. Please try again.",
    });

  }

}


/* =========================================================
   AUTH ROUTES
========================================================= */

app.post(
  "/register",
  registerHandler
);

app.post(
  "/login",
  loginHandler
);

app.post(
  "/api/auth/register",
  registerHandler
);

app.post(
  "/api/auth/login",
  loginHandler
);


/* =========================================================
   FORGOT PASSWORD
========================================================= */

async function sendResetOtp(
  req,
  res
) {

  try {

    const {
      identifier,
    } =
      req.body;


    if (!identifier) {

      return res.status(400).json({
        message:
          "Please enter your email or mobile number",
      });

    }


    const normalized =
      identifier
        .toLowerCase()
        .trim();


    const user =
      await User.findOne({
        $or: [
          {
            email:
              normalized,
          },

          {
            phone:
              identifier,
          },
        ],
      });


    if (!user) {

      return res.status(404).json({
        message:
          "No account found with this email/mobile",
      });

    }


    const otp =
      crypto.randomInt(
        100000,
        1000000
      ).toString();


    const otpExpiry =
      new Date(
        Date.now() +
          5 * 60 * 1000
      );


    user.resetOtp =
      await bcrypt.hash(
        otp,
        12
      );

    user.otpAttempts =
      0;

    user.otpVerified =
      false;

    user.otpExpiry =
      otpExpiry;


    await user.save();


    if (
      !process.env.RESEND_API_KEY
    ) {

      return res.status(500).json({
        message:
          "Email service is not configured.",
      });

    }


    const {
      data: emailData,
      error: emailError,
    } =
      await resend.emails.send({

        from:
          process.env.EMAIL_FROM ||
          "Shivaay Paridhan <onboarding@resend.dev>",

        to: [
          user.email,
        ],

        subject:
          "Shivaay Paridhan - Password Reset OTP",

        text:
          `Your password reset OTP is ${otp}. It will expire in 5 minutes. If you did not request this, please ignore this email.`,

        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;color:#222;">
            <h2>Shivaay Paridhan</h2>

            <p>Your password reset OTP is:</p>

            <div style="
              margin:25px 0;
              padding:20px;
              background:#f7f2ed;
              border-radius:12px;
              text-align:center;
              font-size:36px;
              font-weight:700;
              letter-spacing:8px;
            ">
              ${otp}
            </div>

            <p>
              This OTP will expire in
              <strong>5 minutes</strong>.
            </p>

            <p style="color:#666;">
              If you did not request a password reset,
              please ignore this email.
            </p>

            <hr style="
              margin:30px 0;
              border:none;
              border-top:1px solid #eee;
            ">

            <p style="
              font-size:13px;
              color:#888;
            ">
              © 2026 Shivaay Paridhan
            </p>
          </div>
        `,
      });


    if (
      emailError
    ) {

      console.error(
        "Resend email error:",
        emailError
      );

      return res.status(500).json({
        message:
          "Unable to send OTP. Please try again.",
      });

    }


    console.log(
      "OTP email sent:",
      emailData?.id
    );


    res.json({
      message:
        "OTP sent successfully",

      email:
        user.email.replace(
          /(.{2})(.*)(@.*)/,
          "$1***$3"
        ),
    });

  } catch (error) {

    console.error(
      "Forgot password error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to send OTP. Please try again.",
    });

  }

}


app.post(
  "/forgot-password",
  sendResetOtp
);

app.post(
  "/api/auth/forgot-password",
  sendResetOtp
);


/* =========================================================
   VERIFY OTP
========================================================= */

async function verifyOtpHandler(
  req,
  res
) {

  try {

    const {
      identifier,
      otp,
    } =
      req.body;


    if (
      !identifier ||
      !otp
    ) {

      return res.status(400).json({
        message:
          "Email/mobile and OTP are required",
      });

    }


    const user =
      await User.findOne({
        $or: [
          {
            email:
              identifier
                .toLowerCase()
                .trim(),
          },

          {
            phone:
              identifier,
          },
        ],
      });


    if (!user) {

      return res.status(404).json({
        message:
          "User not found",
      });

    }


    if (
      !user.resetOtp
    ) {

      return res.status(400).json({
        message:
          "No OTP requested. Please request a new one.",
      });

    }


    if (
      !user.otpExpiry ||
      new Date() >
        user.otpExpiry
    ) {

      user.resetOtp =
        null;

      user.otpExpiry =
        null;

      user.otpAttempts =
        0;

      user.otpVerified =
        false;

      await user.save();


      return res.status(400).json({
        message:
          "OTP has expired. Please request a new one.",
      });

    }


    if (
      user.otpAttempts >=
      5
    ) {

      user.resetOtp =
        null;

      user.otpExpiry =
        null;

      user.otpAttempts =
        0;

      user.otpVerified =
        false;

      await user.save();


      return res.status(429).json({
        message:
          "Too many incorrect OTP attempts. Please request a new OTP.",
      });

    }


    const otpMatches =
      await bcrypt.compare(
        otp,
        user.resetOtp
      );


    if (
      !otpMatches
    ) {

      user.otpAttempts +=
        1;

      await user.save();


      return res.status(400).json({
        message:
          "Invalid OTP. Please try again.",
      });

    }


    user.otpVerified =
      true;

    await user.save();


    res.json({
      message:
        "OTP verified successfully",

      verified:
        true,
    });

  } catch (error) {

    console.error(
      "OTP verification error:",
      error
    );

    res.status(500).json({
      message:
        "Server error during OTP verification",
    });

  }

}


app.post(
  "/verify-otp",
  verifyOtpHandler
);

app.post(
  "/api/auth/verify-otp",
  verifyOtpHandler
);


/* =========================================================
   RESET PASSWORD
========================================================= */

async function resetPasswordHandler(
  req,
  res
) {

  try {

    const {
      identifier,
      otp,
      newPassword,
    } =
      req.body;


    if (
      !identifier ||
      !otp ||
      !newPassword
    ) {

      return res.status(400).json({
        message:
          "All fields are required",
      });

    }


    const passwordErrors =
      validatePassword(
        newPassword
      );


    if (
      passwordErrors.length >
      0
    ) {

      return res.status(400).json({
        message:
          "Weak password",

        errors:
          passwordErrors,
      });

    }


    const user =
      await User.findOne({
        $or: [
          {
            email:
              identifier
                .toLowerCase()
                .trim(),
          },

          {
            phone:
              identifier,
          },
        ],
      });


    if (!user) {

      return res.status(404).json({
        message:
          "User not found",
      });

    }


    if (
      !user.resetOtp ||
      !user.otpVerified ||
      !user.otpExpiry ||
      new Date() >
        user.otpExpiry
    ) {

      return res.status(400).json({
        message:
          "OTP is invalid or expired. Please request a new one.",
      });

    }


    const otpMatches =
      await bcrypt.compare(
        otp,
        user.resetOtp
      );


    if (
      !otpMatches
    ) {

      return res.status(400).json({
        message:
          "OTP is invalid or expired. Please request a new one.",
      });

    }


    user.password =
      await bcrypt.hash(
        newPassword,
        12
      );

    user.resetOtp =
      null;

    user.otpExpiry =
      null;

    user.otpAttempts =
      0;

    user.otpVerified =
      false;


    await user.save();


    res.json({
      message:
        "Password reset successful! You can now login with your new password.",
    });

  } catch (error) {

    console.error(
      "Password reset error:",
      error
    );

    res.status(500).json({
      message:
        "Server error during password reset",
    });

  }

}


app.post(
  "/reset-password",
  resetPasswordHandler
);

app.post(
  "/api/auth/reset-password",
  resetPasswordHandler
);


/* =========================================================
   COUPONS
========================================================= */

app.get(
  "/api/coupons",
  authenticateToken,
  requireAdmin,
  async (
    req,
    res
  ) => {

    try {

      const coupons =
        await Coupon.find()
          .sort({
            createdAt: -1,
          });


      res.json(
        coupons
      );

    } catch (error) {

      console.error(
        "Error fetching coupons:",
        error
      );

      res.status(500).json({
        message:
          "Error fetching coupons",
      });

    }

  }
);


app.post(
  "/api/coupons",
  authenticateToken,
  requireAdmin,
  async (
    req,
    res
  ) => {

    try {

      const coupon =
        new Coupon(
          req.body
        );


      await coupon.save();


      res.status(201).json(
        coupon
      );

    } catch (error) {

      if (
        error.code ===
        11000
      ) {

        return res.status(400).json({
          message:
            "Coupon code already exists",
        });

      }


      res.status(400).json({
        message:
          error.message,
      });

    }

  }
);


app.put(
  "/api/coupons/:id",
  authenticateToken,
  requireAdmin,
  async (
    req,
    res
  ) => {

    try {

      const coupon =
        await Coupon.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
          }
        );


      if (!coupon) {

        return res.status(404).json({
          message:
            "Coupon not found",
        });

      }


      res.json(
        coupon
      );

    } catch (error) {

      res.status(400).json({
        message:
          error.message,
      });

    }

  }
);


app.delete(
  "/api/coupons/:id",
  authenticateToken,
  requireAdmin,
  async (
    req,
    res
  ) => {

    try {

      const coupon =
        await Coupon.findByIdAndDelete(
          req.params.id
        );


      if (!coupon) {

        return res.status(404).json({
          message:
            "Coupon not found",
        });

      }


      res.json({
        message:
          "Coupon deleted successfully",
      });

    } catch (error) {

      res.status(500).json({
        message:
          "Error deleting coupon",
      });

    }

  }
);


/* =========================================================
   COUPON VALIDATE
========================================================= */

app.post(
  "/api/coupons/validate",
  async (
    req,
    res
  ) => {

    try {

      const {
        code,
        orderAmount,
      } =
        req.body;


      if (!code) {

        return res.status(400).json({
          message:
            "Coupon code is required",
        });

      }


      const coupon =
        await Coupon.findOne({
          code:
            String(
              code
            ).toUpperCase(),

          isActive:
            true,
        });


      if (!coupon) {

        return res.status(404).json({
          message:
            "Invalid coupon code",
        });

      }


      if (
        new Date() >
        new Date(
          coupon.expiryDate
        )
      ) {

        return res.status(400).json({
          message:
            "Coupon has expired",
        });

      }


      if (
        Number(
          orderAmount || 0
        ) <
        Number(
          coupon.minOrderAmount || 0
        )
      ) {

        return res.status(400).json({
          message:
            `Minimum order amount of ₹${coupon.minOrderAmount} not met`,
        });

      }


      if (
        coupon.usageLimit !== null &&
        coupon.usedCount >=
          coupon.usageLimit
      ) {

        return res.status(400).json({
          message:
            "Coupon usage limit reached",
        });

      }


      let discountAmount =
        0;


      if (
        coupon.discountType ===
        "percentage"
      ) {

        discountAmount =
          (
            Number(
              orderAmount
            ) *
            Number(
              coupon.discountValue
            )
          ) /
          100;

      } else {

        discountAmount =
          Number(
            coupon.discountValue
          );

      }


      discountAmount =
        Math.min(
          discountAmount,
          Number(
            orderAmount || 0
          )
        );


      res.json({
        message:
          "Coupon applied successfully",

        discountAmount,

        finalAmount:
          Number(
            orderAmount
          ) -
          discountAmount,

        couponCode:
          coupon.code,
      });

    } catch (error) {

      console.error(
        "Error validating coupon:",
        error
      );

      res.status(500).json({
        message:
          "Error validating coupon",
      });

    }

  }
);


/* =========================================================
   MULTER ERROR HANDLER
========================================================= */

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    if (
      err instanceof
      multer.MulterError
    ) {

      if (
        err.code ===
        "LIMIT_FILE_SIZE"
      ) {

        return res.status(400).json({
          message:
            "File too large. Maximum size is 10MB per image.",
        });

      }


      if (
        err.code ===
        "LIMIT_FILE_COUNT"
      ) {

        return res.status(400).json({
          message:
            "Too many files. Maximum 5 images allowed.",
        });

      }


      if (
        err.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {

        return res.status(400).json({
          message:
            "Too many files. Maximum 5 images allowed.",
        });

      }


      return res.status(400).json({
        message:
          err.message,
      });

    }


    if (
      err instanceof Error &&
      err.message
        .toLowerCase()
        .includes(
          "only jpg"
        )
    ) {

      return res.status(400).json({
        message:
          err.message,
      });

    }


    console.error(
      "Unhandled server error:",
      err
    );


    return res.status(500).json({
      message:
        "Internal server error",
    });

  }
);


/* =========================================================
   MONGODB
========================================================= */

console.log(
  "Connecting to MongoDB..."
);


mongoose
  .connect(
    MONGO_URI
  )

  .then(
    async () => {

      const db =
        mongoose.connection;


      console.log(
        "Database connected ✅",
        db.host,
        db.name
      );


      try {

        const userCount =
          await User.countDocuments();


        console.log(
          `User count in database: ${userCount}`
        );

      } catch (
        countError
      ) {

        console.warn(
          "Could not determine user count:",
          countError
        );

      }


      app.listen(
        PORT,
        () => {

          console.log(
            `Server running on port ${PORT}`
          );

        }
      );

    }
  )

  .catch(
    (error) => {

      console.error(
        "MongoDB connection error:",
        error
      );

      process.exit(1);

    }
  );