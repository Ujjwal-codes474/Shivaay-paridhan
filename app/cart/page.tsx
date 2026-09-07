'use client';

import Link from 'next/link';

import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Tag,
  MessageCircle,
  LoaderCircle,
  CheckCircle2,
} from 'lucide-react';

import { useCart } from '../../store/useCart';

import { useState } from 'react';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   WHATSAPP NUMBER
========================================================= */

const WHATSAPP_NUMBER =
  (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '')
    .replace(/\D/g, '')
    .replace(/^0(?=\d{10}$)/, '')
    .replace(/^(?!91)(\d{10})$/, '91$1');


/* =========================================================
   CART PAGE
========================================================= */

export default function Cart() {

  const {
    items,
    inc,
    dec,
    remove,
    clear,
  } = useCart();


  /* =======================================================
     COUPON
  ======================================================= */

  const [coupon, setCoupon] =
    useState('');

  const [appliedCoupon, setAppliedCoupon] =
    useState('');

  const [couponDiscount, setCouponDiscount] =
    useState(0);

  const [couponMessage, setCouponMessage] =
    useState('');

  const [couponError, setCouponError] =
    useState('');

  const [couponLoading, setCouponLoading] =
    useState(false);


  /* =======================================================
     WHATSAPP
  ======================================================= */

  const [whatsappLoading, setWhatsappLoading] =
    useState(false);

  const [whatsappError, setWhatsappError] =
    useState('');

  const [orderCreated, setOrderCreated] =
    useState(false);

  const [createdOrderId, setCreatedOrderId] =
    useState('');


  /* =======================================================
     SUBTOTAL
  ======================================================= */

  const subtotal =
    items.reduce(
      (total, item) =>
        total +
        Number(
          item.product.price || 0
        ) *
          item.qty,
      0
    );


  /* =======================================================
     SHIPPING
  ======================================================= */

  const shipping =
    subtotal >= 999 ||
    subtotal === 0
      ? 0
      : 99;


  /* =======================================================
     DISCOUNT
  ======================================================= */

  const discount =
    Math.min(
      Math.max(
        couponDiscount,
        0
      ),
      subtotal
    );


  /* =======================================================
     TOTAL
  ======================================================= */

  const total =
    subtotal +
    shipping -
    discount;


  /* =======================================================
     APPLY COUPON
  ======================================================= */

  const handleApplyCoupon =
    async () => {

      const code =
        coupon
          .trim()
          .toUpperCase();


      if (!code) {

        setCouponError(
          'Please enter a coupon code.'
        );

        setCouponMessage('');

        return;
      }


      if (
        subtotal <= 0
      ) {

        setCouponError(
          'Add a product before applying a coupon.'
        );

        return;
      }


      try {

        setCouponLoading(
          true
        );

        setCouponError('');
        setCouponMessage('');
        setWhatsappError('');


        const response =
          await fetch(
            `${API_URL}/api/coupons/validate`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Accept:
                  'application/json',
              },

              body:
                JSON.stringify({
                  code,
                  orderAmount:
                    subtotal,
                }),

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
          !response.ok
        ) {

          setCouponDiscount(
            0
          );

          setAppliedCoupon('');

          throw new Error(
            data?.message ||
              'Invalid or expired coupon.'
          );
        }


        const backendDiscount =
          Number(
            data?.discountAmount ??
              data?.discount ??
              data?.amount ??
              0
          );


        if (
          !Number.isFinite(
            backendDiscount
          ) ||
          backendDiscount <= 0
        ) {

          setCouponDiscount(
            0
          );

          setAppliedCoupon('');

          throw new Error(
            data?.message ||
              'Coupon is not applicable to this order.'
          );
        }


        const safeDiscount =
          Math.min(
            backendDiscount,
            subtotal
          );


        setCouponDiscount(
          safeDiscount
        );

        setAppliedCoupon(
          String(
            data?.couponCode ||
            code
          ).toUpperCase()
        );

        setCouponMessage(
          data?.message ||
            `${code} applied successfully.`
        );

      } catch (
        error
      ) {

        console.error(
          'Coupon validation error:',
          error
        );


        setCouponDiscount(
          0
        );

        setAppliedCoupon('');

        setCouponMessage('');

        setCouponError(
          error instanceof Error
            ? error.message
            : 'Unable to validate coupon.'
        );

      } finally {

        setCouponLoading(
          false
        );

      }

    };


  /* =======================================================
     REMOVE COUPON
  ======================================================= */

  const handleRemoveCoupon =
    () => {

      setCoupon('');

      setAppliedCoupon('');

      setCouponDiscount(
        0
      );

      setCouponMessage('');

      setCouponError('');

    };


  /* =======================================================
     WHATSAPP ORDER
  ======================================================= */

  const handleWhatsAppOrder =
    async () => {

      if (
        whatsappLoading
      ) {
        return;
      }


      setWhatsappError('');


      /* =====================================
         CONFIGURATION
      ===================================== */

      if (
        !WHATSAPP_NUMBER
      ) {

        console.error(
          'WhatsApp ordering is not configured. Add NEXT_PUBLIC_WHATSAPP_NUMBER to .env.local.'
        );

        return;
      }


      /* =====================================
         CART
      ===================================== */

      if (
        items.length === 0
      ) {

        setWhatsappError(
          'Your bag is empty.'
        );

        return;
      }


      /* =====================================
         AUTH
      ===================================== */

      const token =
        localStorage.getItem(
          'authToken'
        );


      const savedUser =
        localStorage.getItem(
          'currentUser'
        );


      let currentUser:
        any = null;


      try {

        if (
          savedUser
        ) {

          currentUser =
            JSON.parse(
              savedUser
            );

        }

      } catch (
        error
      ) {

        console.error(
          'Current user parsing error:',
          error
        );

      }


      if (
        !token ||
        !currentUser
      ) {

        window.location.href = '/login';

        return;
      }


      /* =====================================
         USER
      ===================================== */

      const name =
        String(
          currentUser?.name ||
          ''
        ).trim();


      const phone =
        String(
          currentUser?.phone ||
          ''
        ).trim();


      const email =
        String(
          currentUser?.email ||
          ''
        )
          .trim()
          .toLowerCase();


      /* =====================================
         SAVED ADDRESS
      ===================================== */

      const savedAddress =
        currentUser?.address ||
        {};


      const line1 =
        String(
          savedAddress?.line1 ||
          ''
        ).trim();


      const line2 =
        String(
          savedAddress?.line2 ||
          ''
        ).trim();


      const city =
        String(
          savedAddress?.city ||
          ''
        ).trim();


      const state =
        String(
          savedAddress?.state ||
          ''
        ).trim();


      const pinCode =
        String(
          savedAddress?.pinCode ||
          ''
        ).trim();


      const country =
        String(
          savedAddress?.country ||
          'India'
        ).trim();


      /* =====================================
         CUSTOMER VALIDATION
      ===================================== */

      if (!name) {

        setWhatsappError(
          'Please add your name in My Account before placing the order.'
        );

        return;
      }


      if (!phone) {

        setWhatsappError(
          'Please add your phone number in My Account before placing the order.'
        );

        return;
      }


      if (
        !line1 ||
        !city ||
        !state ||
        pinCode.length !== 6
      ) {

        setWhatsappError(
          'Please save your complete delivery address in My Account before placing the order.'
        );

        return;
      }


      try {

        setWhatsappLoading(
          true
        );


        /* ==================================
           ORDER ITEMS
        ================================== */

        const orderItems =
          items.map(
            (
              item
            ) => {

              const image =
                item.product.image ||
                item.product.images?.[0] ||
                '';


              return {

                productId:
                  item.product.id,

                name:
                  item.product.name,

                price:
                  Math.round(
                    Number(
                      item.product.price ||
                      0
                    )
                  ),

                quantity:
                  item.qty,

                qty:
                  item.qty,

                image,

                images:
                  image
                    ? [image]
                    : [],

              };

            }
          );


        /* ==================================
           CUSTOMER
        ================================== */

        const customer = {

          name,

          phone,

          email,

          address:
            line2
              ? `${line1}, ${line2}`
              : line1,

          city,

          state,

          pinCode,

        };


        /* ==================================
           CREATE ORDER
        ================================== */

        const response =
          await fetch(
            `${API_URL}/api/orders`,
            {
              method:
                'POST',

              headers: {

                'Content-Type':
                  'application/json',

                Accept:
                  'application/json',

                Authorization:
                  `Bearer ${token}`,

              },

              body:
                JSON.stringify({

                  customer,

                  items:
                    orderItems,

                  couponCode:
                    appliedCoupon ||
                    null,

                  total:
                    Math.round(
                      total
                    ),

                  paymentMethod:
                    'whatsapp',

                  source:
                    'whatsapp',

                }),

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


        /* ==================================
           AUTH EXPIRED
        ================================== */

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


          setWhatsappError(
            'Your session has expired. Please login again.'
          );

          return;
        }


        /* ==================================
           API ERROR
        ================================== */

        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
              'Unable to create WhatsApp order.'
          );

        }


        /* ==================================
           CREATED ORDER
        ================================== */

        const createdOrder =
          data?.order || {};


        const orderId =
          createdOrder?.orderId ||
          createdOrder?._id ||
          '';


        setCreatedOrderId(
          String(
            orderId
          )
        );


        /* ==================================
           USE SERVER PRICING
           
           Backend is source of truth.
        ================================== */

        const serverPricing =
          data?.pricing || {};


        const serverSubtotal =
          Number(
            serverPricing?.subtotal ??
            subtotal
          );


        const serverShipping =
          Number(
            serverPricing?.shipping ??
            shipping
          );


        const serverDiscount =
          Number(
            serverPricing?.discount ??
            discount
          );


        const serverTotal =
          Number(
            serverPricing?.total ??
            total
          );


        /* ==================================
           PRODUCT MESSAGE
        ================================== */

        const productLines =
          items
            .map(
              (
                item,
                index
              ) => {

                const price =
                  Math.round(
                    Number(
                      item.product.price ||
                      0
                    )
                  );


                const itemTotal =
                  price *
                  item.qty;


                return (
                  `${index + 1}. ${item.product.name}\n` +
                  `   Qty: ${item.qty} × ₹${price.toLocaleString(
                    'en-IN'
                  )}\n` +
                  `   Item Total: ₹${itemTotal.toLocaleString(
                    'en-IN'
                  )}`
                );

              }
            )
            .join(
              '\n\n'
            );


        /* ==================================
           COUPON MESSAGE
        ================================== */

        const couponLine =
          serverDiscount > 0
            ? [
                `Coupon: ${
                  appliedCoupon ||
                  'Applied'
                }`,

                `Discount: -₹${serverDiscount.toLocaleString(
                  'en-IN'
                )}`,
              ].join(
                '\n'
              )
            : '';


        /* ==================================
           ADDRESS MESSAGE
        ================================== */

        const addressLine =
          [
            line1,
            line2,
            city,
            state,
            `PIN ${pinCode}`,
            country,
          ]
            .filter(Boolean)
            .join(
              ', '
            );


        /* ==================================
           WHATSAPP MESSAGE
        ================================== */

        const message =
          [
            '??? *SHIVAAY PARIDHAN*',
            '*NEW ORDER*',

            '',

            `*Order ID:* #${orderId}`,

            '',

            '*CUSTOMER DETAILS*',

            `Name: ${name}`,

            `Phone: ${phone}`,

            email
              ? `Email: ${email}`
              : '',

            '',

            '*DELIVERY ADDRESS*',

            addressLine,

            '',

            '*ORDER DETAILS*',

            productLines,

            '',

            '*ORDER SUMMARY*',

            `Subtotal: ${serverSubtotal.toLocaleString(
              'en-IN'
            )}`,

            `Shipping: ${
              serverShipping
                ? `${serverShipping.toLocaleString(
                    'en-IN'
                  )}`
                : 'FREE'
            }`,

            couponLine,

            `*Grand Total: ${serverTotal.toLocaleString(
              'en-IN'
            )}*`,

            '',

            '*Please confirm my order.*',

            '',

            'Thank you for shopping with *Shivaay Paridhan*. ??',

          ]
            .filter(Boolean)
            .join(
              '\n'
            );


        /* ==================================
           OPEN WHATSAPP
        ================================== */

        const whatsappUrl =
          `https://wa.me/${WHATSAPP_NUMBER}` +
          `?text=${encodeURIComponent(
            message
          )}`;


        window.open(
          whatsappUrl,
          '_blank',
          'noopener,noreferrer'
        );


      /* ==================================
   CLEAR CART AFTER SUCCESS
================================== */

clear();

try {
  localStorage.removeItem(
    'shivaay-v2-cart'
  );
} catch (storageError) {
  console.warn(
    'Cart storage cleanup warning:',
    storageError
  );
}



        /* ==================================
           SUCCESS STATE
        ================================== */

        setOrderCreated(
          true
        );


      } catch (
        error
      ) {

        console.error(
          'WhatsApp order error:',
          error
        );


        setWhatsappError(
          error instanceof Error
            ? error.message
            : 'Unable to place WhatsApp order. Please try again.'
        );

      } finally {

        setWhatsappLoading(
          false
        );

      }

    };


  /* =======================================================
     SUCCESS
  ======================================================= */

  if (
    orderCreated
  ) {

    return (

      <main className="page">

        <div className="container">

          <div
            className="card p-12 text-center"
          >

            <CheckCircle2
              className="mx-auto mb-4 text-[#166534]"
              size={52}
            />


            <div className="eyebrow">
              Order received
            </div>


            <h1 className="serif text-3xl text-[#132b49]">
              WhatsApp Order Created
            </h1>


            <p className="muted mt-2">
              Your order has been saved and
              WhatsApp has been opened with
              your order details.
            </p>


            {createdOrderId && (

              <div
                className="mt-4"
                style={{
                  fontWeight:
                    700,

                  color:
                    '#762438',
                }}
              >

                Order ID:
                {' '}
                #{createdOrderId}

              </div>

            )}


            <div
              className="mt-6 flex flex-wrap justify-center gap-3"
            >

              {createdOrderId && (

                <Link
                  href={`/account/orders/${encodeURIComponent(
                    createdOrderId
                  )}`}
                  className="btn btn-outline"
                >
                  View Order
                </Link>

              )}


              <Link
                href="/shop"
                className="btn btn-primary"
              >
                Continue Shopping
              </Link>

            </div>

          </div>

        </div>

      </main>

    );
  }


  /* =======================================================
     EMPTY CART
  ======================================================= */

  if (
    items.length ===
    0
  ) {

    return (

      <main className="page">

        <div className="container">

          <div className="eyebrow">
            Your selection
          </div>


          <h1 className="section-title !text-left !text-[42px]">
            Your Bag
          </h1>


          <div className="card p-12 text-center">

            <ShoppingBag
              className="mx-auto mb-4 text-[#762438]"
              size={42}
            />


            <h2 className="serif text-3xl text-[#132b49]">
              Your bag is empty
            </h2>


            <p className="muted mb-6">
              Discover something beautiful
              for your next occasion.
            </p>


            <Link
              className="btn btn-primary"
              href="/shop"
            >
              Continue Shopping
            </Link>

          </div>

        </div>

      </main>

    );
  }


  /* =======================================================
     MAIN
  ======================================================= */

  return (

    <main className="page">

      <div className="container">

        <div className="eyebrow">
          Your selection
        </div>


        <h1 className="section-title !text-left !text-[42px]">
          Your Bag
        </h1>


        <div className="cart-layout">


          {/* =================================================
              ITEMS
          ================================================= */}

          <div className="card">

            {items.map(
              (
                item
              ) => {

                const stock =
                  Math.max(
                    0,
                    Number(
                      item.product.stock ||
                      0
                    )
                  );


                const atMaxStock =
                  stock > 0 &&
                  item.qty >=
                    stock;


                const image =
                  item.product.image ||
                  item.product.images?.[0] ||
                  '/hero-slider.png';


                return (

                  <div
                    className="cart-item"
                    key={
                      item.product.id
                    }
                  >

                    <div className="thumb">

                      <img
                        src={image}
                        alt={
                          item.product.name
                        }
                      />

                    </div>


                    <div
                      style={{
                        minWidth:
                          0,

                        flex:
                          1,
                      }}
                    >

                      <Link
                        href={`/product/${item.product.slug}`}
                        className="serif text-lg font-bold text-[#132b49]"
                      >
                        {item.product.name}
                      </Link>


                      <div className="price mt-1">

                        ₹
                        {Math.round(
                          item.product.price
                        ).toLocaleString(
                          'en-IN'
                        )}

                      </div>


                      {stock > 0 && (

                        <div
                          className="muted mt-1"
                          style={{
                            fontSize:
                              11,
                          }}
                        >
                          {stock}
                          {' '}
                          available
                        </div>

                      )}


                      <div className="qty mt-3">

                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            dec(
                              item.product.id
                            )
                          }
                          disabled={
                            item.qty <=
                            1
                          }
                        >

                          <Minus
                            size={15}
                          />

                        </button>


                        <span>
                          {item.qty}
                        </span>


                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            inc(
                              item.product.id
                            )
                          }
                          disabled={
                            stock <= 0 ||
                            atMaxStock
                          }
                        >

                          <Plus
                            size={15}
                          />

                        </button>

                      </div>


                      {atMaxStock && (

                        <small
                          className="muted"
                          style={{
                            display:
                              'block',

                            marginTop:
                              6,

                            fontSize:
                              10,
                          }}
                        >
                          Maximum available
                          quantity reached.
                        </small>

                      )}

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        remove(
                          item.product.id
                        )
                      }
                      className="text-[#762438]"
                      aria-label={
                        `Remove ${item.product.name}`
                      }
                    >

                      <Trash2
                        size={19}
                      />

                    </button>

                  </div>

                );

              }
            )}

          </div>


          {/* =================================================
              SUMMARY
          ================================================= */}

          <aside
            className="summary card"
          >

            <h2 className="serif text-2xl text-[#132b49]">
              Order Summary
            </h2>


            {/* COUPON */}

            <div className="mt-5">

              <div
                style={{
                  display:
                    'flex',

                  gap:
                    8,
                }}
              >

                <div
                  style={{
                    position:
                      'relative',

                    flex:
                      1,
                  }}
                >

                  <Tag
                    size={16}
                    style={{
                      position:
                        'absolute',

                      left:
                        12,

                      top:
                        '50%',

                      transform:
                        'translateY(-50%)',

                      color:
                        'var(--muted)',
                    }}
                  />


                  <input
                    className="input"
                    style={{
                      paddingLeft:
                        36,
                    }}
                    placeholder="Coupon code"
                    value={
                      coupon
                    }
                    onChange={(e) => {

                      const value =
                        e.target.value.toUpperCase();


                      setCoupon(
                        value
                      );

                      setCouponError('');

                      setWhatsappError('');


                      if (
                        appliedCoupon &&
                        value !==
                          appliedCoupon
                      ) {

                        setAppliedCoupon('');

                        setCouponDiscount(
                          0
                        );

                        setCouponMessage('');

                      }

                    }}
                    disabled={
                      couponLoading
                    }
                  />

                </div>


                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={
                    appliedCoupon
                      ? handleRemoveCoupon
                      : handleApplyCoupon
                  }
                  disabled={
                    couponLoading
                  }
                >

                  {couponLoading
                    ? 'Checking...'
                    : appliedCoupon
                      ? 'Remove'
                      : 'Apply'}

                </button>

              </div>


              {couponMessage && (

                <div
                  className="mt-2 text-xs"
                  style={{
                    color:
                      '#166534',
                  }}
                >
                  {couponMessage}
                </div>

              )}


              {couponError && (

                <div
                  className="mt-2 text-xs"
                  style={{
                    color:
                      '#762438',
                  }}
                >
                  {couponError}
                </div>

              )}

            </div>


            {/* TOTALS */}

            <div className="mt-6">

              <div className="summary-row">

                <span>
                  Subtotal
                </span>

                <b>
                  ₹
                  {subtotal.toLocaleString(
                    'en-IN'
                  )}
                </b>

              </div>


              <div className="summary-row">

                <span>
                  Shipping
                </span>

                <b>
                  {shipping
                    ? `₹${shipping}`
                    : 'FREE'}
                </b>

              </div>


              {discount > 0 && (

                <div className="summary-row text-[#762438]">

                  <span>
                    Discount
                  </span>

                  <b>
                    -₹
                    {discount.toLocaleString(
                      'en-IN'
                    )}
                  </b>

                </div>

              )}


              <div className="summary-row total">

                <span>
                  Total
                </span>

                <span>
                  ₹
                  {total.toLocaleString(
                    'en-IN'
                  )}
                </span>

              </div>

            </div>


            {/* WHATSAPP ERROR */}

            {whatsappError && (

              <div
                className="mt-4"
                style={{
                  padding:
                    '10px 12px',

                  borderRadius:
                    9,

                  background:
                    'rgba(118,36,56,.08)',

                  color:
                    '#762438',

                  fontSize:
                    12,

                  lineHeight:
                    1.5,
                }}
              >
                {whatsappError}
              </div>

            )}


            {/* WHATSAPP ORDER */}

            <button
              type="button"
              className="btn btn-primary mt-5 w-full"
              onClick={
                handleWhatsAppOrder
              }
              disabled={
                whatsappLoading ||
                couponLoading
              }
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                gap:
                  8,

                background:
                  '#25D366',

                borderColor:
                  '#25D366',

                color:
                  '#fff',

                opacity:
                  whatsappLoading
                    ? 0.7
                    : 1,
              }}
            >

              {whatsappLoading ? (

                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />

                  Preparing WhatsApp Order...
                </>

              ) : (

                <>
                  <MessageCircle
                    size={18}
                  />

                  Order on WhatsApp
                </>

              )}

            </button>


            <p
              className="muted"
              style={{
                marginTop:
                  8,

                textAlign:
                  'center',

                fontSize:
                  11,

                lineHeight:
                  1.5,
              }}
            >
              Your saved delivery address and
              order details will be sent to
              WhatsApp.
            </p>


            <Link
              className="btn btn-outline mt-3 w-full"
              href="/shop"
            >
              Continue Shopping
            </Link>

          </aside>

        </div>

      </div>

    </main>

  );
}