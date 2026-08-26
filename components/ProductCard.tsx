'use client';

import Link from 'next/link';

import {
  Heart,
  ShoppingBag,
  Star,
} from 'lucide-react';

import {
  useWishlist,
} from '../store/useWishlist';

import {
  useCart,
} from '../store/useCart';


/* =========================================================
   PRODUCT TYPE
========================================================= */

export type ProductCardProduct = {
  id: string;

  slug: string;

  name: string;

  price: number;

  oldPrice?: number;

  category?: string;

  fabric?: string;

  color?: string;

  occasion?: string;

  description?: string;

  image?: string;

  images?: string[];

  rating?: number;

  stock?: number;

  featured?: boolean;
};


/* =========================================================
   PRODUCT CARD
========================================================= */

export default function ProductCard({
  product,
}: {
  product: ProductCardProduct;
}) {

  /* =======================================================
     WISHLIST
  ======================================================= */

  const liked =
    useWishlist(
      (state) =>
        state.ids.includes(
          product.id
        )
    );


  const toggleWishlist =
    useWishlist(
      (state) =>
        state.toggle
    );


  /* =======================================================
     CART
  ======================================================= */

  const addToCart =
    useCart(
      (state) =>
        state.add
    );


  /* =======================================================
     SAFE VALUES
  ======================================================= */

  const price =
    Number(
      product.price || 0
    );


  const oldPrice =
    product.oldPrice
      ? Number(
          product.oldPrice
        )
      : undefined;


  const stock =
    Math.max(
      0,
      Number(
        product.stock || 0
      )
    );


  const rating =
    Number(
      product.rating || 0
    );


  const outOfStock =
    stock <= 0;


  /* =======================================================
     DISCOUNT
  ======================================================= */

  const discount =
    oldPrice &&
    oldPrice > price
      ? Math.round(
          (
            (
              oldPrice -
              price
            ) /
            oldPrice
          ) *
            100
        )
      : 0;


  /* =======================================================
     IMAGE
  ======================================================= */

  const image =
    product.image ||
    product.images?.[0] ||
    '/hero-slider.png';


  /* =======================================================
     ADD TO CART
  ======================================================= */

  const handleAddToCart =
    () => {

      if (
        outOfStock
      ) {
        return;
      }

      addToCart(
        product as any
      );
    };


  /* =======================================================
     WISHLIST
  ======================================================= */

  const handleWishlist =
    () => {

      toggleWishlist(
        product.id
      );
    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <article
      className="product-card"
    >

      {/* =================================================
          PRODUCT MEDIA
      ================================================= */}

      <div
        className="product-media"
      >

        {/* IMAGE */}

        <Link
          href={`/product/${product.slug}`}
          aria-label={`View ${product.name}`}
        >

          <img
            src={
              image
            }
            alt={
              product.name
            }
            loading="lazy"
          />

        </Link>


        {/* =================================================
            BADGES
        ================================================= */}

        <div
          className="product-badges"
        >

          {product.featured && (
            <span>
              Best Seller
            </span>
          )}


          {discount > 0 && (
            <span
              className="sale-badge"
            >
              {discount}% Off
            </span>
          )}


          {outOfStock && (
            <span
              className="sale-badge"
            >
              Out of Stock
            </span>
          )}

        </div>


        {/* =================================================
            WISHLIST BUTTON
        ================================================= */}

        <button
          type="button"
          aria-label={
            liked
              ? 'Remove from wishlist'
              : 'Add to wishlist'
          }
          className={`wishlist-btn ${
            liked
              ? 'is-liked'
              : ''
          }`}
          onClick={
            handleWishlist
          }
        >

          <Heart
            size={18}
            fill={
              liked
                ? 'currentColor'
                : 'none'
            }
          />

        </button>


        {/* =================================================
            QUICK ADD
        ================================================= */}

        {!outOfStock && (
          <button
            type="button"
            className="quick-add"
            onClick={
              handleAddToCart
            }
          >

            <ShoppingBag
              size={16}
            />

            Quick Add

          </button>
        )}

      </div>


      {/* =================================================
          PRODUCT INFORMATION
      ================================================= */}

      <div
        className="product-copy"
      >

        {/* META */}

        <div
          className="product-meta"
        >

          <span>
            {product.fabric ||
              product.category ||
              'Shivaay Paridhan'}
          </span>


          {rating > 0 && (
            <span
              style={{
                display:
                  'inline-flex',

                alignItems:
                  'center',

                gap:
                  4,
              }}
            >

              <Star
                size={13}
                fill="currentColor"
              />

              {rating.toFixed(
                1
              )}

            </span>
          )}

        </div>


        {/* NAME */}

        <Link
          href={`/product/${product.slug}`}
        >

          <h3>
            {product.name}
          </h3>

        </Link>


        {/* PRICE */}

        <div
          className="price-row"
        >

          <strong>
            ₹
            {Math.round(
              price
            ).toLocaleString(
              'en-IN'
            )}
          </strong>


          {oldPrice &&
            oldPrice >
              price && (
              <del>
                ₹
                {Math.round(
                  oldPrice
                ).toLocaleString(
                  'en-IN'
                )}
              </del>
            )}

        </div>


        {/* STOCK */}

        {outOfStock ? (

          <button
            type="button"
            className="add-btn"
            disabled
            style={{
              opacity:
                0.55,

              cursor:
                'not-allowed',
            }}
          >

            <ShoppingBag
              size={16}
            />

            Out of Stock

          </button>

        ) : (

          <button
            type="button"
            className="add-btn"
            onClick={
              handleAddToCart
            }
          >

            <ShoppingBag
              size={16}
            />

            Add to Bag

          </button>

        )}

      </div>

    </article>
  );
}