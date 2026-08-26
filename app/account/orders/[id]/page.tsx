'use client';

import Link from 'next/link';

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Truck,
  XCircle,
} from 'lucide-react';

import {
  use,
  useEffect,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   PARAMS
========================================================= */

type OrderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};


/* =========================================================
   ORDER TYPES
========================================================= */

type OrderItem = {
  name?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  image?: string;
};


type CustomerAddress = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
};


type UserOrder = {
  _id: string;
  orderId?: string;

  total?: number;

  status?: string;

  paymentMethod?: string;

  orderSource?: string;

  createdAt?: string;

  updatedAt?: string;

  customer?: CustomerAddress;

  items?: OrderItem[];
};


/* =========================================================
   STATUS STEPS
========================================================= */

const statusSteps = [
  {
    key: 'pending',
    label: 'Order Placed',
    description:
      'Your order has been received.',
  },

  {
    key: 'confirmed',
    label: 'Confirmed',
    description:
      'Your order has been confirmed.',
  },

  {
    key: 'shipped',
    label: 'Shipped',
    description:
      'Your order is on the way.',
  },

  {
    key: 'delivered',
    label: 'Delivered',
    description:
      'Your order has been delivered.',
  },
];


/* =========================================================
   STATUS HELPERS
========================================================= */

function normalizeStatus(
  status?: string
) {
  const value =
    String(
      status ||
      'pending'
    ).toLowerCase();

  if (
    value ===
    'pending_whatsapp'
  ) {
    return 'pending_whatsapp';
  }

  if (
    value ===
    'cancelled'
  ) {
    return 'cancelled';
  }

  if (
    value ===
    'confirmed'
  ) {
    return 'confirmed';
  }

  if (
    value ===
    'shipped'
  ) {
    return 'shipped';
  }

  if (
    value ===
    'delivered'
  ) {
    return 'delivered';
  }

  return 'pending';
}


function formatStatus(
  status?: string
) {
  return (
    status ||
    'pending'
  )
    .replace(
      /_/g,
      ' '
    )
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}


/* =========================================================
   PAGE
========================================================= */

