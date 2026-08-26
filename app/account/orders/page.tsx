'use client';

import Link from 'next/link';

import {
  ArrowLeft,
  Package,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

import {
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
   ORDER TYPE
========================================================= */

type UserOrderItem = {
  name?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  image?: string;
};


type UserOrder = {
  _id: string;
  orderId?: string;
  total?: number;
  status?: string;
  paymentMethod?: string;
  orderSource?: string;
  createdAt?: string;
  items?: UserOrderItem[];
};


/* =========================================================
   PAGE
========================================================= */

export default function OrdersPage() {

  const router =
    useRouter();


  /* =======================================================
     AUTH
  ======================================================= */

  const [checkingAuth, setCheckingAuth] =
    useState(true);


  /* =======================================================
     ORDERS
  ======================================================= */

  const [orders, setOrders] =
    useState<UserOrder[]>([]);


  /* =======================================================
     LOADING
  ======================================================= */

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
      }
    );

  };


  /* =======================================================
     STATUS
  ======================================================= */

  const formatStatus = (
    status?: string
  ) => {

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

  };


  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  const loadOrders =
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
            `${API_URL}/api/orders`,
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
           AUTH EXPIRED
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
           RESPONSE
        ===================================== */

        let data: any =
          null;


        try {

          data =
            await response.json();

        } catch {

          throw new Error(
            'Invalid orders response from server.'
          );

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            'Unable to load your orders.'
          );

        }


        if (
          !Array.isArray(
            data
          )
        ) {

          throw new Error(
            'Invalid orders data received from backend.'
          );

        }


        setOrders(
          data
        );

      } catch (err) {

        console.error(
          'Orders loading error:',
          err
        );


        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load orders.'
        );

      } finally {

        setLoading(
          false
        );

        setCheckingAuth(
          false
        );

      }

    };


  /* =======================================================
     INITIAL LOAD
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

      router.replace(
        '/login'
      );

      return;
    }


    if (
      role === 'admin'
    ) {

      router.replace(
        '/admin'
      );

      return;
    }


    setCheckingAuth(
      false
    );


    loadOrders();

  }, [router]);


  /* =======================================================
     AUTH LOADING
  ======================================================= */

  if (
    checkingAuth
  ) {

    return (

      <main className="page">

        <div className="container">

          <div
            style={{
              minHeight:
                '50vh',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',
            }}
          >

            <p className="muted">
              Loading orders...
            </p>

          </div>

        </div>

      </main>

    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <main className="page">

      <div className="container">


        {/* =================================================
            HEADER
        ================================================= */}

        <Link
          href="/account"
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

          Back to Account

        </Link>


        <div className="eyebrow">
          Your shopping history
        </div>


        <div
          className="flex flex-wrap items-end justify-between gap-3"
        >

          <div>

            <h1 className="section-title !text-left !text-[42px]">
              My Orders
            </h1>

            <p className="muted">
              View your orders and track their status.
            </p>

          </div>


          <button
            type="button"
            className="btn btn-outline"
            onClick={
              loadOrders
            }
            disabled={
              loading
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

            {loading
              ? 'Refreshing...'
              : 'Refresh'}

          </button>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div
            className="card mt-5 p-4"
            style={{
              background:
                'rgba(118, 36, 56, 0.07)',

              color:
                '#762438',

              fontSize:
                13,
            }}
          >

            {error}

          </div>

        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div
            className="card mt-6 p-10 text-center"
          >

            <RefreshCw
              size={28}
              className="mx-auto mb-3 animate-spin text-[#c7a35a]"
            />

            <p className="muted">
              Loading your orders...
            </p>

          </div>

        ) : orders.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div
            className="card mt-6 p-12 text-center"
          >

            <ShoppingBag
              size={42}
              className="mx-auto mb-4 text-[#762438]"
            />


            <h2 className="serif text-3xl text-[#132b49]">
              No orders yet
            </h2>


            <p className="muted mt-2">
              Your orders will appear here after you place one.
            </p>


            <Link
              href="/shop"
              className="btn btn-primary mt-5"
            >
              Start Shopping
            </Link>

          </div>

        ) : (

          /* =================================================
             ORDER LIST
          ================================================= */

          <div
            className="mt-6"
            style={{
              display:
                'grid',

              gap:
                16,
            }}
          >

            {orders.map(
              (
                order
              ) => {

                const itemCount =
                  (
                    order.items ||
                    []
                  ).reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      Number(
                        item.quantity ??
                        item.qty ??
                        1
                      ),
                    0
                  );


                /*
                  IMPORTANT:
                  Prefer custom orderId like
                  SPMT8UOYWYKYBW.
                  Fall back to Mongo _id.
                */

                const orderLink =
                  order.orderId ||
                  order._id;


                return (

                  <Link
                    key={
                      order._id
                    }
                    href={`/account/orders/${orderLink}`}
                    className="card"
                    style={{
                      display:
                        'block',

                      padding:
                        24,

                      textDecoration:
                        'none',

                      color:
                        'inherit',

                      cursor:
                        'pointer',

                      transition:
                        'transform .2s ease, box-shadow .2s ease',
                    }}
                  >

                    {/* =================================
                        ORDER HEADER
                    ================================= */}

                    <div
                      className="flex flex-wrap items-start justify-between gap-4"
                    >

                      <div>

                        <div
                          style={{
                            display:
                              'flex',

                            alignItems:
                              'center',

                            gap:
                              8,
                          }}
                        >

                          <Package
                            size={18}
                            className="text-[#762438]"
                          />

                          <strong
                            style={{
                              color:
                                '#132b49',

                              fontSize:
                                16,
                            }}
                          >

                            #
                            {
                              order.orderId ||
                              order._id.slice(
                                -8
                              )
                            }

                          </strong>

                        </div>


                        <p
                          className="muted"
                          style={{
                            marginTop:
                              6,

                            fontSize:
                              12,
                          }}
                        >

                          {formatDate(
                            order.createdAt
                          )}

                          {' · '}

                          {itemCount}
                          {' '}
                          {itemCount === 1
                            ? 'item'
                            : 'items'}

                        </p>

                      </div>


                      {/* STATUS */}

                      <span
                        style={{
                          display:
                            'inline-flex',

                          alignItems:
                            'center',

                          padding:
                            '6px 10px',

                          borderRadius:
                            999,

                          background:
                            'rgba(118,36,56,.08)',

                          color:
                            '#762438',

                          fontSize:
                            12,

                          fontWeight:
                            600,
                        }}
                      >

                        {
                          formatStatus(
                            order.status
                          )
                        }

                      </span>

                    </div>


                    {/* =================================
                        ITEMS
                    ================================= */}

                    <div
                      className="mt-5"
                      style={{
                        display:
                          'grid',

                        gap:
                          10,
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


                          const image =
                            item.image ||
                            '';


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
                                  10,

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
                                    52,

                                  height:
                                    65,

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

                                {image ? (

                                  <img
                                    src={
                                      image
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
                                        20
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


                                <span
                                  className="muted"
                                  style={{
                                    fontSize:
                                      12,

                                    display:
                                      'block',

                                    marginTop:
                                      4,
                                  }}
                                >

                                  Qty:
                                  {' '}
                                  {qty}

                                </span>

                              </div>


                              {/* PRICE */}

                              <strong
                                style={{
                                  color:
                                    '#762438',
                                }}
                              >

                                ₹
                                {(
                                  Number(
                                    item.price ||
                                    0
                                  ) *
                                  qty
                                ).toLocaleString(
                                  'en-IN'
                                )}

                              </strong>

                            </div>

                          );

                        }
                      )}

                    </div>


                    {/* =================================
                        ORDER FOOTER
                    ================================= */}

                    <div
                      className="mt-5"
                      style={{
                        borderTop:
                          '1px solid rgba(0,0,0,.08)',

                        paddingTop:
                          16,

                        display:
                          'flex',

                        alignItems:
                          'center',

                        justifyContent:
                          'space-between',

                        gap:
                          12,

                        flexWrap:
                          'wrap',
                      }}
                    >

                      <div>

                        <span
                          className="muted"
                          style={{
                            fontSize:
                              12,
                          }}
                        >
                          Payment
                        </span>


                        <strong
                          style={{
                            display:
                              'block',

                            marginTop:
                              3,

                            textTransform:
                              'uppercase',

                            fontSize:
                              12,
                          }}
                        >

                          {
                            order.paymentMethod ||
                            'COD'
                          }

                        </strong>

                      </div>


                      <div>

                        <span
                          className="muted"
                          style={{
                            fontSize:
                              12,
                          }}
                        >
                          Total
                        </span>


                        <strong
                          style={{
                            display:
                              'block',

                            marginTop:
                              3,

                            color:
                              '#762438',

                            fontSize:
                              17,
                          }}
                        >

                          {
                            formatCurrency(
                              order.total
                            )
                          }

                        </strong>

                      </div>

                    </div>

                  </Link>

                );

              }
            )}

          </div>

        )}

      </div>

    </main>
  );
}