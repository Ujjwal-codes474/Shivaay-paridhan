'use client';

import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  Package,
  RefreshCw,
} from 'lucide-react';

import {
  useParams,
  useRouter,
} from 'next/navigation';


/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';


/* =========================================================
   CUSTOMER
========================================================= */

type Customer = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  pinCode?: string;
};


/* =========================================================
   ORDER ITEM
========================================================= */

type OrderItem = {
  productId?: string;
  id?: string;

  name?: string;

  quantity?: number;
  qty?: number;

  price?: number;

  image?: string;
  images?: string[];
};


/* =========================================================
   ORDER
========================================================= */

type Order = {
  _id: string;

  orderId?: string;

  userId?: string | null;

  customer?: Customer;

  items?: OrderItem[];

  total?: number;

  paymentMethod?: string;

  orderSource?: string;

  status?: string;

  createdAt?: string;

  updatedAt?: string;
};


/* =========================================================
   IMAGE URL
========================================================= */

function resolveImageUrl(
  image?: string
) {

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
   PAGE
========================================================= */

export default function AdminOrderDetail() {

  const params =
    useParams();

  const router =
    useRouter();


  const orderId =
    String(
      params.id
    );


  /* =======================================================
     ORDER
  ======================================================= */

  const [order, setOrder] =
    useState<Order | null>(
      null
    );


  /* =======================================================
     LOADING
  ======================================================= */

  const [loading, setLoading] =
    useState(true);


  /* =======================================================
     REFRESH
  ======================================================= */

  const [refreshing, setRefreshing] =
    useState(false);


  /* =======================================================
     ERROR
  ======================================================= */

  const [error, setError] =
    useState('');


  /* =======================================================
     CLEAR AUTH
  ======================================================= */

  const clearAuthAndLogin = () => {

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

  };


  /* =======================================================
     LOAD ORDER
  ======================================================= */

  const loadOrder =
    useCallback(
      async (
        token: string,
        isRefresh = false
      ) => {

        try {

          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');


          const response =
            await fetch(
              `${API_URL}/api/orders/${orderId}`,
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


          /* =========================================
             AUTH
          ========================================= */

          if (
            response.status === 401
          ) {

            clearAuthAndLogin();

            return;

          }


          /* =========================================
             FORBIDDEN
          ========================================= */

          if (
            response.status === 403
          ) {

            router.replace(
              '/'
            );

            return;

          }


          let data: any =
            null;


          try {

            data =
              await response.json();

          } catch {

            throw new Error(
              'Invalid response received from backend.'
            );

          }


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              'Failed to load order.'
            );

          }


          setOrder(
            data
          );

        } catch (err) {

          console.error(
            'Order detail error:',
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load order.'
          );

        } finally {

          setLoading(false);
          setRefreshing(false);

        }

      },
      [
        orderId,
        router,
      ]
    );


  /* =======================================================
     AUTH + INITIAL LOAD
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
      role !== 'admin'
    ) {

      router.replace(
        '/'
      );

      return;

    }


    loadOrder(
      token
    );

  }, [
    router,
    loadOrder,
  ]);


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    () => {

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


      loadOrder(
        token,
        true
      );

    };


  /* =======================================================
     FORMAT CURRENCY
  ======================================================= */

  const formatCurrency =
    (
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

  const formatDate =
    (
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


      return date.toLocaleString(
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
     STATUS
  ======================================================= */

  const formatStatus =
    (
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
     LOADING
  ======================================================= */

  if (
    loading
  ) {

    return (

      <main className="page">

        <div className="container">

          <div
            style={{
              minHeight:
                '50vh',

              display:
                'grid',

              placeItems:
                'center',
            }}
          >

            <p className="muted">
              Loading order...
            </p>

          </div>

        </div>

      </main>

    );

  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error
  ) {

    return (

      <main className="page">

        <div className="container">


          <Link
            href="/admin/orders"
            className="text-link"
          >

            <ArrowLeft
              size={16}
              style={{
                display:
                  'inline',

                marginRight:
                  5,
              }}
            />

            Back to Orders

          </Link>


          <div
            className="card mt-6 p-8"
          >

            <h2 className="serif text-2xl text-[#132b49]">
              Unable to load order
            </h2>


            <p className="muted mt-2">
              {error}
            </p>


            <button
              type="button"
              className="btn btn-primary mt-5"
              onClick={
                handleRefresh
              }
              disabled={
                refreshing
              }
            >

              <RefreshCw
                size={16}
              />

              Retry

            </button>

          </div>

        </div>

      </main>

    );

  }


  /* =======================================================
     ORDER NOT FOUND
  ======================================================= */

  if (
    !order
  ) {

    return (

      <main className="page">

        <div className="container">


          <Link
            href="/admin/orders"
            className="text-link"
          >

            <ArrowLeft
              size={16}
              style={{
                display:
                  'inline',

                marginRight:
                  5,
              }}
            />

            Back to Orders

          </Link>


          <div
            className="card mt-6 p-8 text-center"
          >

            <Package
              size={36}
              className="mx-auto mb-3 text-[#c7a35a]"
            />


            <h2 className="serif text-2xl text-[#132b49]">
              Order not found
            </h2>

          </div>

        </div>

      </main>

    );

  }


  /* =======================================================
     TOTAL ITEM COUNT
  ======================================================= */

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


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <main className="page">

      <div className="container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="mb-6"
        >

          <Link
            href="/admin/orders"
            className="text-link"
          >

            <ArrowLeft
              size={16}
              style={{
                display:
                  'inline',

                marginRight:
                  5,
              }}
            />

            Back to Orders

          </Link>


          <div className="eyebrow mt-5">
            Order details
          </div>


          <div
            className="flex flex-wrap items-end justify-between gap-3"
          >

            <div>

              <h1 className="section-title !text-left !text-[42px]">

                {order.orderId
                  ? `#${order.orderId}`
                  : `#${String(
                      order._id
                    ).slice(-8)}`}

              </h1>


              <p className="muted">
                Placed on{' '}
                {formatDate(
                  order.createdAt
                )}
              </p>

            </div>


            <button
              type="button"
              className="btn btn-outline"
              onClick={
                handleRefresh
              }
              disabled={
                refreshing
              }
            >

              <RefreshCw
                size={16}
              />

              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}

            </button>

          </div>

        </div>


        {/* =================================================
            CUSTOMER + SUMMARY
        ================================================= */}

        <div
          className="grid gap-5 lg:grid-cols-2"
        >


          {/* CUSTOMER */}

          <div className="card p-6">

            <h2 className="serif text-2xl text-[#132b49]">
              Customer
            </h2>


            <div className="mt-4">

              <p>
                <strong>
                  Name:
                </strong>{' '}

                {order.customer?.name ||
                  '—'}
              </p>


              <p className="mt-2">

                <strong>
                  Email:
                </strong>{' '}

                {order.customer?.email ||
                  '—'}

              </p>


              <p className="mt-2">

                <strong>
                  Phone:
                </strong>{' '}

                {order.customer?.phone ||
                  '—'}

              </p>


              {order.customer?.address && (

                <p className="mt-2">

                  <strong>
                    Address:
                  </strong>{' '}

                  {order.customer.address}

                </p>

              )}


              {order.customer?.city && (

                <p className="mt-2">

                  <strong>
                    City:
                  </strong>{' '}

                  {order.customer.city}

                </p>

              )}


              {order.customer?.pinCode && (

                <p className="mt-2">

                  <strong>
                    PIN:
                  </strong>{' '}

                  {order.customer.pinCode}

                </p>

              )}

            </div>

          </div>


          {/* SUMMARY */}

          <div className="card p-6">

            <h2 className="serif text-2xl text-[#132b49]">
              Order Summary
            </h2>


            <div className="mt-4">

              <p>

                <strong>
                  Status:
                </strong>{' '}

                <span
                  style={{
                    display:
                      'inline-block',

                    padding:
                      '4px 9px',

                    marginLeft:
                      4,

                    borderRadius:
                      999,

                    background:
                      'rgba(118, 36, 56, 0.08)',

                    color:
                      '#762438',

                    fontSize:
                      12,
                  }}
                >
                  {formatStatus(
                    order.status
                  )}
                </span>

              </p>


              <p className="mt-3">

                <strong>
                  Payment:
                </strong>{' '}

                {order.paymentMethod ||
                  '—'}

              </p>


              <p className="mt-2">

                <strong>
                  Source:
                </strong>{' '}

                {order.orderSource ||
                  'website'}

              </p>


              <p className="mt-2">

                <strong>
                  Items:
                </strong>{' '}

                {itemCount}

              </p>


              <p className="mt-2">

                <strong>
                  Total:
                </strong>{' '}

                <span
                  style={{
                    color:
                      '#762438',

                    fontWeight:
                      700,
                  }}
                >
                  {formatCurrency(
                    order.total
                  )}
                </span>

              </p>

            </div>

          </div>

        </div>


        {/* =================================================
            ITEMS
        ================================================= */}

        <div
          className="card mt-5 p-6"
        >

          <h2 className="serif text-2xl text-[#132b49]">
            Order Items
          </h2>


          {order.items &&
          order.items.length > 0 ? (

            <div className="mt-5">

              {order.items.map(
                (
                  item,
                  index
                ) => {

                  const quantity =
                    Number(
                      item.quantity ??
                      item.qty ??
                      1
                    );


                  const image =
                    resolveImageUrl(
                      item.image ||
                      item.images?.[0]
                    );


                  const itemTotal =
                    Number(
                      item.price || 0
                    ) *
                    quantity;


                  return (

                    <div
                      key={
                        item.productId ||
                        item.id ||
                        index
                      }
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap:
                          14,

                        padding:
                          '14px 0',

                        borderBottom:
                          '1px solid rgba(0,0,0,0.08)',
                      }}
                    >


                      {/* IMAGE */}

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
                              64,

                            height:
                              80,

                            objectFit:
                              'cover',

                            borderRadius:
                              8,

                            background:
                              '#f5eee5',

                            flexShrink:
                              0,
                          }}
                        />

                      ) : (

                        <div
                          style={{
                            width:
                              64,

                            height:
                              80,

                            display:
                              'grid',

                            placeItems:
                              'center',

                            borderRadius:
                              8,

                            background:
                              '#f5eee5',

                            color:
                              '#762438',

                            flexShrink:
                              0,
                          }}
                        >
                          SP
                        </div>

                      )}


                      {/* INFO */}

                      <div
                        style={{
                          flex:
                            1,

                          minWidth:
                            0,
                        }}
                      >

                        <strong>
                          {
                            item.name ||
                            'Product'
                          }
                        </strong>


                        <p
                          className="muted mt-1"
                        >
                          Qty:{' '}
                          {quantity}
                        </p>


                        <p
                          className="muted"
                          style={{
                            fontSize:
                              12,
                          }}
                        >
                          Unit price:{' '}
                          {formatCurrency(
                            item.price
                          )}
                        </p>

                      </div>


                      {/* ITEM TOTAL */}

                      <strong
                        style={{
                          color:
                            '#762438',

                          whiteSpace:
                            'nowrap',
                        }}
                      >
                        {formatCurrency(
                          itemTotal
                        )}
                      </strong>

                    </div>

                  );

                }
              )}

            </div>

          ) : (

            <p className="muted mt-4">
              No items found for this order.
            </p>

          )}


          {/* =================================================
              TOTAL
          ================================================= */}

          <div
            style={{
              marginTop:
                20,

              display:
                'flex',

              justifyContent:
                'flex-end',

              alignItems:
                'center',

              gap:
                20,

              fontSize:
                18,

              flexWrap:
                'wrap',
            }}
          >

            <strong>
              Total
            </strong>


            <strong
              style={{
                color:
                  '#762438',
              }}
            >
              {formatCurrency(
                order.total
              )}
            </strong>

          </div>

        </div>

      </div>

    </main>

  );
}