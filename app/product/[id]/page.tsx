'use client';

import {
  use,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';

import { useCart } from '../../../store/useCart';
import { useWishlist } from '../../../store/useWishlist';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   WHATSAPP
========================================================= */

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
  '';


/* =========================================================
   PARAMS
========================================================= */

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};


/* =========================================================
   BACKEND PRODUCT TYPE
========================================================= */

type BackendProduct = {
  _id: string;

  name?: string;

  price?: number;

  originalPrice?: number;

  images?: string[];

  category?: string;

  material?: string;

  type?: string;

  color?: string;

  colors?: string[];

  occasion?: string;

  description?: string;

  discount?: number;

  stock?: number;

  quantity?: number;

  rating?: number;

  featured?: boolean;

  slug?: string;

  specifications?: string;

  productCare?: string;

  moreInfo?: string;

  offerLabel?: string;

  offerDiscount?: number;

  offerStartDate?: string | null;

  offerEndDate?: string | null;
};


/* =========================================================
   DISPLAY PRODUCT
========================================================= */

type DisplayProduct = {
  id: string;

  slug: string;

  name: string;

  price: number;

  oldPrice?: number;

  category: string;

  fabric: string;

  color: string;

  occasion: string;

  description: string;

  images: string[];

  image?: string;

  rating: number;

  stock: number;

  featured?: boolean;

  specifications?: string;

  productCare?: string;

  moreInfo?: string;

  offerLabel?: string;

  offerDiscount?: number;

  offerStartDate?: string | null;

  offerEndDate?: string | null;
};


/* =========================================================
   IMAGE URL
========================================================= */

