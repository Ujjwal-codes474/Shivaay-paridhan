'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  X,
  Upload,
  Trash2,
} from 'lucide-react';

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';

/* =========================================================
   PRODUCT TYPE
========================================================= */

export type Product = {
  id: string | number;
  name: string;
  category: string;
  fabric: string;
  occasion: string;
  price: number;
  salePrice: number;
  discount: number;
  stock: number;
  description: string;
  images: string[];
};

/* =========================================================
   PROPS
========================================================= */

type Props = {
  onClose: () => void;
  onAdd: (product: Product) => void;
};

/* =========================================================
   FORM TYPE
========================================================= */

type ProductForm = {
  name: string;
  category: string;
  fabric: string;
  occasion: string;
  price: string;
  discount: string;
  stock: string;
  description: string;
};

/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm: ProductForm = {
  name: '',
  category: 'Saree',
  fabric: '',
  occasion: '',
  price: '',
  discount: '',
  stock: '',
  description: '',
};

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/* =========================================================
   IMAGE URL
========================================================= */

function resolveImageUrl(image?: string) {
  if (!image) {
    return '';
  }

  if (
    image.startsWith('http://') ||
    image.startsWith('https://')
  ) {
    return image;
  }

  if (image.startsWith('/uploads/')) {
    return `${API_URL}${image}`;
  }

  if (image.startsWith('/')) {
    return image;
  }

  return `${API_URL}/${image}`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AddProductModal({
  onClose,
  onAdd,
}: Props) {
  /* =======================================================
     IMAGE FILES
  ======================================================= */

  const [imageFiles, setImageFiles] =
    useState<File[]>([]);

  /* =======================================================
     IMAGE PREVIEWS
  ======================================================= */

  const [imagePreviews, setImagePreviews] =
    useState<string[]>([]);

  const previewUrlsRef =
    useRef<string[]>([]);

  /* =======================================================
     FORM
  ======================================================= */

  const [form, setForm] =
    useState<ProductForm>(
      initialForm
    );

  /* =======================================================
     UI STATES
  ======================================================= */

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  /* =======================================================
     SALE PRICE
  ======================================================= */

  const salePrice = useMemo(() => {
    const originalPrice =
      Number(form.price) || 0;

    const discount =
      Number(form.discount) || 0;

    if (originalPrice <= 0) {
      return 0;
    }

    const safeDiscount = Math.min(
      Math.max(discount, 0),
      100
    );

    return Math.round(
      originalPrice -
        (originalPrice * safeDiscount) / 100
    );
  }, [
    form.price,
    form.discount,
  ]);

  /* =======================================================
     IMAGE UPLOAD
  ======================================================= */

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setError('');

    const selectedFiles =
      Array.from(
        e.target.files || []
      );

    e.target.value = '';

    if (selectedFiles.length === 0) {
      return;
    }

    const remainingSlots =
      MAX_IMAGES - imageFiles.length;

    if (remainingSlots <= 0) {
      setError(
        `Maximum ${MAX_IMAGES} images are allowed.`
      );
      return;
    }

    const filesToProcess =
      selectedFiles.slice(
        0,
        remainingSlots
      );

    const validFiles: File[] = [];
    const validationMessages: string[] = [];

    for (const file of filesToProcess) {
      if (
        !ALLOWED_IMAGE_TYPES.includes(
          file.type
        )
      ) {
        validationMessages.push(
          `${file.name}: unsupported image type.`
        );
        continue;
      }

      if (
        file.size > MAX_FILE_SIZE
      ) {
        validationMessages.push(
          `${file.name}: image is larger than 10 MB.`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (
      validationMessages.length > 0
    ) {
      setError(
        validationMessages.join(' ')
      );
    }

    if (validFiles.length === 0) {
      return;
    }

    const newPreviews =
      validFiles.map(
        (file) =>
          URL.createObjectURL(file)
      );

    previewUrlsRef.current.push(
      ...newPreviews
    );

    setImageFiles(
      (prev) => [
        ...prev,
        ...validFiles,
      ]
    );

    setImagePreviews(
      (prev) => [
        ...prev,
        ...newPreviews,
      ]
    );
  };

  /* =======================================================
     REMOVE IMAGE
  ======================================================= */

  const removeImage = (
    index: number
  ) => {
    const preview =
      imagePreviews[index];

    if (
      preview &&
      preview.startsWith('blob:')
    ) {
      URL.revokeObjectURL(preview);

      previewUrlsRef.current =
        previewUrlsRef.current.filter(
          (url) => url !== preview
        );
    }

    setImageFiles(
      (prev) =>
        prev.filter(
          (_, i) => i !== index
        )
    );

    setImagePreviews(
      (prev) =>
        prev.filter(
          (_, i) => i !== index
        )
    );
  };

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm(
      (prev) => ({
        ...prev,
        [name]: value,
      })
    );

    setError('');
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm = () => {
    if (!form.name.trim()) {
      return 'Please enter product name.';
    }

    if (!form.category) {
      return 'Please select category.';
    }

    const originalPrice =
      Number(form.price);

    if (
      !form.price ||
      !Number.isFinite(
        originalPrice
      ) ||
      originalPrice < 0
    ) {
      return 'Please enter a valid original price.';
    }

    const discount =
      Number(
        form.discount || 0
      );

    if (
      !Number.isFinite(
        discount
      ) ||
      discount < 0 ||
      discount > 100
    ) {
      return 'Discount must be between 0 and 100%.';
    }

    const stock =
      Number(
        form.stock || 0
      );

    if (
      !Number.isFinite(
        stock
      ) ||
      stock < 0
    ) {
      return 'Stock cannot be negative.';
    }

    if (
      imageFiles.length === 0
    ) {
      return 'Please upload at least one product image.';
    }

    if (
      imageFiles.length > MAX_IMAGES
    ) {
      return `Maximum ${MAX_IMAGES} images are allowed.`;
    }

    return '';
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError('');

    /* =====================================================
       AUTH
    ===================================================== */

    const token =
      localStorage.getItem(
        'authToken'
      );

    const role =
      localStorage.getItem(
        'role'
      );

    if (
      !token ||
      role !== 'admin'
    ) {
      setError(
        'Admin authentication is required. Please login again.'
      );
      return;
    }

    /* =====================================================
       VALIDATION
    ===================================================== */

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    const originalPrice =
      Number(form.price);

    const discount =
      Number(
        form.discount || 0
      );

    const stock =
      Math.floor(
        Number(
          form.stock || 0
        )
      );

    /* =====================================================
       FORMDATA
    ===================================================== */

    const formData =
      new FormData();

    formData.append(
      'name',
      form.name.trim()
    );

    /*
      Existing backend expects:
      category
      type
      material
      price
      originalPrice
      discount
      stock
      quantity
      description
      moreInfo
      images
    */

    formData.append(
      'category',
      'clothing'
    );

    formData.append(
      'type',
      form.category
    );

    formData.append(
      'material',
      form.fabric
    );

    formData.append(
      'price',
      String(salePrice)
    );

    formData.append(
      'originalPrice',
      String(originalPrice)
    );

    formData.append(
      'discount',
      String(
        Math.round(discount)
      )
    );

    formData.append(
      'stock',
      String(stock)
    );

    formData.append(
      'quantity',
      String(stock)
    );

    formData.append(
      'description',
      form.description.trim()
    );

    if (form.occasion) {
      formData.append(
        'moreInfo',
        `Occasion: ${form.occasion}`
      );
    } else {
      formData.append(
        'moreInfo',
        ''
      );
    }

    /* =====================================================
       IMAGES
    ===================================================== */

    imageFiles.forEach(
      (file) => {
        formData.append(
          'images',
          file
        );
      }
    );

    /* =====================================================
       API REQUEST
    ===================================================== */

    try {
      setLoading(true);

      const response =
        await fetch(
          `${API_URL}/api/products`,
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,

            cache: 'no-store',
          }
        );

      /* ===================================================
         RESPONSE
      =================================================== */

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      /* ===================================================
         AUTH ERROR
      =================================================== */

      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          'authToken'
        );

        localStorage.removeItem(
          'role'
        );

        localStorage.removeItem(
          'currentUser'
        );

        window.dispatchEvent(
          new Event('auth-change')
        );

        throw new Error(
          'Your admin session has expired. Please login again.'
        );
      }

      /* ===================================================
         ADMIN ERROR
      =================================================== */

      if (
        response.status === 403
      ) {
        throw new Error(
          data?.message ||
            data?.error ||
            'Admin access required.'
        );
      }

      /* ===================================================
         OTHER API ERRORS

         IMPORTANT:
         Backend returns both:
         message
         error
      =================================================== */

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Failed to add product (${response.status}).`
        );
      }

      /* ===================================================
         SAVED PRODUCT
      =================================================== */

      const savedProduct =
        data?.product;

      if (!savedProduct) {
        throw new Error(
          'Product was created but the backend did not return the saved product.'
        );
      }

      /* ===================================================
         BACKEND IMAGES
      =================================================== */

      const backendImages =
        Array.isArray(
          savedProduct.images
        )
          ? savedProduct.images
              .filter(
                (
                  image: unknown
                ): image is string =>
                  typeof image ===
                  'string'
              )
              .map(
                (image: string) =>
                  resolveImageUrl(
                    image
                  )
              )
          : [];

      /* ===================================================
         NORMALIZED PRODUCT
      =================================================== */

      const normalizedProduct: Product = {
        id:
          String(
            savedProduct._id
          ),

        name:
          savedProduct.name ||
          form.name.trim(),

        category:
          savedProduct.type ||
          form.category,

        fabric:
          savedProduct.material ||
          form.fabric,

        occasion:
          form.occasion,

        price:
          Math.round(
            Number(
              savedProduct.originalPrice ??
              originalPrice
            )
          ),

        salePrice:
          Math.round(
            Number(
              savedProduct.price ??
              salePrice
            )
          ),

        discount:
          Math.round(
            Number(
              savedProduct.discount ??
              discount
            )
          ),

        stock:
          Math.floor(
            Number(
              savedProduct.stock ??
              stock
            )
          ),

        description:
          savedProduct.description ||
          form.description.trim(),

        images:
          backendImages,
      };

      /* ===================================================
         UPDATE PARENT
      =================================================== */

      onAdd(
        normalizedProduct
      );

      /* ===================================================
         CLEAN PREVIEWS
      =================================================== */

      previewUrlsRef.current.forEach(
        (url) => {
          URL.revokeObjectURL(url);
        }
      );

      previewUrlsRef.current =
        [];

      /* ===================================================
         RESET
      =================================================== */

      setForm(
        initialForm
      );

      setImageFiles([]);

      setImagePreviews([]);

      /* ===================================================
         CLOSE
      =================================================== */

      onClose();

    } catch (err) {
      console.error(
        'Add product error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to add product.'
      );

    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(
        (url) => {
          URL.revokeObjectURL(url);
        }
      );

      previewUrlsRef.current =
        [];
    };
  }, []);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="product-modal-overlay"
      onClick={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <div
        className="product-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* HEADER */}

        <div className="product-modal-header">
          <div>
            <span className="eyebrow">
              CATALOG MANAGEMENT
            </span>

            <h2>
              Add New Product
            </h2>
          </div>

          <button
            type="button"
            className="product-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              margin:
                '0 24px 20px',
              padding:
                '12px 14px',
              borderRadius:
                10,
              background:
                'rgba(118, 36, 56, 0.08)',
              color:
                '#762438',
              fontSize:
                13,
              lineHeight:
                1.5,
              wordBreak:
                'break-word',
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
        >
          {/* PRODUCT DETAILS */}

          <div className="admin-form-section">
            <h3>
              Product Details
            </h3>

            <div className="admin-form-grid">

              {/* PRODUCT NAME */}

              <div className="admin-field full">
                <label>
                  Product Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={
                    handleChange
                  }
                  placeholder="Example: Royal Banarasi Silk Saree"
                  required
                  disabled={loading}
                />
              </div>

              {/* CATEGORY */}

              <div className="admin-field">
                <label>
                  Category *
                </label>

                <select
                  name="category"
                  value={form.category}
                  onChange={
                    handleChange
                  }
                  required
                  disabled={loading}
                >
                  <option value="">
                    Select Category
                  </option>

                  <option value="Saree">
                    Saree
                  </option>

                  <option value="Lehenga">
                    Lehenga
                  </option>

                  <option value="Suit">
                    Suit
                  </option>

                  <option value="Dupatta">
                    Dupatta
                  </option>

                  <option value="Dress">
                    Dress
                  </option>
                </select>
              </div>

              {/* FABRIC */}

              <div className="admin-field">
                <label>
                  Fabric
                </label>

                <select
                  name="fabric"
                  value={form.fabric}
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                >
                  <option value="">
                    Select Fabric
                  </option>

                  <option value="Silk">
                    Silk
                  </option>

                  <option value="Cotton">
                    Cotton
                  </option>

                  <option value="Kanjivaram">
                    Kanjivaram
                  </option>

                  <option value="Banarasi">
                    Banarasi
                  </option>

                  <option value="Chiffon">
                    Chiffon
                  </option>

                  <option value="Georgette">
                    Georgette
                  </option>

                  <option value="Organza">
                    Organza
                  </option>
                </select>
              </div>

              {/* OCCASION */}

              <div className="admin-field">
                <label>
                  Occasion
                </label>

                <select
                  name="occasion"
                  value={form.occasion}
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                >
                  <option value="">
                    Select Occasion
                  </option>

                  <option value="Wedding">
                    Wedding
                  </option>

                  <option value="Festive">
                    Festive
                  </option>

                  <option value="Party Wear">
                    Party Wear
                  </option>

                  <option value="Daily Wear">
                    Daily Wear
                  </option>

                  <option value="Formal">
                    Formal
                  </option>
                </select>
              </div>

              {/* STOCK */}

              <div className="admin-field">
                <label>
                  Stock Quantity
                </label>

                <input
                  type="number"
                  name="stock"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={
                    handleChange
                  }
                  placeholder="20"
                  disabled={loading}
                />
              </div>

              {/* ORIGINAL PRICE */}

              <div className="admin-field">
                <label>
                  Original Price (₹) *
                </label>

                <input
                  type="number"
                  name="price"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={
                    handleChange
                  }
                  placeholder="2999"
                  required
                  disabled={loading}
                />
              </div>

              {/* DISCOUNT */}

              <div className="admin-field">
                <label>
                  Discount (%)
                </label>

                <input
                  type="number"
                  name="discount"
                  min="0"
                  max="100"
                  step="1"
                  value={form.discount}
                  onChange={
                    handleChange
                  }
                  placeholder="20"
                  disabled={loading}
                />
              </div>

              {/* SALE PRICE */}

              <div className="admin-field">
                <label>
                  Sale Price (₹)
                </label>

                <input
                  type="text"
                  value={
                    salePrice > 0
                      ? `₹ ${salePrice.toLocaleString(
                          'en-IN'
                        )}`
                      : '₹ 0'
                  }
                  readOnly
                  className="calculated-price"
                />

                {Number(
                  form.discount
                ) > 0 &&
                  Number(
                    form.price
                  ) > 0 && (
                    <small className="price-calculation-note">
                      {Math.round(
                        Number(
                          form.discount
                        )
                      )}
                      % discount applied
                    </small>
                  )}
              </div>

              {/* DESCRIPTION */}

              <div className="admin-field full">
                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  rows={5}
                  placeholder="Write product description..."
                  disabled={loading}
                />
              </div>

            </div>
          </div>

          {/* IMAGES */}

          <div className="admin-form-section">
            <h3>
              Product Images
            </h3>

            <p className="form-section-help">
              Upload up to 5 images. The first image
              will be used as the main product image.
            </p>

            <label
              className="image-upload-box"
              style={{
                pointerEvents:
                  loading
                    ? 'none'
                    : 'auto',
                opacity:
                  loading
                    ? 0.6
                    : 1,
              }}
            >
              <Upload size={30} />

              <strong>
                Upload Product Images
              </strong>

              <span>
                Select multiple images
              </span>

              <small>
                JPG, PNG, WebP or GIF ·
                Maximum 5 images ·
                10 MB each
              </small>

              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                onChange={
                  handleImageUpload
                }
                disabled={
                  loading ||
                  imageFiles.length >=
                    MAX_IMAGES
                }
              />
            </label>

            <div
              style={{
                marginTop:
                  10,
                fontSize:
                  12,
                color:
                  'var(--muted)',
              }}
            >
              {imageFiles.length}
              {' / '}
              {MAX_IMAGES}
              {' images selected'}
            </div>

            {imagePreviews.length > 0 && (
              <div className="product-image-preview">
                {imagePreviews.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      className="preview-image"
                      key={`${image}-${index}`}
                    >
                      <img
                        src={image}
                        alt={`Product image ${
                          index + 1
                        }`}
                      />

                      <button
                        type="button"
                        className="remove-preview-image"
                        onClick={() =>
                          removeImage(
                            index
                          )
                        }
                        disabled={
                          loading
                        }
                        aria-label="Remove image"
                      >
                        <Trash2
                          size={15}
                        />
                      </button>

                      {index === 0 && (
                        <span className="primary-image">
                          Main Image
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* ACTIONS */}

          <div className="product-modal-actions">
            <button
              type="button"
              className="admin-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="admin-add-product-btn"
              disabled={loading}
            >
              {loading
                ? 'Adding Product...'
                : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}