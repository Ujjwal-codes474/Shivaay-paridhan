'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';

import AddProductModal, {
  Product as NewProduct,
} from '../../../components/AddProductModal';

import EditProductModal from '../../../components/EditProductModal';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   ADMIN PRODUCT
========================================================= */

type AdminProduct = {
  id: string;
  name: string;
  category: string;
  fabric: string;
  occasion: string;
  price: number;
  salePrice: number;
  discount: number;
  stock: number;
  description: string;
  image?: string;
  images: string[];
};


/* =========================================================
   IMAGE URL
========================================================= */

function resolveImageUrl(
  image?: string
): string {

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


/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

function normalizeProduct(
  product: any
): AdminProduct {

  const originalPrice =
    Math.round(
      Number(
        product?.originalPrice ??
        product?.price ??
        0
      )
    );


  const salePrice =
    Math.round(
      Number(
        product?.price ??
        0
      )
    );


  const calculatedDiscount =
    originalPrice > 0
      ? Math.round(
          (
            (
              originalPrice -
              salePrice
            ) /
            originalPrice
          ) * 100
        )
      : 0;


  const discount =
    product?.discount !== undefined
      ? Number(
          product.discount
        )
      : calculatedDiscount;


  const rawImages =
    Array.isArray(
      product?.images
    )
      ? product.images.filter(
          (
            image: unknown
          ): image is string =>
            typeof image ===
            'string'
        )
      : [];


  const images =
    rawImages.map(
      resolveImageUrl
    );


  const category =
    product?.type ||
    product?.category ||
    '';


  let occasion =
    product?.occasion ||
    '';


  if (
    !occasion &&
    product?.moreInfo
  ) {

    const match =
      String(
        product.moreInfo
      ).match(
        /occasion\s*:\s*([^\n]+)/i
      );


    if (
      match?.[1]
    ) {

      occasion =
        match[1].trim();

    }

  }


  return {

    id:
      String(
        product?._id ??
        product?.id ??
        ''
      ),

    name:
      product?.name ||
      'Unnamed Product',

    category,

    fabric:
      product?.material ||
      '',

    occasion,

    price:
      originalPrice,

    salePrice:
      salePrice,

    discount:
      Math.round(
        discount
      ),

    stock:
      Math.max(
        0,
        Math.floor(
          Number(
            product?.stock ??
            product?.quantity ??
            0
          )
        )
      ),

    description:
      product?.description ||
      '',

    images,

    image:
      images[0] ||
      '',

  };

}


/* =========================================================
   PRODUCTS PAGE
========================================================= */

export default function ProductsPage() {

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const [products, setProducts] =
    useState<AdminProduct[]>(
      []
    );


  /* =======================================================
     LOADING
  ======================================================= */

  const [loading, setLoading] =
    useState(true);


  const [refreshing, setRefreshing] =
    useState(false);


  /* =======================================================
     ERROR
  ======================================================= */

  const [error, setError] =
    useState('');


  /* =======================================================
     SUCCESS MESSAGE
  ======================================================= */

  const [successMessage, setSuccessMessage] =
    useState('');


  /* =======================================================
     ADD MODAL
  ======================================================= */

  const [showAddProduct, setShowAddProduct] =
    useState(false);


  /* =======================================================
     EDIT MODAL
  ======================================================= */

  const [editingProduct, setEditingProduct] =
    useState<AdminProduct | null>(
      null
    );


  /* =======================================================
     DELETE
  ======================================================= */

  const [deletingId, setDeletingId] =
    useState<string | null>(
      null
    );


  /* =======================================================
     DELETE CONFIRMATION
  ======================================================= */

  const [productToDelete, setProductToDelete] =
    useState<AdminProduct | null>(
      null
    );


  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  const loadProducts =
    useCallback(
      async (
        isRefresh = false
      ) => {

        try {

          if (
            isRefresh
          ) {

            setRefreshing(
              true
            );

          } else {

            setLoading(
              true
            );

          }


          setError('');


          const response =
            await fetch(
              `${API_URL}/api/products`,
              {
                method:
                  'GET',

                headers: {
                  Accept:
                    'application/json',
                },

                cache:
                  'no-store',
              }
            );


          if (
            !response.ok
          ) {

            throw new Error(
              `Failed to load products (${response.status})`
            );

          }


          const data =
            await response.json();


          if (
            !Array.isArray(
              data
            )
          ) {

            throw new Error(
              'Invalid products response from backend.'
            );

          }


          const normalized =
            data
              .map(
                (
                  product: any
                ) =>
                  normalizeProduct(
                    product
                  )
              )
              .filter(
                (
                  product: AdminProduct
                ) =>
                  Boolean(
                    product.id
                  )
              );


          setProducts(
            normalized
          );

        } catch (
          err
        ) {

          console.error(
            'Product loading error:',
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load products.'
          );

        } finally {

          setLoading(
            false
          );

          setRefreshing(
            false
          );

        }

      },
      []
    );


  /* =======================================================
     AUTH CHECK
  ======================================================= */

  useEffect(() => {

    const token =
      localStorage.getItem(
        'authToken'
      );


    const role =
      localStorage.getItem(
        'role'
      );


    if (!token) {

      window.location.href =
        '/login';

      return;

    }


    if (
      role !== 'admin'
    ) {

      window.location.href =
        '/';

      return;

    }


    loadProducts();

  }, [
    loadProducts,
  ]);


  /* =======================================================
     AUTH EXPIRED
  ======================================================= */

  const handleAuthExpired = () => {

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


    window.location.href =
      '/login';

  };


  /* =======================================================
     ADD PRODUCT
  ======================================================= */

  const handleAddProduct = async (
    _product: NewProduct
  ) => {

    setShowAddProduct(
      false
    );


    setSuccessMessage(
      'Product added successfully.'
    );


    await loadProducts();


    window.setTimeout(
      () => {
        setSuccessMessage('');
      },
      3500
    );

  };


  /* =======================================================
     EDIT PRODUCT
  ======================================================= */

  const handleEditProduct = (
    product: AdminProduct
  ) => {

    setError('');

    setSuccessMessage('');

    setEditingProduct(
      product
    );

  };


  /* =======================================================
     CLOSE EDIT
  ======================================================= */

  const closeEditProduct = () => {

    setEditingProduct(
      null
    );

  };


  /* =======================================================
     OPEN DELETE CONFIRMATION
  ======================================================= */

  const handleDeleteProduct = (
    id: string
  ) => {

    const product =
      products.find(
        item =>
          item.id === id
      );


    if (!product) {
      return;
    }


    if (
      deletingId
    ) {
      return;
    }


    setError('');

    setSuccessMessage('');

    setProductToDelete(
      product
    );

  };


  /* =======================================================
     CLOSE DELETE CONFIRMATION
  ======================================================= */

  const closeDeleteConfirmation =
    () => {

      if (
        deletingId
      ) {
        return;
      }


      setProductToDelete(
        null
      );

    };


  /* =======================================================
     CONFIRM DELETE PRODUCT
  ======================================================= */

  const confirmDeleteProduct =
    async () => {

      if (
        !productToDelete ||
        deletingId
      ) {

        return;

      }


      const id =
        productToDelete.id;


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

        setProductToDelete(
          null
        );


        setError(
          'Please login as admin before deleting products.'
        );


        return;

      }


      try {

        setDeletingId(
          id
        );

        setError('');

        setSuccessMessage('');


        const response =
          await fetch(
            `${API_URL}/api/products/${id}`,
            {
              method:
                'DELETE',

              headers: {
                Authorization:
                  `Bearer ${token}`,

                Accept:
                  'application/json',
              },

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

          data =
            null;

        }


        if (
          response.status ===
          401
        ) {

          setProductToDelete(
            null
          );

          handleAuthExpired();

          return;

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
            'Failed to delete product.'
          );

        }


        setProductToDelete(
          null
        );


        await loadProducts(
          true
        );


        setSuccessMessage(
          data?.message ||
          'Product deleted successfully.'
        );


        window.setTimeout(
          () => {
            setSuccessMessage('');
          },
          3500
        );


      } catch (
        err
      ) {

        console.error(
          'Delete product error:',
          err
        );


        setProductToDelete(
          null
        );


        setError(
          err instanceof Error
            ? err.message
            : 'Product could not be deleted.'
        );

      } finally {

        setDeletingId(
          null
        );

      }

    };


  /* =======================================================
     OPEN ADD
  ======================================================= */

  const openAddProduct = () => {

    setError('');

    setSuccessMessage('');

    setShowAddProduct(
      true
    );

  };


  /* =======================================================
     CLOSE ADD
  ======================================================= */

  const closeAddProduct = () => {

    setShowAddProduct(
      false
    );

  };


  /* =======================================================
     FORMAT PRICE
  ======================================================= */

  const formatPrice = (
    value: number
  ) => {

    return value.toLocaleString(
      'en-IN'
    );

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <main className="admin-products-page">


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <section
        className="admin-products-toolbar"
      >

        <div>

          <span className="eyebrow">
            CATALOG MANAGEMENT
          </span>


          <h1>
            Products
          </h1>


          <p className="admin-products-subtitle">

            {loading
              ? 'Loading products...'
              : `${products.length} products in catalog`}

          </p>

        </div>


        <div
          style={{
            display:
              'flex',

            alignItems:
              'center',

            gap:
              8,

            flexWrap:
              'wrap',
          }}
        >

          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              loadProducts(true)
            }
            disabled={
              loading ||
              refreshing
            }
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                7,
            }}
          >

            <RefreshCw
              size={16}
            />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}

          </button>


          <button
            type="button"
            className="add-product-btn"
            onClick={
              openAddProduct
            }
          >

            <Plus
              size={18}
            />

            <span>
              Add Product
            </span>

          </button>

        </div>

      </section>


      {/* =================================================
          SUCCESS
      ================================================= */}

      {successMessage && (

        <div
          className="admin-products-success"
          role="status"
        >

          <CheckCircle2
            size={17}
          />

          <span>
            {successMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage('')
            }
            aria-label="Close message"
          >

            <X
              size={15}
            />

          </button>

        </div>

      )}


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div
          className="admin-products-error"
        >

          <span>
            {error}
          </span>


          <button
            type="button"
            onClick={() =>
              loadProducts(true)
            }
          >
            Retry
          </button>

        </div>

      )}


      {/* =================================================
          PRODUCTS
      ================================================= */}

      <section
        className="products-table-wrapper"
      >

        {loading ? (

          <div
            className="products-loading"
          >

            <div
              className="products-loading-spinner"
            />

            <p>
              Loading products...
            </p>

          </div>

        ) : products.length === 0 ? (

          <div
            className="products-empty-state"
          >

            <div
              className="empty-icon"
            >

              <Plus
                size={28}
              />

            </div>


            <h3>
              No Products Found
            </h3>


            <p>
              Your backend currently has no products.
            </p>


            <button
              type="button"
              className="add-product-btn"
              onClick={
                openAddProduct
              }
            >

              <Plus
                size={18}
              />

              <span>
                Add Product
              </span>

            </button>

          </div>

        ) : (

          <div
            className="products-table-scroll"
          >

            <table
              className="products-table"
            >

              <thead>

                <tr>

                  <th>
                    PRODUCT
                  </th>

                  <th>
                    CATEGORY
                  </th>

                  <th>
                    PRICE
                  </th>

                  <th>
                    STOCK
                  </th>

                  <th>
                    ACTION
                  </th>

                </tr>

              </thead>


              <tbody>

                {products.map(
                  (
                    product
                  ) => (

                    <tr
                      key={
                        product.id
                      }
                    >

                      {/* PRODUCT */}

                      <td>

                        <div
                          className="admin-product-info"
                        >

                          {product.images.length > 0 ? (

                            <img
                              src={
                                product.images[0]
                              }
                              alt={
                                product.name
                              }
                              className="admin-product-thumb"
                            />

                          ) : (

                            <div
                              className="admin-product-placeholder"
                            >

                              <span>
                                SP
                              </span>

                            </div>

                          )}


                          <div
                            className="admin-product-details"
                          >

                            <strong>
                              {
                                product.name
                              }
                            </strong>


                            {product.description && (

                              <small>
                                {
                                  product.description
                                }
                              </small>

                            )}

                          </div>

                        </div>

                      </td>


                      {/* CATEGORY */}

                      <td>

                        {
                          product.category ||
                          '—'
                        }

                      </td>


                      {/* PRICE */}

                      <td>

                        <div
                          className="admin-price"
                        >

                          <strong>
                            ₹
                            {formatPrice(
                              product.salePrice
                            )}
                          </strong>


                          {product.salePrice !==
                            product.price && (

                            <del>
                              ₹
                              {formatPrice(
                                product.price
                              )}
                            </del>

                          )}

                        </div>

                      </td>


                      {/* STOCK */}

                      <td>

                        <span
                          className={
                            product.stock > 0
                              ? 'stock-available'
                              : 'stock-out'
                          }
                        >
                          {
                            product.stock
                          }
                        </span>

                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div
                          style={{
                            display:
                              'flex',

                            alignItems:
                              'center',

                            gap:
                              8,

                            flexWrap:
                              'wrap',
                          }}
                        >

                          {/* EDIT */}

                          <button
                            type="button"
                            className="edit-product-btn"
                            onClick={() =>
                              handleEditProduct(
                                product
                              )
                            }
                            disabled={
                              deletingId ===
                              product.id
                            }
                            title="Edit product"
                            aria-label={
                              `Edit ${product.name}`
                            }
                            style={{
                              display:
                                'inline-flex',

                              alignItems:
                                'center',

                              gap:
                                6,
                            }}
                          >

                            <Pencil
                              size={16}
                            />

                            <span>
                              Edit
                            </span>

                          </button>


                          {/* DELETE */}

                          <button
                            type="button"
                            className="delete-product-btn"
                            onClick={() =>
                              handleDeleteProduct(
                                product.id
                              )
                            }
                            disabled={
                              deletingId ===
                              product.id
                            }
                            title="Delete product"
                            aria-label={
                              `Delete ${product.name}`
                            }
                            style={{
                              display:
                                'inline-flex',

                              alignItems:
                                'center',

                              gap:
                                6,
                            }}
                          >

                            <Trash2
                              size={16}
                            />

                            <span>
                              Delete
                            </span>

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* =================================================
          ADD PRODUCT MODAL
      ================================================= */}

      {showAddProduct && (

        <AddProductModal
          onClose={
            closeAddProduct
          }
          onAdd={
            handleAddProduct
          }
        />

      )}


      {/* =================================================
          EDIT PRODUCT MODAL
      ================================================= */}

      {editingProduct && (

        <EditProductModal
          product={
            editingProduct
          }
          onClose={
            closeEditProduct
          }
          onUpdated={
            async () => {

              await loadProducts(
                true
              );

              setSuccessMessage(
                'Product updated successfully.'
              );

              window.setTimeout(
                () => {
                  setSuccessMessage('');
                },
                3500
              );

            }
          }
        />

      )}


      {/* =================================================
          DELETE PRODUCT CONFIRMATION MODAL
      ================================================= */}

      {productToDelete && (

        <div
          className="admin-product-delete-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
          onMouseDown={(
            event
          ) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closeDeleteConfirmation();

            }

          }}
        >

          <div
            className="admin-product-delete-modal"
            onMouseDown={(
              event
            ) => {

              event.stopPropagation();

            }}
          >

            <button
              type="button"
              className="admin-product-delete-close"
              onClick={
                closeDeleteConfirmation
              }
              disabled={
                Boolean(
                  deletingId
                )
              }
              aria-label="Close"
            >

              <X
                size={17}
              />

            </button>


            <div
              className="admin-product-delete-icon"
            >

              <Trash2
                size={25}
              />

            </div>


            <span className="eyebrow">
              Catalog action
            </span>


            <h2
              id="delete-product-title"
            >
              Delete this product?
            </h2>


            <p>
              You are about to permanently delete
              <strong>
                {' '}
                “{productToDelete.name}”
              </strong>
              {' '}
              from the Shivaay Paridhan catalog.
            </p>


            <div
              className="admin-product-delete-preview"
            >

              {productToDelete.image ? (

                <img
                  src={
                    productToDelete.image
                  }
                  alt={
                    productToDelete.name
                  }
                />

              ) : (

                <div>
                  SP
                </div>

              )}


              <span>
                {productToDelete.name}
              </span>

            </div>


            <div
              className="admin-product-delete-actions"
            >

              <button
                type="button"
                className="admin-product-delete-cancel"
                onClick={
                  closeDeleteConfirmation
                }
                disabled={
                  Boolean(
                    deletingId
                  )
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="admin-product-delete-confirm"
                onClick={
                  confirmDeleteProduct
                }
                disabled={
                  Boolean(
                    deletingId
                  )
                }
              >

                {deletingId ? (

                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />

                    Deleting...
                  </>

                ) : (

                  <>
                    <Trash2
                      size={16}
                    />

                    Delete Product
                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </main>

  );

}