function resolveImageUrl(
  image?: string
): string {

  if (!image) {
    return '/hero-slider.png';
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
   CREATE SLUG
========================================================= */

function createSlug(
  name: string
): string {

  return String(
    name || ''
  )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      '');
}


/* =========================================================
   OCCASION
========================================================= */

function getOccasion(
  product: BackendProduct
): string {

  if (
    product.occasion &&
    String(
      product.occasion
    ).trim()
  ) {
    return String(
      product.occasion
    ).trim();
  }

  if (
    product.moreInfo
  ) {

    const match =
      String(
        product.moreInfo
      ).match(
        /occasion\s*:\s*([^\n\r]+)/i
      );

    if (
      match?.[1]
    ) {
      return match[1].trim();
    }
  }

  return '';
}


/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

function normalizeProduct(
  product: BackendProduct
): DisplayProduct {

  const images =
    Array.isArray(
      product.images
    )
      ? product.images.filter(
          (
            image
          ): image is string =>
            typeof image === 'string'
        )
      : [];

  const originalPrice =
    Math.round(
      Number(
        product.originalPrice ??
        product.price ??
        0
      )
    );

  const salePrice =
    Math.round(
      Number(
        product.price ??
        0
      )
    );

  const rating =
    Number(
      product.rating ??
      0
    );

  const color =
    product.color ||
    (
      Array.isArray(
        product.colors
      ) &&
      product.colors.length > 0
        ? String(
            product.colors[0]
          )
        : ''
    );

  const occasion =
    getOccasion(
      product
    );

  const slug =
    product.slug ||
    createSlug(
      product.name ||
      ''
    ) ||
    String(
      product._id
    );

  return {

    id:
      String(
        product._id
      ),

    slug:
      String(
        slug
      ),

    name:
      product.name ||
      'Untitled Product',

    price:
      salePrice,

    oldPrice:
      originalPrice >
      salePrice
        ? originalPrice
        : undefined,

    category:
      product.type ||
      product.category ||
      'Sarees',

    fabric:
      product.material ||
      '',

    color,

    occasion,

    description:
      product.description ||
      '',

    images:
      images.map(
        resolveImageUrl
      ),

    image:
      resolveImageUrl(
        images[0]
      ),

    rating,

    stock:
      Math.max(
        0,
        Math.floor(
          Number(
            product.stock ??
            product.quantity ??
            0
          )
        )
      ),

    featured:
      Boolean(
        product.featured
      ),

    specifications:
      product.specifications ||
      '',

    productCare:
      product.productCare ||
      '',

    moreInfo:
      product.moreInfo ||
      '',

    offerLabel:
      product.offerLabel ||
      '',

    offerDiscount:
      Number(
        product.offerDiscount ||
        0
      ),

    offerStartDate:
      product.offerStartDate ??
      null,

    offerEndDate:
      product.offerEndDate ??
      null,

  };
}


/* =========================================================
   PRODUCT PAGE
========================================================= */

export default function ProductPage({
  params,
}: ProductPageProps) {

  const {
    id,
  } = use(params);


  /* =======================================================
     PRODUCT
  ======================================================= */

  const [product, setProduct] =
    useState<
      DisplayProduct | null
    >(null);


  const [selectedImage, setSelectedImage] =
    useState('');


  /* =======================================================
     LOADING
  ======================================================= */

  const [loading, setLoading] =
    useState(true);


  /* =======================================================
     ERROR
  ======================================================= */

  const [error, setError] =
    useState('');


  /* =======================================================
     QUANTITY
  ======================================================= */

  const [qty, setQty] =
    useState(1);


  /* =======================================================
     CART
  ======================================================= */

  const addToCart =
    useCart(
      (state) =>
        state.add
    );


  /* =======================================================
     WISHLIST
  ======================================================= */

  const liked =
    useWishlist(
      (state) =>
        product
          ? state.ids.includes(
              product.id
            )
          : false
    );


  const toggleWishlist =
    useWishlist(
      (state) =>
        state.toggle
    );


  /* =======================================================
     LOAD PRODUCT
  ======================================================= */

  useEffect(() => {

    let cancelled =
      false;


    const loadProduct =
      async () => {

        try {

          setLoading(
            true
          );

          setError(
            ''
          );

          setProduct(
            null
          );


          const requestedId =
            String(
              id || ''
            ).trim();


          if (
            !requestedId
          ) {

            throw new Error(
              'Product ID is missing.'
            );

          }


          const objectIdPattern =
            /^[a-f\d]{24}$/i;


          /* ===============================================
             STEP 1
             TRY DIRECT PRODUCT ID API
          =============================================== */

          if (
            objectIdPattern.test(
              requestedId
            )
          ) {

            try {

              const response =
                await fetch(
                  `${API_URL}/api/products/${encodeURIComponent(
                    requestedId
                  )}`,
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
                response.ok
              ) {

                const data =
                  await response.json();


                const backendProduct =
                  data?.product ||
                  data;


                if (
                  !backendProduct?._id
                ) {

                  throw new Error(
                    'Invalid product response from backend.'
                  );

                }


                if (
                  !cancelled
                ) {

                  setProduct(
                    normalizeProduct(
                      backendProduct
                    )
                  );

                  setError(
                    ''
                  );

                }


                return;

              }


              /*
                If direct ID route is unavailable,
                continue with all-products fallback.
              */

              if (
                response.status !==
                404
              ) {

                let message =
                  `Failed to load product (${response.status})`;


                try {

                  const data =
                    await response.json();

                  message =
                    data?.message ||
                    message;

                } catch {
                  // Ignore malformed response.
                }


                throw new Error(
                  message
                );

              }

            } catch (
              directError
            ) {

              const directMessage =
                directError instanceof Error
                  ? directError.message
                  : String(
                      directError
                    );


              if (
                !/404|not found/i.test(
                  directMessage
                )
              ) {

                console.warn(
                  'Direct product lookup failed. Trying fallback.',
                  directError
                );

              }

            }

          }


          /* ===============================================
             STEP 2
             FALLBACK: LOAD ALL PRODUCTS
          =============================================== */

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

            let message =
              `Failed to load products (${response.status})`;


            try {

              const data =
                await response.json();

              message =
                data?.message ||
                message;

            } catch {
              // Ignore malformed response.
            }


            throw new Error(
              message
            );

          }


          const data =
            await response.json();


          const products =
            Array.isArray(
              data
            )
              ? data
              : Array.isArray(
                  data?.products
                )
                ? data.products
                : null;


          if (
            !Array.isArray(
              products
            )
          ) {

            throw new Error(
              'Invalid products response from backend.'
            );

          }


          /* ===============================================
             STEP 3
             MATCH PRODUCT ID
          =============================================== */

          const matched =
            products.find(
              (
                item: BackendProduct
              ) => {

                return (
                  String(
                    item?._id ||
                    ''
                  ).trim() ===
                  requestedId
                );

              }
            );


          if (
            !matched
          ) {

            /*
              The explicit [id] route expects
              a MongoDB product ID.
            */

            throw new Error(
              'Product not found.'
            );

          }


          if (
            !cancelled
          ) {

            setProduct(
              normalizeProduct(
                matched
              )
            );

            setError(
              ''
            );

          }

        } catch (
          err
        ) {

          console.error(
            'Product detail loading error:',
            err
          );


          if (
            !cancelled
          ) {

            setError(
              err instanceof Error
                ? err.message
                : 'Unable to load product.'
            );

          }

        } finally {

          if (
            !cancelled
          ) {

            setLoading(
              false
            );

          }

        }

      };


    loadProduct();


    return () => {

      cancelled =
        true;

    };

  }, [id]);


  /* =======================================================
     STOCK
  ======================================================= */

  const outOfStock =
    !product ||
    product.stock <=
      0;


  const maxQuantity =
    product
      ? Math.max(
          1,
          product.stock
        )
      : 1;


  /* =======================================================
     KEEP QUANTITY SAFE
  ======================================================= */

  useEffect(() => {

    if (
      product &&
      product.stock > 0
    ) {

      setQty(
        current =>
          Math.min(
            Math.max(
              1,
              current
            ),
            product.stock
          )
      );

    }

  }, [product]);


  /* =======================================================
     DISCOUNT
  ======================================================= */

  const discount =
    useMemo(() => {

      if (
        !product?.oldPrice ||
        product.oldPrice <=
          product.price
      ) {

        return 0;

      }


      return Math.round(
        (
          (
            product.oldPrice -
            product.price
          ) /
          product.oldPrice
        ) *
        100
      );

    }, [product]);


  /* =======================================================
     WHATSAPP
  ======================================================= */

  const whatsappMessage =
    product
      ? [
          'Hi Shivaay Paridhan,',
          '',
          `I want to order: ${product.name}`,
          `Product ID: ${product.id}`,
          `Quantity: ${qty}`,
          `Price: ₹${product.price.toLocaleString(
            'en-IN'
          )}`,
          '',
          'Please confirm availability.',
        ].join('\n')
      : '';


  const whatsappUrl =
    product &&
    WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
          whatsappMessage
        )}`
      : '#';


  /* =======================================================
     ADD TO BAG
  ======================================================= */

  const handleAddToBag =
    () => {

      if (
        !product ||
        product.stock <=
          0
      ) {

        return;

      }


      for (
        let i = 0;
        i < qty;
        i += 1
      ) {

        addToCart(
          product as any
        );

      }

    };


  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {

    return (

      <main className="page">

        <div className="container">

          <div
            className="card"
            style={{
              padding:
                48,

              minHeight:
                240,

              display:
                'grid',

              placeItems:
                'center',

              textAlign:
                'center',
            }}
          >

            <p className="muted">
              Loading product...
            </p>

          </div>

        </div>

      </main>

    );

  }


  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (
    error ||
    !product
  ) {

    return (

      <main className="page">

        <div className="container">

          <div
            className="card"
            style={{
              padding:
                48,

              textAlign:
                'center',
            }}
          >

            <h1
              className="serif text-3xl"
            >
              Product not found
            </h1>


            <p className="muted mt-2">
              {error ||
                'This product is no longer available.'}
            </p>


            <Link
              className="btn btn-primary mt-5"
              href="/shop"
            >
              Back to shop
            </Link>

          </div>

        </div>

      </main>

    );

  }


  /* =======================================================
     MAIN IMAGE
  ======================================================= */

  const productImages =
    product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : ['/hero-slider.png'];


  const mainImage =
    selectedImage ||
    productImages[0];


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <main className="page">

      <div className="container">


        {/* =================================================
            BACK TO SHOP
        ================================================= */}

        <Link
          href="/shop"
          className="text-link"
          style={{
            display:
              'inline-block',

            marginBottom:
              22,
          }}
        >
          ← Back to Shop
        </Link>


        {/* =================================================
            MAIN PRODUCT AREA
        ================================================= */}

        <div className="detail">


          {/* IMAGE */}

          <div className="detail-image-gallery">

            <div className="detail-main">

              <img
                src={mainImage}
                alt={product.name}
              />

            </div>


            {productImages.length > 1 && (

              <div className="detail-image-thumbnails">

                {productImages.map(
                  (image, index) => (

                    <button
                      key={`${image}-${index}`}
                      type="button"
                      className={`detail-image-thumbnail ${
                        mainImage === image
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        setSelectedImage(image)
                      }
                    >

                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                      />

                    </button>

                  )
                )}

              </div>

            )}

          </div>


          {/* PRODUCT INFORMATION */}

          <div>


            {/* CATEGORY / FABRIC */}

            <div className="eyebrow">

              {product.occasion ||
                product.category}

              {product.fabric && (
                <>
                  {' · '}
                  {product.fabric}
                </>
              )}

            </div>


            {/* NAME */}

            <h1>
              {product.name}
            </h1>


            {/* RATING */}

            {product.rating > 0 && (

              <div
                className="mb-3 flex items-center gap-2 text-sm"
              >

                <Star
                  size={16}
                  fill="#c7a35a"
                  color="#c7a35a"
                />

                {product.rating}

                {' · Product rating'}

              </div>

            )}


            {/* PRICE */}

            <div className="detail-price">

              <span>
                ₹
                {Math.round(
                  product.price
                ).toLocaleString(
                  'en-IN'
                )}
              </span>


              {product.oldPrice && (

                <span className="old-price">
                  ₹
                  {Math.round(
                    product.oldPrice
                  ).toLocaleString(
                    'en-IN'
                  )}
                </span>

              )}


              {discount > 0 && (

                <span className="discount-percent">
                  {discount}% OFF
                </span>

              )}

            </div>


            {/* DESCRIPTION */}

            <p
              className="muted mt-5 text-[16px] leading-7"
            >

              {product.description ||
                'A refined Shivaay Paridhan creation designed for elegant occasions.'}

            </p>


            {/* OFFER */}

            {product.offerLabel && (

              <div
                className="card"
                style={{
                  marginTop:
                    18,

                  padding:
                    14,

                  background:
                    '#f6eee2',
                }}
              >

                <strong>
                  {product.offerLabel}
                </strong>


                {product.offerDiscount &&
                  product.offerDiscount >
                    0 && (

                    <span
                      className="muted"
                      style={{
                        marginLeft:
                          8,

                        fontSize:
                          13,
                      }}
                    >
                      Additional{' '}
                      {product.offerDiscount}%
                      offer
                    </span>

                  )}

              </div>

            )}


            {/* STOCK */}

            {outOfStock ? (

              <div
                className="mt-5"
                style={{
                  padding:
                    '10px 12px',

                  borderRadius:
                    10,

                  background:
                    'rgba(118,36,56,.08)',

                  color:
                    '#762438',

                  fontSize:
                    13,

                  fontWeight:
                    600,
                }}
              >
                This product is currently sold out.
              </div>

            ) : (

              product.stock <= 5 && (

                <div
                  className="mt-5"
                  style={{
                    fontSize:
                      12,

                    color:
                      '#762438',

                    fontWeight:
                      600,
                  }}
                >
                  Only {product.stock} left in stock
                </div>

              )

            )}


            {/* QUANTITY */}

            <div
              className="mt-6 flex items-center gap-3"
            >

              <div className="qty">

                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() =>
                    setQty(
                      Math.max(
                        1,
                        qty - 1
                      )
                    )
                  }
                  disabled={
                    outOfStock ||
                    qty <= 1
                  }
                >

                  <Minus
                    size={16}
                  />

                </button>


                <span>
                  {qty}
                </span>


                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() =>
                    setQty(
                      Math.min(
                        maxQuantity,
                        qty + 1
                      )
                    )
                  }
                  disabled={
                    outOfStock ||
                    qty >=
                      maxQuantity
                  }
                >

                  <Plus
                    size={16}
                  />

                </button>

              </div>


              {/* ADD TO BAG */}

              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={
                  handleAddToBag
                }
                disabled={
                  outOfStock
                }
                style={{
                  opacity:
                    outOfStock
                      ? 0.55
                      : 1,

                  cursor:
                    outOfStock
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >

                <ShoppingBag
                  size={18}
                />

                {outOfStock
                  ? 'Sold Out'
                  : 'Add to Bag'}

              </button>


              {/* WISHLIST */}

              <button
                type="button"
                aria-label={
                  liked
                    ? 'Remove from wishlist'
                    : 'Add to wishlist'
                }
                className="btn btn-outline"
                onClick={() =>
                  toggleWishlist(
                    product.id
                  )
                }
              >

                <Heart
                  fill={
                    liked
                      ? '#762438'
                      : 'none'
                  }

                  color={
                    liked
                      ? '#762438'
                      : 'currentColor'
                  }
                />

              </button>

            </div>


            {/* WHATSAPP */}

            <a
              className="btn btn-dark mt-3 w-full"
              href={
                WHATSAPP_NUMBER
                  ? whatsappUrl
                  : '#'
              }
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {

                if (
                  !WHATSAPP_NUMBER
                ) {

                  event.preventDefault();

                  console.error(
                    'NEXT_PUBLIC_WHATSAPP_NUMBER is not configured.'
                  );

                }

              }}
            >
              Order on WhatsApp
            </a>


            {/* BASIC SPECS */}

            <div className="specs">


              <div className="spec">

                <span>
                  Category
                </span>

                <b>
                  {product.category ||
                    '—'}
                </b>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            EXTRA DETAILS
        ================================================= */}

        <div
          className="product-extra-details"
        >

          {product.specifications && (

            <div className="card p-5">

              <h2
                className="serif text-xl text-[#132b49]"
              >
                Specifications
              </h2>


              <div
                className="muted mt-3"
                style={{
                  whiteSpace:
                    'pre-line',

                  lineHeight:
                    1.7,
                }}
              >
                {product.specifications}
              </div>

            </div>

          )}


          {product.productCare && (

            <div className="card p-5">

              <h2
                className="serif text-xl text-[#132b49]"
              >
                Product Care
              </h2>


              <div
                className="muted mt-3"
                style={{
                  whiteSpace:
                    'pre-line',

                  lineHeight:
                    1.7,
                }}
              >
                {product.productCare}
              </div>

            </div>

          )}


          {product.moreInfo && (

            <div className="card p-5">

              <h2
                className="serif text-xl text-[#132b49]"
              >
                More Information
              </h2>


              <div
                className="muted mt-3"
                style={{
                  whiteSpace:
                    'pre-line',

                  lineHeight:
                    1.7,
                }}
              >
                {product.moreInfo}
              </div>

            </div>

          )}


          {/* DELIVERY + QUALITY */}

          <div
            className="grid gap-3 sm:grid-cols-2"
          >

            <div
              className="card flex gap-3 p-4"
            >

              <Truck
                size={22}
                className="text-[#762438]"
              />

              <div>

                <b>
                  Delivery
                </b>

                <div className="text-xs muted">
                  India-wide shipping
                </div>

              </div>

            </div>


            <div
              className="card flex gap-3 p-4"
            >

              <ShieldCheck
                size={22}
                className="text-[#762438]"
              />

              <div>

                <b>
                  Quality promise
                </b>

                <div className="text-xs muted">
                  Curated by Shivaay
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>

  );

}