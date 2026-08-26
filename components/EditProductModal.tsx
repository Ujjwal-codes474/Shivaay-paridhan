'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  X,
  Upload,
  Trash2,
} from 'lucide-react';


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


type Product = {
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


type Props = {
  product: Product;
  onClose: () => void;
  onUpdated: () => Promise<void>;
};


type FormState = {
  name: string;
  category: string;
  fabric: string;
  occasion: string;
  price: string;
  discount: string;
  stock: string;
  description: string;
};


const MAX_IMAGES = 5;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];


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

  if (
    image.startsWith('/uploads/')
  ) {
    return `${API_URL}${image}`;
  }

  if (
    image.startsWith('/')
  ) {
    return image;
  }

  return `${API_URL}/${image}`;
}


export default function EditProductModal({
  product,
  onClose,
  onUpdated,
}: Props) {

  const [form, setForm] =
    useState<FormState>({
      name: product.name || '',
      category: product.category || 'Saree',
      fabric: product.fabric || '',
      occasion: product.occasion || '',
      price: String(product.price || ''),
      discount: String(product.discount || ''),
      stock: String(product.stock || 0),
      description: product.description || '',
    });


  const [newFiles, setNewFiles] =
    useState<File[]>([]);


  const [previews, setPreviews] =
    useState<string[]>(
      (product.images || []).map(
        resolveImageUrl
      )
    );


  const [replaceImages, setReplaceImages] =
    useState(false);


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState('');


  const salePrice = useMemo(() => {

    const original =
      Number(form.price) || 0;

    const discount =
      Number(form.discount) || 0;

    if (original <= 0) {
      return 0;
    }

    return Math.round(
      original -
      (
        original *
        Math.min(
          Math.max(
            discount,
            0
          ),
          100
        )
      ) /
        100
    );

  }, [
    form.price,
    form.discount,
  ]);


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
      prev => ({
        ...prev,
        [name]: value,
      })
    );

    setError('');

  };


  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    setError('');

    const files =
      Array.from(
        e.target.files || []
      );

    e.target.value = '';

    if (
      !files.length
    ) {
      return;
    }

    if (
      files.length > MAX_IMAGES
    ) {

      setError(
        `Maximum ${MAX_IMAGES} images are allowed.`
      );

      return;
    }


    const validFiles =
      files.filter(
        file =>
          ALLOWED_TYPES.includes(
            file.type
          )
      );


    if (
      validFiles.length !==
      files.length
    ) {

      setError(
        'Only JPG, PNG, WebP or GIF images are allowed.'
      );

      return;
    }


    setNewFiles(
      validFiles.slice(
        0,
        MAX_IMAGES
      )
    );


    const urls =
      validFiles
        .slice(
          0,
          MAX_IMAGES
        )
        .map(
          file =>
            URL.createObjectURL(
              file
            )
        );


    setPreviews(
      urls
    );


    setReplaceImages(
      true
    );

  };


  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault();

      setError('');


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
          'Admin authentication is required.'
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


      if (
        !form.name.trim()
      ) {

        setError(
          'Please enter product name.'
        );

        return;
      }


      if (
        !Number.isFinite(
          originalPrice
        ) ||
        originalPrice < 0
      ) {

        setError(
          'Please enter a valid price.'
        );

        return;
      }


      if (
        !Number.isFinite(
          discount
        ) ||
        discount < 0 ||
        discount > 100
      ) {

        setError(
          'Discount must be between 0 and 100%.'
        );

        return;
      }


      if (
        stock < 0
      ) {

        setError(
          'Stock cannot be negative.'
        );

        return;
      }


      try {

        setLoading(true);


        const formData =
          new FormData();


        formData.append(
          'name',
          form.name.trim()
        );


        /*
          Existing backend expects:
          category = clothing
          type = product category
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
            Math.round(
              discount
            )
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


        if (
          form.occasion
        ) {

          formData.append(
            'moreInfo',
            `Occasion: ${form.occasion}`
          );

        }


        /*
          Important:
          Backend replaces ALL old images when
          new images are uploaded.
        */

        if (
          replaceImages &&
          newFiles.length > 0
        ) {

          newFiles.forEach(
            file => {

              formData.append(
                'images',
                file
              );

            }
          );

        }


        const response =
          await fetch(
            `${API_URL}/api/products/${product.id}`,
            {
              method:
                'PUT',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body:
                formData,

              cache:
                'no-store',
            }
          );


        let data: any =
          null;


        try {

          data =
            await response.json();

        } catch {

          data = null;

        }


        if (
          response.status ===
          401
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
            new Event(
              'auth-change'
            )
          );

          throw new Error(
            'Your admin session has expired. Please login again.'
          );

        }


        if (
          response.status ===
          403
        ) {

          throw new Error(
            data?.message ||
            'Admin access required.'
          );

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            'Failed to update product.'
          );

        }


        await onUpdated();

        onClose();

      } catch (err) {

        console.error(
          'Edit product error:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to update product.'
        );

      } finally {

        setLoading(
          false
        );

      }

    };


  useEffect(() => {

    return () => {

      previews.forEach(
        preview => {

          if (
            preview.startsWith(
              'blob:'
            )
          ) {

            URL.revokeObjectURL(
              preview
            );

          }

        }
      );

    };

  }, [previews]);


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
        onClick={e =>
          e.stopPropagation()
        }
      >

        <div className="product-modal-header">

          <div>

            <span className="eyebrow">
              CATALOG MANAGEMENT
            </span>

            <h2>
              Edit Product
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
                'rgba(118,36,56,.08)',
              color:
                '#762438',
              fontSize:
                13,
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

          <div className="admin-form-section">

            <h3>
              Product Details
            </h3>


            <div className="admin-form-grid">

              <div className="admin-field full">

                <label>
                  Product Name *
                </label>

                <input
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                  required
                />

              </div>


              <div className="admin-field">

                <label>
                  Category *
                </label>

                <select
                  name="category"
                  value={
                    form.category
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                >

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


              <div className="admin-field">

                <label>
                  Fabric
                </label>

                <select
                  name="fabric"
                  value={
                    form.fabric
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
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


              <div className="admin-field">

                <label>
                  Occasion
                </label>

                <select
                  name="occasion"
                  value={
                    form.occasion
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
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


              <div className="admin-field">

                <label>
                  Stock Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  name="stock"
                  value={
                    form.stock
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                />

              </div>


              <div className="admin-field">

                <label>
                  Original Price (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  name="price"
                  value={
                    form.price
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                />

              </div>


              <div className="admin-field">

                <label>
                  Discount (%)
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  name="discount"
                  value={
                    form.discount
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                />

              </div>


              <div className="admin-field">

                <label>
                  Sale Price (₹)
                </label>

                <input
                  className="calculated-price"
                  value={
                    salePrice > 0
                      ? `₹ ${salePrice.toLocaleString('en-IN')}`
                      : '₹ 0'
                  }
                  readOnly
                />

              </div>


              <div className="admin-field full">

                <label>
                  Description
                </label>

                <textarea
                  rows={5}
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    loading
                  }
                />

              </div>

            </div>

          </div>


          <div className="admin-form-section">

            <h3>
              Product Images
            </h3>

            <p className="form-section-help">
              Upload new images only when you want
              to replace all existing images.
            </p>


            <label
              className="image-upload-box"
              style={{
                opacity:
                  loading
                    ? 0.6
                    : 1,
                pointerEvents:
                  loading
                    ? 'none'
                    : 'auto',
              }}
            >

              <Upload
                size={30}
              />

              <strong>
                Replace Product Images
              </strong>

              <span>
                Select up to 5 new images
              </span>

              <small>
                JPG, PNG, WebP or GIF
              </small>

              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                onChange={
                  handleImageUpload
                }
                disabled={
                  loading
                }
              />

            </label>


            {previews.length > 0 && (

              <div className="product-image-preview">

                {previews.map(
                  (
                    image,
                    index
                  ) => (

                    <div
                      className="preview-image"
                      key={
                        `${image}-${index}`
                      }
                    >

                      <img
                        src={
                          image
                        }
                        alt={
                          `Product image ${index + 1}`
                        }
                      />

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


          <div className="product-modal-actions">

            <button
              type="button"
              className="admin-cancel-btn"
              onClick={
                onClose
              }
              disabled={
                loading
              }
            >
              Cancel
            </button>


            <button
              type="submit"
              className="admin-add-product-btn"
              disabled={
                loading
              }
            >
              {loading
                ? 'Saving Changes...'
                : 'Save Changes'}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}