export default function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {

  const {
    id,
  } = use(params);


  const router =
    useRouter();


  /* =======================================================
     STATE
  ======================================================= */

  const [order, setOrder] =
    useState<UserOrder | null>(
      null
    );


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState('');


  /* =======================================================
     FORMAT CURRENCY
  ======================================================= */

  const formatCurrency = (
    value?: number
  ) => {

    return `₹${Number(
      value || 0
    ).toLocaleString(
      'en-IN'
    )}`;

  };


  /* =======================================================
     FORMAT DATE
  ======================================================= */

  const formatDate = (
    value?: string
  ) => {

    if (!value) {
      return '—';
    }


    const date =
      new Date(
        value
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '—';
    }


    return date.toLocaleDateString(
      'en-IN',
      {
        day:
          '2-digit',

        month:
          'short',

        year:
          'numeric',

        hour:
          '2-digit',

        minute:
          '2-digit',
      }
    );

  };


  /* =======================================================
     LOAD ORDER
  ======================================================= */

  useEffect(() => {

    const loadOrder =
      async () => {

        const token =
          localStorage.getItem(
            'authToken'
          );


        if (!token) {

          router.replace(
            '/login'
          );

          return;
        }


        try {

          setLoading(
            true
          );

          setError('');


          const response =
            await fetch(
              `${API_URL}/api/orders/${id}`,
              {
                method:
                  'GET',

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


          /* =====================================
             AUTH
          ===================================== */

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

            router.replace(
              '/login'
            );

            return;
          }


          /* =====================================
             FORBIDDEN
          ===================================== */

          if (
            response.status ===
            403
          ) {

            throw new Error(
              'You are not allowed to view this order.'
            );
          }


          let data: any =
            null;


          try {

            data =
              await response.json();

          } catch {

            throw new Error(
              'Invalid order response from server.'
            );
          }


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              'Unable to load order.'
            );
          }


          setOrder(
            data
          );

        } catch (err) {

          console.error(
            'Order details loading error:',
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load order.'
          );

        } finally {

          setLoading(
            false
          );
        }

      };


    loadOrder();

  }, [
    id,
    router,
  ]);


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
              minHeight:
                280,

              display:
                'grid',

              placeItems:
                'center',

              textAlign:
                'center',

              padding:
                40,
            }}
          >

            <Package
              size={34}
              className="mx-auto mb-3 animate-pulse text-[#c7a35a]"
            />

            <p className="muted">
              Loading order...
            </p>

          </div>

        </div>

      </main>
    );
  }


  /* =======================================================
     ERROR / NOT FOUND
  ======================================================= */

  if (
    error ||
    !order
  ) {

    return (

      <main className="page">

        <div className="container">

          <Link
            href="/account/orders"
            className="text-link"
            style={{
              display:
                'inline-flex',

              alignItems:
                'center',

              gap:
                6,

              marginBottom:
                20,
            }}
          >

            <ArrowLeft
              size={16}
            />

            Back to Orders

          </Link>


          <div
            className="card"
            style={{
              padding:
                48,

              textAlign:
                'center',
            }}
          >

            <Package
              size={40}
              className="mx-auto mb-4 text-[#c7a35a]"
            />


            <h1 className="serif text-3xl text-[#132b49]">
              Order not found
            </h1>


            <p className="muted mt-2">
              {error ||
                'This order is no longer available.'}
            </p>


            <Link
              href="/account/orders"
              className="btn btn-primary mt-5"
            >
              Back to Orders
            </Link>

          </div>

        </div>

      </main>
    );
  }


  /* =======================================================
     ORDER VALUES
  ======================================================= */

  const currentStatus =
    normalizeStatus(
      order.status
    );


  const isCancelled =
    currentStatus ===
    'cancelled';


  const isWhatsappPending =
    currentStatus ===
    'pending_whatsapp';


  let currentStepIndex =
    statusSteps.findIndex(
      (step) =>
        step.key ===
        currentStatus
    );


  if (
    currentStepIndex < 0
  ) {
    currentStepIndex = 0;
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <main className="page">

      <div className="container">


        {/* =================================================
            BACK
        ================================================= */}

        <Link
          href="/account/orders"
          className="text-link"
          style={{
            display:
              'inline-flex',

            alignItems:
              'center',

            gap:
              6,

            marginBottom:
              20,
          }}
        >

          <ArrowLeft
            size={16}
          />

          Back to Orders

        </Link>


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="eyebrow">
          Order details
        </div>


        <div
          className="flex flex-wrap items-end justify-between gap-4"
        >

          <div>

            <h1 className="section-title !text-left !text-[42px]">
              Order #
              {order.orderId ||
                order._id.slice(-8)}
            </h1>


            <p className="muted">

              Placed on{' '}
              {formatDate(
                order.createdAt
              )}

            </p>

          </div>


          <div
            style={{
              padding:
                '7px 12px',

              borderRadius:
                999,

              background:
                isCancelled
                  ? 'rgba(185,28,28,.10)'
                  : 'rgba(118,36,56,.08)',

              color:
                isCancelled
                  ? '#b91c1c'
                  : '#762438',

              fontSize:
                12,

              fontWeight:
                700,
            }}
          >

            {formatStatus(
              order.status
            )}

          </div>

        </div>


        {/* =================================================
            TRACKING
        ================================================= */}

        <div
          className="card mt-6 p-6"
        >

          <div>

            <span className="eyebrow">
              Order tracking
            </span>

            <h2 className="serif text-2xl text-[#132b49]">
              Track your order
            </h2>

          </div>


          {/* WHATSAPP PENDING */}

          {isWhatsappPending ? (

            <div
              className="mt-6"
              style={{
                padding:
                  '16px',

                borderRadius:
                  12,

                background:
                  '#f6eee2',

                color:
                  '#762438',
              }}
            >

              <strong>
                WhatsApp order received
              </strong>


              <p
                className="muted"
                style={{
                  marginTop:
                    5,

                  fontSize:
                    13,
                }}
              >
                Your order has been received and is waiting for confirmation.
              </p>

            </div>

          ) : isCancelled ? (

            /* CANCELLED */

            <div
              className="mt-6"
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  12,

                padding:
                  16,

                borderRadius:
                  12,

                background:
                  'rgba(185,28,28,.07)',

                color:
                  '#b91c1c',
              }}
            >

              <XCircle
                size={24}
              />

              <div>

                <strong>
                  Order cancelled
                </strong>

                <p
                  style={{
                    marginTop:
                      3,

                    fontSize:
                      12,
                  }}
                >
                  This order has been cancelled.
                </p>

              </div>

            </div>

          ) : (

            /* NORMAL TRACKING */

            <div
              className="mt-7"
              style={{
                display:
                  'grid',

                gap:
                  0,
              }}
            >

              {statusSteps.map(
                (
                  step,
                  index
                ) => {

                  const completed =
                    index <=
                    currentStepIndex;


                  const active =
                    index ===
                    currentStepIndex;


                  return (

                    <div
                      key={
                        step.key
                      }
                      style={{
                        display:
                          'grid',

                        gridTemplateColumns:
                          '34px 1fr',

                        columnGap:
                          14,

                        position:
                          'relative',
                      }}
                    >

                      {/* ICON */}

                      <div
                        style={{
                          position:
                            'relative',

                          zIndex:
                            2,

                          width:
                            34,

                          height:
                            34,

                          borderRadius:
                            '50%',

                          display:
                            'grid',

                          placeItems:
                            'center',

                          background:
                            completed
                              ? '#762438'
                              : '#eee',

                          color:
                            completed
                              ? '#fff'
                              : '#999',

                          border:
                            active
                              ? '3px solid rgba(118,36,56,.15)'
                              : 'none',
                        }}
                      >

                        {index ===
                          0 ? (

                          <Clock3
                            size={
                              16
                            }
                          />

                        ) : index ===
                          1 ? (

                          <CheckCircle2
                            size={
                              16
                            }
                          />

                        ) : index ===
                          2 ? (

                          <Truck
                            size={
                              16
                            }
                          />

                        ) : (

                          <Package
                            size={
                              16
                            }
                          />

                        )}

                      </div>


                      {/* CONNECTOR */}

                      {index <
                        statusSteps.length -
                          1 && (

                        <div
                          style={{
                            position:
                              'absolute',

                            left:
                              16,

                            top:
                              34,

                            width:
                              2,

                            height:
                              44,

                            background:
                              index <
                              currentStepIndex
                                ? '#762438'
                                : '#e5e5e5',
                          }}
                        />

                      )}


                      {/* TEXT */}

                      <div
                        style={{
                          paddingBottom:
                            index <
                            statusSteps.length -
                              1
                              ? 28
                              : 0,
                        }}
                      >

                        <strong
                          style={{
                            display:
                              'block',

                            color:
                              completed
                                ? '#132b49'
                                : '#999',
                          }}
                        >

                          {
                            step.label
                          }

                        </strong>


                        <span
                          className="muted"
                          style={{
                            display:
                              'block',

                            marginTop:
                              3,

                            fontSize:
                              12,
                          }}
                        >

                          {
                            step.description
                          }

                        </span>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </div>


        {/* =================================================
            PRODUCTS
        ================================================= */}

        <div
          className="card mt-5 p-6"
        >

          <div>

            <span className="eyebrow">
              Your items
            </span>

            <h2 className="serif text-2xl text-[#132b49]">
              Ordered Products
            </h2>

          </div>


          <div
            className="mt-5"
            style={{
              display:
                'grid',

              gap:
                12,
            }}
          >

            {(
              order.items ||
              []
            ).map(
              (
                item,
                index
              ) => {

                const qty =
                  Number(
                    item.quantity ??
                    item.qty ??
                    1
                  );


                return (

                  <div
                    key={
                      `${order._id}-${index}`
                    }
                    style={{
                      display:
                        'flex',

                      alignItems:
                        'center',

                      gap:
                        12,

                      padding:
                        12,

                      borderRadius:
                        10,

                      background:
                        '#f7f3ee',
                    }}
                  >

                    {/* IMAGE */}

                    <div
                      style={{
                        width:
                          62,

                        height:
                          76,

                        borderRadius:
                          8,

                        overflow:
                          'hidden',

                        background:
                          '#eee',

                        flexShrink:
                          0,
                      }}
                    >

                      {item.image ? (

                        <img
                          src={
                            item.image
                          }
                          alt={
                            item.name ||
                            'Product'
                          }
                          style={{
                            width:
                              '100%',

                            height:
                              '100%',

                            objectFit:
                              'cover',
                          }}
                        />

                      ) : (

                        <div
                          style={{
                            width:
                              '100%',

                            height:
                              '100%',

                            display:
                              'grid',

                            placeItems:
                              'center',
                          }}
                        >

                          <Package
                            size={
                              22
                            }
                          />

                        </div>

                      )}

                    </div>


                    {/* INFO */}

                    <div
                      style={{
                        flex:
                          1,
                      }}
                    >

                      <strong
                        style={{
                          display:
                            'block',

                          color:
                            '#132b49',
                        }}
                      >

                        {
                          item.name ||
                          'Product'
                        }

                      </strong>


                      <div
                        className="muted"
                        style={{
                          marginTop:
                            5,

                          fontSize:
                            12,
                        }}
                      >

                        Quantity:
                        {' '}
                        {qty}

                      </div>

                    </div>


                    {/* PRICE */}

                    <strong
                      style={{
                        color:
                          '#762438',
                      }}
                    >

                      {formatCurrency(
                        Number(
                          item.price ||
                          0
                        ) *
                        qty
                      )}

                    </strong>

                  </div>

                );

              }
            )}

          </div>

        </div>


        {/* =================================================
            DELIVERY ADDRESS
        ================================================= */}

        <div
          className="grid gap-5 md:grid-cols-2"
        >


          <div
            className="card mt-5 p-6"
          >

            <div className="flex items-start gap-3">

              <MapPin
                size={21}
                className="mt-1 text-[#762438]"
              />

              <div>

                <span className="eyebrow">
                  Delivery
                </span>

                <h2 className="serif text-2xl text-[#132b49]">
                  Delivery Address
                </h2>

              </div>

            </div>


            <div
              className="mt-5"
              style={{
                lineHeight:
                  1.8,

                fontSize:
                  14,
              }}
            >

              <strong>
                {
                  order.customer?.name ||
                  '—'
                }
              </strong>


              {order.customer?.address && (
                <div>
                  {
                    order.customer.address
                  }
                </div>
              )}


              {(order.customer?.city ||
                order.customer?.state) && (

                <div>

                  {
                    order.customer?.city ||
                    ''
                  }

                  {order.customer?.city &&
                    order.customer?.state
                    ? ', '
                    : ''}

                  {
                    order.customer?.state ||
                    ''
                  }

                </div>

              )}


              {order.customer?.pinCode && (

                <div>
                  PIN:
                  {' '}
                  {
                    order.customer.pinCode
                  }
                </div>

              )}


              {order.customer?.phone && (

                <div
                  className="muted"
                  style={{
                    marginTop:
                      7,
                  }}
                >
                  Phone:
                  {' '}
                  {
                    order.customer.phone
                  }
                </div>

              )}

            </div>

          </div>


          {/* =================================================
              PAYMENT SUMMARY
          ================================================= */}

          <div
            className="card mt-5 p-6"
          >

            <span className="eyebrow">
              Payment
            </span>


            <h2 className="serif text-2xl text-[#132b49]">
              Order Summary
            </h2>


            <div
              className="mt-5"
            >

              <div
                className="summary-row"
              >

                <span>
                  Payment method
                </span>

                <strong
                  style={{
                    textTransform:
                      'uppercase',
                  }}
                >
                  {
                    order.paymentMethod ||
                    'COD'
                  }
                </strong>

              </div>


              <div
                className="summary-row"
              >

                <span>
                  Order status
                </span>

                <strong>
                  {
                    formatStatus(
                      order.status
                    )
                  }
                </strong>

              </div>


              <div
                className="summary-row total"
              >

                <span>
                  Total
                </span>

                <span>
                  {
                    formatCurrency(
                      order.total
                    )
                  }
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            FOOTER ACTIONS
        ================================================= */}

        <div
          className="mt-6 flex flex-wrap gap-3"
        >

          <Link
            href="/account/orders"
            className="btn btn-outline"
          >
            <ArrowLeft
              size={16}
            />

            Back to Orders
          </Link>


          <Link
            href="/shop"
            className="btn btn-primary"
          >
            Continue Shopping
          </Link>

        </div>

      </div>

    </main>
  );
}